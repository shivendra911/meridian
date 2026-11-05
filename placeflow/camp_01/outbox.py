"""Transactional Event Outbox implementation for CAMP-01.
Ensures at-least-once delivery of domain events without distributed transaction anomalies (ADR-C01-013).
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from pymongo.client_session import ClientSession
from database.connection import get_db

# In-memory registry of event consumers for synchronous or asynchronous dispatch
_EVENT_HANDLERS: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}


def register_event_handler(event_type: str, handler: Callable[[Dict[str, Any]], None]) -> None:
    """Registers a handler callable for a specific domain event type."""
    if event_type not in _EVENT_HANDLERS:
        _EVENT_HANDLERS[event_type] = []
    _EVENT_HANDLERS[event_type].append(handler)


def publish_event(
    event_type: str,
    aggregate_type: str,
    aggregate_id: str,
    tenant_id: str,
    payload: Dict[str, Any],
    session: Optional[ClientSession] = None,
    db=None,
) -> str:
    """Appends an event to the platform outbox within the caller's active database session.

    Guarantees that state changes and domain events commit together atomistically.
    """
    if db is None:
        db = get_db()

    event_id = str(uuid.uuid4())
    event_doc = {
        "event_id": event_id,
        "event_type": event_type,
        "aggregate_type": aggregate_type,
        "aggregate_id": aggregate_id,
        "tenant_id": tenant_id,
        "payload": payload,
        "schema_version": 1,
        "status": "PENDING",
        "retry_count": 0,
        "created_at": datetime.now(timezone.utc),
        "published_at": None,
        "error_message": None,
    }

    db.platform_events_outbox.insert_one(event_doc, session=session)
    return event_id


def process_pending_outbox_events(batch_size: int = 50, filter_dict: Optional[Dict[str, Any]] = None, db=None) -> int:
    """Processes pending events from the outbox table.

    Marks events as PUBLISHED once delivered to registered handlers, or FAILED on error.
    Returns the count of successfully processed events.
    """
    if db is None:
        db = get_db()

    query = {"status": "PENDING"}
    if filter_dict:
        query.update(filter_dict)

    pending_events = list(
        db.platform_events_outbox.find(query)
        .sort("created_at", 1)
        .limit(batch_size)
    )

    processed_count = 0
    for event in pending_events:
        event_id = event["event_id"]
        event_type = event["event_type"]

        # Mark as PROCESSING
        db.platform_events_outbox.update_one(
            {"event_id": event_id, "status": "PENDING"},
            {"$set": {"status": "PROCESSING"}}
        )

        try:
            handlers = _EVENT_HANDLERS.get(event_type, [])
            for handler in handlers:
                handler(event)

            # Mark as PUBLISHED
            db.platform_events_outbox.update_one(
                {"event_id": event_id},
                {
                    "$set": {
                        "status": "PUBLISHED",
                        "published_at": datetime.now(timezone.utc),
                        "error_message": None,
                    }
                },
            )
            processed_count += 1
        except Exception as exc:
            db.platform_events_outbox.update_one(
                {"event_id": event_id},
                {
                    "$set": {
                        "status": "FAILED",
                        "error_message": str(exc),
                    },
                    "$inc": {"retry_count": 1},
                },
            )

    return processed_count

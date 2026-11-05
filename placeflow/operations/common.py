from datetime import datetime, timezone

TIER_RANK = {"Normal": 1, "Dream": 2, "Super Dream": 3}


def utcnow():
    return datetime.now(timezone.utc)


def parse_date(text):
    return datetime.strptime(text.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)


def strip_id(doc):
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def log_event(db, event_type, entity_id, message):
    """Append to the capped activity feed. Call it AFTER a transaction commits:
    MongoDB does not allow writes to capped collections inside a transaction."""
    db.activity_feed.insert_one({"event_type": event_type, "entity_id": entity_id,
                                 "message": message, "at": utcnow()})


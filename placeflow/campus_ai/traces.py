"""AI Interaction Trace Ledger & Telemetry Service.

Provides immutable read queries for statutory audits, NIRF telemetry,
security investigations, and token quota monitoring.
"""

from typing import Any, Dict, List, Optional


def query_ai_traces(
    db,
    tenant_id: str,
    actor_account_id: Optional[str] = None,
    task_type: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Retrieves immutable interaction traces filtered by tenant."""
    if not tenant_id:
        return []

    query: Dict[str, Any] = {"tenant_id": tenant_id}
    if actor_account_id:
        query["actor_account_id"] = actor_account_id
    if task_type:
        query["task_type"] = task_type

    cursor = (
        db.ai_interaction_traces.find(query, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return list(cursor)


def get_tenant_ai_metrics(db, tenant_id: str) -> Dict[str, Any]:
    """Computes total token usage, latency averages, and threat rates for a tenant."""
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {
            "$group": {
                "_id": "$tenant_id",
                "total_traces": {"$sum": 1},
                "total_prompt_tokens": {"$sum": "$prompt_tokens"},
                "total_completion_tokens": {"$sum": "$completion_tokens"},
                "avg_latency_ms": {"$avg": "$latency_ms"},
                "pip_blocked_count": {
                    "$sum": {"$cond": [{"$eq": ["$pip_passed", False]}, 1, 0]}
                },
            }
        },
    ]
    res = list(db.ai_interaction_traces.aggregate(pipeline))
    if res:
        doc = res[0]
        doc.pop("_id", None)
        return doc
    return {
        "total_traces": 0,
        "total_prompt_tokens": 0,
        "total_completion_tokens": 0,
        "avg_latency_ms": 0.0,
        "pip_blocked_count": 0,
    }


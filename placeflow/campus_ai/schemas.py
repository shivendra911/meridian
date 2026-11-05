"""MongoDB $jsonSchema validators and collection configurations for Campus AI Layer.

Governs AI tenant token quotas, rate limits, and the immutable AI Trace Ledger.
"""

AI_TENANT_QUOTAS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "tenant_id",
            "rate_limit_per_minute",
            "monthly_token_budget",
            "tokens_used_this_cycle",
            "cycle_reset_at",
            "is_throttled",
            "created_at",
        ],
        "properties": {
            "tenant_id": {"bsonType": "string"},
            "rate_limit_per_minute": {"bsonType": "number", "multipleOf": 1},
            "monthly_token_budget": {"bsonType": "number", "multipleOf": 1},
            "tokens_used_this_cycle": {"bsonType": "number", "multipleOf": 1},
            "cycle_reset_at": {"bsonType": "date"},
            "is_throttled": {"bsonType": "bool"},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": ["date", "null"]},
        },
    }
}

AI_INTERACTION_TRACES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "trace_id",
            "tenant_id",
            "actor_account_id",
            "model_id",
            "provider",
            "task_type",
            "prompt_tokens",
            "completion_tokens",
            "latency_ms",
            "pip_passed",
            "pii_masked_count",
            "created_at",
        ],
        "properties": {
            "trace_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": ["string", "null"]},
            "actor_account_id": {"bsonType": "string"},
            "model_id": {"bsonType": "string"},
            "provider": {"enum": ["GEMINI", "OLLAMA", "MOCK", "OPENAI"]},
            "task_type": {"bsonType": "string"},
            "prompt_tokens": {"bsonType": "number", "multipleOf": 1},
            "completion_tokens": {"bsonType": "number", "multipleOf": 1},
            "latency_ms": {"bsonType": "number"},
            "pip_passed": {"bsonType": "bool"},
            "pii_masked_count": {"bsonType": "number", "multipleOf": 1},
            "groundedness_score": {"bsonType": ["number", "null"]},
            "prompt_snippet": {"bsonType": ["string", "null"]},
            "response_snippet": {"bsonType": ["string", "null"]},
            "action_proposals": {
                "bsonType": "array",
                "items": {"bsonType": "object"},
            },
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}


def setup_campus_ai_collections(db):
    """Idempotently apply collections, validators and indexes for Campus AI Layer."""
    # 1. ai_tenant_quotas
    if "ai_tenant_quotas" not in db.list_collection_names():
        db.create_collection("ai_tenant_quotas", validator=AI_TENANT_QUOTAS_VALIDATOR)
    else:
        db.command("collMod", "ai_tenant_quotas", validator=AI_TENANT_QUOTAS_VALIDATOR)
    db.ai_tenant_quotas.create_index([("tenant_id", 1)], unique=True, name="uq_ai_tenant")

    # 2. ai_interaction_traces
    if "ai_interaction_traces" not in db.list_collection_names():
        db.create_collection(
            "ai_interaction_traces", validator=AI_INTERACTION_TRACES_VALIDATOR
        )
    else:
        db.command(
            "collMod", "ai_interaction_traces", validator=AI_INTERACTION_TRACES_VALIDATOR
        )
    db.ai_interaction_traces.create_index(
        [("trace_id", 1)], unique=True, name="uq_ai_trace_id"
    )
    db.ai_interaction_traces.create_index(
        [("tenant_id", 1), ("created_at", -1)], name="ix_ai_trace_tenant_date"
    )
    db.ai_interaction_traces.create_index(
        [("actor_account_id", 1)], name="ix_ai_trace_actor"
    )


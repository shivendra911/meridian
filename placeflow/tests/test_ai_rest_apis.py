"""Integration tests for Campus AI Layer Django REST API endpoints."""

import os
import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db
from camp_01.tenants import create_tenant
from campus_ai.schemas import setup_campus_ai_collections
from campus_ai.vector_store import TenantIsolatedVectorStore


@pytest.fixture(scope="module")
def api_client():
    db = get_db()
    setup_campus_ai_collections(db)

    # 1. Create a real tenant for middleware resolution
    db.platform_tenants.delete_many({"slug": "nit-ai-api-test"})
    tenant = create_tenant(
        name="NIT AI API Test Tenant",
        slug="nit-ai-api-test",
        customer_type="ENTERPRISE",
        admin_email="admin.ai@nitk.edu",
        db=db,
    )
    tenant_id = tenant["id"]
    from camp_01.tenants import transition_tenant_status
    transition_tenant_status(tenant_id, "PROVISIONING", db=db)
    transition_tenant_status(tenant_id, "ACTIVE", db=db)

    # 2. Seed an institutional policy for RAG testing
    store = TenantIsolatedVectorStore(db)
    store.index_document(
        tenant_id=tenant_id,
        title="College Placement Code of Conduct 2026",
        category="PLACEMENT_POLICY",
        source_authority="Senate Committee",
        version="v1.0",
        raw_sections=[
            {
                "heading": "Rule 1: Application Cap",
                "content": "Students may submit up to 5 concurrent applications per recruitment cycle.",
            }
        ],
    )

    from camp_02.accounts import create_account
    from camp_02.assignments import assign_role
    from camp_02.sessions import create_auth_session

    acc = db.accounts.find_one({"username": "ai_service_test"})
    if not acc:
        acc = create_account(
            username="ai_service_test",
            password="password123",
            email="ai_service@nitk.edu",
            account_type="SERVICE",
            db=db,
        )
    assign_role(
        account_id=acc["account_id"],
        role_id="role_sys_institution_admin",
        scope_type="INSTITUTION",
        scope_id=tenant_id,
        tenant_id=tenant_id,
        institution_id=tenant_id,
        db=db,
    )
    sess = create_auth_session(
        account_id=acc["account_id"],
        tenant_id=tenant_id,
        institution_id=tenant_id,
        auth_assurance="AAL1_PASSWORD",
        db=db,
    )

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {sess['raw_token']}")
    yield client, db, tenant_id

    db.ai_tenant_quotas.delete_many({})
    db.ai_interaction_traces.delete_many({})
    db.ai_knowledge_documents.delete_many({})
    db.ai_knowledge_chunks.delete_many({})
    db.platform_tenants.delete_many({"id": tenant_id})


def test_ai_query_endpoint(api_client):
    client, _, tenant_id = api_client
    resp = client.post(
        "/api/v4/ai/query/",
        data={"prompt": "Explain the prerequisite rules for operating systems."},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "output_text" in data
    assert data["pip_safe"] is True
    assert "trace_id" in data


def test_ai_rag_endpoint(api_client):
    client, _, tenant_id = api_client
    resp = client.post(
        "/api/v4/ai/rag/",
        data={"query": "How many concurrent applications can a student submit?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["doc_title"] == "College Placement Code of Conduct 2026"


def test_ai_agent_execute_endpoint(api_client):
    client, _, tenant_id = api_client
    resp = client.post(
        "/api/v4/ai/agent/execute/",
        data={
            "agent_name": "JNFIntelligenceAgent",
            "payload": {
                "company_name": "Atlassian",
                "offered_ctc_lpa": 32.0,
                "min_cgpa": 8.0,
            },
        },
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["agent_name"] == "JNFIntelligenceAgent"
    assert data["recommendation"]["tier"] == "Super Dream"


def test_ai_traces_and_quotas_endpoints(api_client):
    client, _, tenant_id = api_client
    # 1. Traces
    resp = client.get("/api/v4/ai/traces/", HTTP_X_TENANT_ID=tenant_id)
    assert resp.status_code == 200
    data = resp.json()
    assert "traces" in data
    assert data["count"] >= 1

    # 2. Quotas
    resp_q = client.get("/api/v4/ai/quotas/", HTTP_X_TENANT_ID=tenant_id)
    assert resp_q.status_code == 200
    data_q = resp_q.json()
    assert "metrics" in data_q
    assert data_q["metrics"]["total_traces"] >= 1

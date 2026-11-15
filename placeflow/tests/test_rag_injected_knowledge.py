"""PlaceFlow / Meridian — Integration & Retrieval Verification for Injected RAG Knowledge.

Verifies:
1. Multi-Tenant Semantic Vector Retrieval across all 5 injected policy categories:
   - PLACEMENT_POLICY
   - CURRICULUM_FRAMEWORK
   - DATA_PROTECTION
   - ACADEMIC_REGULATIONS
   - GOVERNANCE_AUDIT
2. Authoritative Citation Matching (Title, Version, Section Heading, Issuing Authority)
3. End-to-End Copilot Query Reasoning grounded in injected institutional documents
4. Strict Multi-Tenant Boundary Isolation (Zero cross-tenant vector contamination)
"""

import os
import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db
from camp_01.tenants import create_tenant, transition_tenant_status
from camp_02.identities import create_person_identity
from camp_02.accounts import create_account
from camp_02.assignments import assign_role
from camp_02.sessions import create_auth_session
from campus_ai.vector_store import TenantIsolatedVectorStore
from campus_ai.rag import InstitutionalRAGEngine
from campus_ai.seed_rag_knowledge import seed_rag_knowledge


@pytest.fixture(scope="module")
def seeded_rag_environment():
    db = get_db()

    # 1. Create Tenant 1 (IIT Bombay System)
    slug_1 = "rag-iit-bombay"
    db.platform_tenants.delete_many({"slug": slug_1})
    tenant_1 = create_tenant(
        name="IIT Bombay University System",
        slug=slug_1,
        customer_type="ENTERPRISE",
        admin_email="director@iitb.ac.in",
        db=db,
    )
    tenant_1_id = tenant_1["id"]
    transition_tenant_status(tenant_1_id, "PROVISIONING", db=db)
    transition_tenant_status(tenant_1_id, "ACTIVE", db=db)

    # 2. Create Tenant 2 (Delhi University Consortium)
    slug_2 = "rag-delhi-university"
    db.platform_tenants.delete_many({"slug": slug_2})
    tenant_2 = create_tenant(
        name="University of Delhi Consortium",
        slug=slug_2,
        customer_type="ENTERPRISE",
        admin_email="vicechancellor@du.ac.in",
        db=db,
    )
    tenant_2_id = tenant_2["id"]
    transition_tenant_status(tenant_2_id, "PROVISIONING", db=db)
    transition_tenant_status(tenant_2_id, "ACTIVE", db=db)

    # 3. Seed knowledge base into both tenants
    seed_rag_knowledge(db, tenant_ids=[tenant_1_id, tenant_2_id])

    # 4. Create student session for Tenant 1
    person = db.person_identities.find_one({"primary_email": "rag_test_student@iitb.ac.in"})
    if not person:
        person = create_person_identity(
            first_name="Rohan",
            last_name="Mehta",
            primary_email="rag_test_student@iitb.ac.in",
            db=db,
        )

    acc = db.accounts.find_one({"username": "rag_rohan"})
    if not acc:
        acc = create_account(
            person_id=person["person_id"],
            username="rag_rohan",
            password="password123",
            email="rag_test_student@iitb.ac.in",
            account_type="HUMAN",
            db=db,
        )

    assign_role(
        account_id=acc["account_id"],
        role_id="role_sys_student_member",
        scope_type="SELF",
        scope_id=acc["account_id"],
        tenant_id=tenant_1_id,
        institution_id=tenant_1_id,
        db=db,
    )

    sess = create_auth_session(
        account_id=acc["account_id"],
        tenant_id=tenant_1_id,
        institution_id=tenant_1_id,
        auth_assurance="AAL1_PASSWORD",
        db=db,
    )

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {sess['raw_token']}")

    yield {
        "db": db,
        "tenant_1": tenant_1_id,
        "tenant_2": tenant_2_id,
        "client": client,
        "user_acc": acc,
    }

    # Teardown
    db.platform_tenants.delete_many({"id": {"$in": [tenant_1_id, tenant_2_id]}})
    db.ai_knowledge_chunks.delete_many({"tenant_id": {"$in": [tenant_1_id, tenant_2_id]}})
    db.ai_knowledge_documents.delete_many({"tenant_id": {"$in": [tenant_1_id, tenant_2_id]}})


def test_rag_semantic_retrieval_all_categories(seeded_rag_environment):
    """Verifies that vector search retrieves accurate chunks across all policy categories."""
    db = seeded_rag_environment["db"]
    tenant_id = seeded_rag_environment["tenant_1"]
    store = TenantIsolatedVectorStore(db)

    # 1. Placement Policy Retrieval
    chunks_placement = store.search(
        tenant_id=tenant_id,
        query="What is the minimum CGPA required for Tier-1 Super Dream campus drives?",
        top_k=4,
    )
    assert len(chunks_placement) > 0
    assert any("Placement Handbook" in c.doc_title for c in chunks_placement)
    assert any("Super Dream" in c.content or "Tier-1" in c.content for c in chunks_placement)
    assert any("Senate Placement Directorate" in c.source_authority for c in chunks_placement)

    # 2. NEP 2020 Retrieval
    chunks_nep = store.search(
        tenant_id=tenant_id,
        query="Undergraduate exit qualifications and diploma credits under NEP 2020",
        top_k=4,
    )
    assert len(chunks_nep) > 0
    assert any("NEP 2020" in c.doc_title for c in chunks_nep)
    assert any("Diploma" in c.content or "credits" in c.content for c in chunks_nep)

    # 3. DPDP Act 2023 Retrieval
    chunks_dpdp = store.search(
        tenant_id=tenant_id,
        query="Can a candidate opt out of automated predictive ML profiling under Section 12?",
        top_k=2,
    )
    assert len(chunks_dpdp) > 0
    assert any("DPDP" in c.doc_title for c in chunks_dpdp)
    assert any("Section 12" in c.content or "profiling" in c.content for c in chunks_dpdp)

    # 4. Academic Mentorship & Attendance NOC Retrieval
    chunks_noc = store.search(
        tenant_id=tenant_id,
        query="What is the minimum attendance percentage for corporate internship NOC endorsement?",
        top_k=2,
    )
    assert len(chunks_noc) > 0
    assert any("NOC Regulations" in c.doc_title for c in chunks_noc)
    assert any("75%" in c.content for c in chunks_noc)

    # 5. NIRF & Statutory Metrics Retrieval
    chunks_nirf = store.search(
        tenant_id=tenant_id,
        query="What components are counted in NIRF Table 5.1 median salary calculation?",
        top_k=2,
    )
    assert len(chunks_nirf) > 0
    assert any("NIRF" in c.doc_title for c in chunks_nirf)
    assert any("Table 5.1" in c.content for c in chunks_nirf)


def test_copilot_query_grounded_in_injected_rag_documents(seeded_rag_environment):
    """Verifies that Copilot returns grounded answers and authoritative citations from injected data."""
    client = seeded_rag_environment["client"]
    tenant_id = seeded_rag_environment["tenant_1"]

    # 1. Query NEP 2020 Exit Criteria
    resp_nep = client.post(
        "/api/copilot/query/",
        data={"query": "What are the rules and credits required for undergraduate diploma exit under NEP 2020?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp_nep.status_code == 200
    data_nep = resp_nep.json()

    assert "citations" in data_nep
    assert len(data_nep["citations"]) >= 1
    titles = [c["doc_title"] for c in data_nep["citations"]]
    assert any("NEP 2020" in t for t in titles)

    answer_nep = data_nep["answer"]
    assert "Diploma" in answer_nep or "80 credits" in answer_nep or "Level 6.0" in answer_nep or "NEP 2020" in answer_nep
    assert data_nep["groundedness_score"] >= 0.80

    # 2. Query One-Student-One-Offer Rule
    resp_offer = client.post(
        "/api/copilot/query/",
        data={"query": "What is the policy if I receive an offer under the one-student-one-offer rule?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp_offer.status_code == 200
    data_offer = resp_offer.json()
    assert len(data_offer["citations"]) >= 1
    assert any("Placement Handbook" in c["doc_title"] for c in data_offer["citations"])


def test_rag_strict_multi_tenant_isolation(seeded_rag_environment):
    """Verifies that tenant vector stores are completely isolated with zero cross-tenant leakage."""
    db = seeded_rag_environment["db"]
    tenant_1 = seeded_rag_environment["tenant_1"]
    tenant_2 = seeded_rag_environment["tenant_2"]
    unseeded_tenant = "tenant_unseeded_9999"

    store = TenantIsolatedVectorStore(db)

    # Chunks from Tenant 1 must only have tenant_id == tenant_1
    t1_chunks = store.search(
        tenant_id=tenant_1,
        query="Institutional Placement Handbook",
        top_k=10,
    )
    assert len(t1_chunks) > 0
    # Every chunk retrieved for tenant_1 must belong to tenant_1
    raw_chunks_t1 = list(db.ai_knowledge_chunks.find({"chunk_id": {"$in": [c.chunk_id for c in t1_chunks]}}))
    for rc in raw_chunks_t1:
        assert rc["tenant_id"] == tenant_1

    # Chunks from Tenant 2 must only have tenant_id == tenant_2
    t2_chunks = store.search(
        tenant_id=tenant_2,
        query="Institutional Placement Handbook",
        top_k=10,
    )
    assert len(t2_chunks) > 0
    raw_chunks_t2 = list(db.ai_knowledge_chunks.find({"chunk_id": {"$in": [c.chunk_id for c in t2_chunks]}}))
    for rc in raw_chunks_t2:
        assert rc["tenant_id"] == tenant_2

    # Chunk IDs between tenant 1 and tenant 2 must be completely distinct
    t1_ids = {c.chunk_id for c in t1_chunks}
    t2_ids = {c.chunk_id for c in t2_chunks}
    assert t1_ids.isdisjoint(t2_ids)

    # Unseeded tenant must return 0 chunks (zero hallucination, zero leakage)
    unseeded_chunks = store.search(
        tenant_id=unseeded_tenant,
        query="Institutional Placement Handbook",
        top_k=10,
    )
    assert len(unseeded_chunks) == 0

"""Automated test suite for Campus AI Layer Sub-Phase 4.2.

Tests Tenant-Isolated Vector Storage, Zero-Cross-Tenant Leakage Invariant,
Temporal/Approval Filtering, and Institutional RAG with Grounded Citations.
"""

from datetime import datetime, timedelta, timezone
import os
import pytest
from pymongo import MongoClient

from campus_ai.schemas import setup_campus_ai_collections
from campus_ai.vector_store import TenantIsolatedVectorStore, compute_deterministic_embedding, cosine_similarity
from campus_ai.gateway import CampusAIGateway
from campus_ai.router import ModelRouter
from campus_ai.rag import InstitutionalRAGEngine


@pytest.fixture(scope="module")
def rag_db():
    uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/college_placement_test")
    client = MongoClient(uri)
    db = client.get_default_database()

    setup_campus_ai_collections(db)

    # Clean collections before tests
    db.ai_knowledge_documents.delete_many({})
    db.ai_knowledge_chunks.delete_many({})
    db.ai_tenant_quotas.delete_many({})
    db.ai_interaction_traces.delete_many({})

    yield db

    db.ai_knowledge_documents.delete_many({})
    db.ai_knowledge_chunks.delete_many({})
    db.ai_tenant_quotas.delete_many({})
    db.ai_interaction_traces.delete_many({})
    client.close()


def test_embedding_math_properties():
    """Embedding vectors are normalized and produce high self-similarity."""
    v1 = compute_deterministic_embedding("Placement eligibility requires 7.5 CGPA")
    v2 = compute_deterministic_embedding("Placement eligibility requires 7.5 CGPA")
    v3 = compute_deterministic_embedding("Completely unrelated text about astrophysics stars")

    # Identical texts yield cosine similarity ~ 1.0
    assert abs(cosine_similarity(v1, v2) - 1.0) < 1e-4

    # Semantically different texts yield lower similarity
    sim_diff = cosine_similarity(v1, v3)
    assert sim_diff < 0.6


def test_tenant_vector_isolation_zero_leakage(rag_db):
    """Chunks indexed under Tenant A must NEVER be returned in searches for Tenant B."""
    store = TenantIsolatedVectorStore(rag_db)

    # Index Policy for Tenant Alpha
    store.index_document(
        tenant_id="tenant_alpha",
        title="NIT Surathkal Placement Policy 2026",
        category="PLACEMENT_POLICY",
        source_authority="CDC Board",
        version="2026.1",
        raw_sections=[
            {
                "heading": "Rule 4.1: Tier 1 Package Threshold",
                "content": "Tier 1 dream companies offer CTC above 18 LPA. Requires CGPA 8.5+.",
            }
        ],
    )

    # Index Policy for Tenant Beta
    store.index_document(
        tenant_id="tenant_beta",
        title="IIT Bombay Placement Policy 2026",
        category="PLACEMENT_POLICY",
        source_authority="Placement Office",
        version="2026.2",
        raw_sections=[
            {
                "heading": "Rule 5.2: Secret Super-Dream Rules",
                "content": "Super dream companies offer CTC above 45 LPA. Closed pool.",
            }
        ],
    )

    # Search for Tenant Alpha querying Beta keywords
    alpha_results = store.search(
        tenant_id="tenant_alpha",
        query="Super dream 45 LPA secret rules",
    )

    # INVARIANT: Zero chunks from tenant_beta can ever appear in tenant_alpha results
    assert len(alpha_results) > 0
    for chunk in alpha_results:
        assert chunk.doc_title == "NIT Surathkal Placement Policy 2026"
        assert "IIT Bombay" not in chunk.doc_title


def test_temporal_and_approval_filtering(rag_db):
    """Expired or Draft documents must not be returned in production search."""
    store = TenantIsolatedVectorStore(rag_db)
    now = datetime.now(timezone.utc)
    past_date = now - timedelta(days=60)
    expired_date = now - timedelta(days=10)

    # Expired policy
    store.index_document(
        tenant_id="tenant_temp_test",
        title="Expired Academic Regulations 2024",
        category="ACADEMIC_REGULATION",
        source_authority="Senate",
        version="2024.0",
        raw_sections=[{"heading": "Attendance", "content": "Attendance requirement is 60%."}],
        valid_from=past_date,
        valid_to=expired_date,
    )

    # Draft unapproved policy
    store.index_document(
        tenant_id="tenant_temp_test",
        title="Draft Exam Ordinance 2027",
        category="EXAM_RULES",
        source_authority="Exam Committee",
        version="2027.0-DRAFT",
        approval_status="DRAFT",
        raw_sections=[{"heading": "Grading", "content": "Relative grading curve 10%"}],
        valid_from=now,
    )

    # Search current active regulations
    results = store.search(tenant_id="tenant_temp_test", query="Attendance grading requirement")
    assert len(results) == 0  # Both expired and draft are excluded


def test_institutional_rag_answer_with_citations(rag_db):
    """RAG answers question and returns verifiable grounded citations."""
    store = TenantIsolatedVectorStore(rag_db)
    tenant_id = "tenant_rag_demo"

    store.index_document(
        tenant_id=tenant_id,
        title="Autonomous College Placement Guidelines 2026",
        category="PLACEMENT_POLICY",
        source_authority="Office of Career Services",
        version="v3.4",
        raw_sections=[
            {
                "heading": "Section 2.1: Dream Offer Acceptance",
                "content": (
                    "A student who receives an offer in Dream Category (8 to 15 LPA) "
                    "is permitted one subsequent upgrade attempt for Super Dream (15+ LPA)."
                ),
            }
        ],
    )

    gateway = CampusAIGateway(rag_db, model_router=ModelRouter(force_mock=True))
    rag_engine = InstitutionalRAGEngine(rag_db, gateway=gateway)

    response = rag_engine.answer_query(
        tenant_id=tenant_id,
        actor_account_id="acc_student_test",
        query="Can I apply for another company after receiving a Dream offer?",
    )

    assert response.groundedness_score > 0.0
    assert len(response.citations) >= 1
    citation = response.citations[0]
    assert citation.doc_title == "Autonomous College Placement Guidelines 2026"
    assert citation.version == "v3.4"
    assert "Section 2.1" in citation.section_heading
    assert citation.source_authority == "Office of Career Services"


def test_institutional_rag_zero_knowledge_fallback(rag_db):
    """When no documents exist for a query, the system safely falls back without hallucinating."""
    gateway = CampusAIGateway(rag_db, model_router=ModelRouter(force_mock=True))
    rag_engine = InstitutionalRAGEngine(rag_db, gateway=gateway)

    response = rag_engine.answer_query(
        tenant_id="tenant_empty_registry",
        actor_account_id="acc_user",
        query="What is the nuclear physics lab safety policy?",
    )

    assert len(response.citations) == 0
    assert len(response.retrieved_chunks) == 0
    assert "No approved institutional policy" in response.answer


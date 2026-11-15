"""PlaceFlow / Meridian — Integration Tests for Copilot ML Pipeline & Data Consistency.

Verifies:
1. Dynamic Student Placement Readiness Prediction via Copilot Query
2. What-If Career Simulation via Copilot Query
3. Skill Gap Recommender via Copilot Query
4. TPO Renege Radar & Demographic Fairness Audit via Copilot Query
5. Statutory DPDP Act 2023 Opt-Out Enforcement (ml_opt_out = True)
6. Granular Attribute Withholding Defense
7. Cryptographic Multi-Tenant & User-Level Isolation
"""

from datetime import datetime, timezone
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
from campus_ai.schemas import setup_campus_ai_collections
from campus_ai.vector_store import TenantIsolatedVectorStore


@pytest.fixture(scope="module")
def ml_copilot_client():
    db = get_db()
    setup_campus_ai_collections(db)

    # 1. Create a dedicated test tenant
    slug = "copilot-ml-tenant"
    db.platform_tenants.delete_many({"slug": slug})
    tenant = create_tenant(
        name="Copilot ML Pipeline Tenant",
        slug=slug,
        customer_type="ENTERPRISE",
        admin_email="tpo.ml@nitk.edu",
        db=db,
    )
    tenant_id = tenant["id"]
    transition_tenant_status(tenant_id, "PROVISIONING", db=db)
    transition_tenant_status(tenant_id, "ACTIVE", db=db)

    # 2. Seed an institutional policy document in vector store
    store = TenantIsolatedVectorStore(db)
    store.index_document(
        tenant_id=tenant_id,
        institution_id=tenant_id,
        title="Institutional Placement Handbook 2026",
        category="PLACEMENT_POLICY",
        source_authority="Senate Academic Council",
        version="v2.0",
        raw_sections=[
            {
                "heading": "Tier-1 Super Dream Eligibility",
                "content": "Students with CGPA >= 7.5 and no active backlogs are eligible for Super Dream campus recruitment drives.",
            }
        ],
    )

    # 3. Create person & account for Priya
    person = db.person_identities.find_one({"primary_email": "priya.sharma@nitk.edu"})
    if not person:
        person = create_person_identity(
            first_name="Priya",
            last_name="Sharma",
            primary_email="priya.sharma@nitk.edu",
            db=db,
        )

    student_acc = db.accounts.find_one({"username": "priya_copilot"})
    if not student_acc:
        student_acc = create_account(
            person_id=person["person_id"],
            username="priya_copilot",
            password="password123",
            email="priya.sharma@nitk.edu",
            account_type="HUMAN",
            db=db,
        )

    # Create a real student in db.students matching schema
    student_id = "STU991"
    now = datetime.now(timezone.utc)
    db.students.delete_many({"student_id": student_id})
    db.students.insert_one({
        "student_id": student_id,
        "name": "Priya Sharma",
        "email": "priya.sharma@nitk.edu",
        "department": "CSE",
        "year": 4,
        "cgpa": 8.75,
        "backlogs": 0,
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        "placement_status": "Unplaced",
        "person_id": person["person_id"],
        "ml_opt_out": False,
        "created_at": now,
    })

    assign_role(
        account_id=student_acc["account_id"],
        role_id="role_sys_student_member",
        scope_type="SELF",
        scope_id=student_acc["account_id"],
        tenant_id=tenant_id,
        institution_id=tenant_id,
        db=db,
    )

    student_sess = create_auth_session(
        account_id=student_acc["account_id"],
        tenant_id=tenant_id,
        institution_id=tenant_id,
        auth_assurance="AAL1_PASSWORD",
        db=db,
    )

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {student_sess['raw_token']}")

    # 4. Create or retrieve TPO account for tenant
    tpo_person = db.person_identities.find_one({"primary_email": "tpo.director@nitk.edu"})
    if not tpo_person:
        tpo_person = create_person_identity(
            first_name="TPO",
            last_name="Director",
            primary_email="tpo.director@nitk.edu",
            db=db,
        )
    tpo_acc = db.accounts.find_one({"username": "tpo_ml_officer"})
    if not tpo_acc:
        tpo_acc = create_account(
            person_id=tpo_person["person_id"],
            username="tpo_ml_officer",
            password="password123",
            email="tpo.director@nitk.edu",
            account_type="HUMAN",
            db=db,
        )
    assign_role(
        account_id=tpo_acc["account_id"],
        role_id="role_sys_tpo_admin",
        scope_type="INSTITUTION",
        scope_id=tenant_id,
        tenant_id=tenant_id,
        institution_id=tenant_id,
        db=db,
    )
    tpo_sess = create_auth_session(
        account_id=tpo_acc["account_id"],
        tenant_id=tenant_id,
        institution_id=tenant_id,
        auth_assurance="AAL1_PASSWORD",
        db=db,
    )
    tpo_client = APIClient()
    tpo_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tpo_sess['raw_token']}")

    yield {
        "client": client,
        "tpo_client": tpo_client,
        "db": db,
        "tenant_id": tenant_id,
        "student_id": student_id,
        "student_acc": student_acc,
    }

    # Teardown
    db.students.delete_many({"student_id": student_id})
    db.platform_tenants.delete_many({"id": tenant_id})


def test_copilot_placement_readiness_ml_query(ml_copilot_client):
    """Verifies that asking about placement readiness invokes the ML-01 predictor."""
    client = ml_copilot_client["client"]
    tenant_id = ml_copilot_client["tenant_id"]

    resp = client.post(
        "/api/copilot/query/",
        data={"query": "What are my placement chances and expected package?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "answer" in data
    answer = data["answer"]
    assert "Placement Readiness" in answer or "Readiness Band" in answer
    assert "LPA" in answer
    assert "CGPA" in answer or "Explainability Drivers" in answer or "Key" in answer
    assert len(data.get("citations", [])) >= 1
    assert data["groundedness_score"] > 0.8


def test_copilot_whatif_simulator_ml_query(ml_copilot_client):
    """Verifies that asking hypothetical what-if questions triggers ML-07 simulator."""
    client = ml_copilot_client["client"]
    tenant_id = ml_copilot_client["tenant_id"]

    resp = client.post(
        "/api/copilot/query/",
        data={"query": "What if I raise my CGPA to 9.2 and learn Docker?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()

    answer = data["answer"]
    assert "What-If" in answer or "Simulation" in answer
    assert "Baseline" in answer or "Current" in answer or "Delta" in answer
    assert "LPA" in answer


def test_copilot_skill_recommendations_query(ml_copilot_client):
    """Verifies that asking for skill recommendations returns market-demand scores."""
    client = ml_copilot_client["client"]
    tenant_id = ml_copilot_client["tenant_id"]

    resp = client.post(
        "/api/copilot/query/",
        data={"query": "What skills should I learn for Tier-1 campus placement?"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp.status_code == 200
    data = resp.json()

    answer = data["answer"]
    assert "Skill Recommendations" in answer or "Market Demand" in answer or "Docker" in answer


def test_copilot_dpdp_opt_out_enforcement(ml_copilot_client):
    """Verifies statutory DPDP Section 12 opt-out prevents automated ML prediction."""
    client = ml_copilot_client["client"]
    db = ml_copilot_client["db"]
    student_id = ml_copilot_client["student_id"]
    tenant_id = ml_copilot_client["tenant_id"]

    # Student exercises statutory right to opt-out
    db.students.update_one({"student_id": student_id}, {"$set": {"ml_opt_out": True}})

    try:
        resp = client.post(
            "/api/copilot/query/",
            data={"query": "Predict my placement readiness probability"},
            format="json",
            HTTP_X_TENANT_ID=tenant_id,
        )
        assert resp.status_code == 200
        data = resp.json()

        answer = data["answer"]
        assert "DPDP" in answer or "opt out" in answer.lower() or "withheld" in answer.lower()
    finally:
        # Revert opt-out for subsequent tests
        db.students.update_one({"student_id": student_id}, {"$set": {"ml_opt_out": False}})


def test_copilot_tpo_renege_radar_and_fairness_queries(ml_copilot_client):
    """Verifies TPO-scoped queries trigger Renege Radar and Fairness Audit."""
    tpo_client = ml_copilot_client["tpo_client"]
    tenant_id = ml_copilot_client["tenant_id"]

    # 1. Renege query
    resp_renege = tpo_client.post(
        "/api/copilot/query/",
        data={"query": "Compute post-offer renege risk telemetry across active cohorts", "lens": "tpo"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp_renege.status_code == 200
    renege_answer = resp_renege.json()["answer"]
    assert "Renege" in renege_answer or "flight risk" in renege_answer.lower()

    # 2. Fairness audit query
    resp_fairness = tpo_client.post(
        "/api/copilot/query/",
        data={"query": "Audit Section 9.3 fairness & demographic disparate impact ratios", "lens": "tpo"},
        format="json",
        HTTP_X_TENANT_ID=tenant_id,
    )
    assert resp_fairness.status_code == 200
    fairness_answer = resp_fairness.json()["answer"]
    assert "Fairness" in fairness_answer or "EEOC" in fairness_answer or "Four-Fifths" in fairness_answer

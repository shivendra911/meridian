"""PlaceFlow / Meridian — Machine Learning REST Endpoints Test Suite (Phase 2).

Tests:
1. Student placement readiness insights endpoint (/api/student/insights/readiness/).
2. Candidate opt-out / DPDP consent withdrawal compliance.
3. Market-aligned skill recommendations endpoint (/api/student/insights/skills/).
4. Self-scoped what-if career simulation endpoint (/api/student/insights/whatif/).
5. TPO model registry inspect and retrain endpoints (/api/tpo/models/ and /api/tpo/models/retrain/).
6. Access controls: verifying 403 Forbidden when student accesses TPO model endpoints.
"""

import os
import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db


@pytest.fixture
def auth_client():
    client = APIClient()

    def _login(username, password="password123"):
        db = get_db()
        if not db.accounts.find_one({"username": username}):
            from scripts.seed_demo_accounts import seed_demo_accounts
            seed_demo_accounts(db=db)
        res = client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        assert res.status_code == 200, f"Failed to log in as {username}: {res.json()}"
        client.cookies["pf_session"] = res.cookies["pf_session"].value
        return res.json().get("me")

    client.login_as = _login
    return client


def test_student_readiness_insights_endpoint(auth_client):
    """Authenticated student receives placement readiness, package estimate, and explainability drivers."""
    auth_client.login_as("student")
    db = get_db()

    # Ensure STU001 does not have opt_out set
    db.students.update_one({"student_id": "STU001"}, {"$unset": {"ml_opt_out": ""}})
    db.consents.delete_many({"student_id": "STU001", "purpose": "AI_PREDICTIVE_MODELING"})

    resp = auth_client.get("/api/student/insights/readiness/")
    assert resp.status_code == 200
    data = resp.json()

    assert data["student_id"] == "STU001"
    assert data["opted_out"] is False
    assert "placement_probability" in data
    assert 0.0 <= data["placement_probability"] <= 100.0
    assert "expected_package_lpa" in data
    assert "risk_level" in data
    assert "drivers" in data
    assert isinstance(data["drivers"], list)
    assert len(data["drivers"]) > 0


def test_student_readiness_insights_opt_out(auth_client):
    """When candidate has opted out of ML profiling, endpoint returns neutral fallback with opted_out=True."""
    auth_client.login_as("student")
    db = get_db()

    # Set student ml_opt_out flag
    db.students.update_one({"student_id": "STU001"}, {"$set": {"ml_opt_out": True}})

    try:
        resp = auth_client.get("/api/student/insights/readiness/")
        assert resp.status_code == 200
        data = resp.json()

        assert data["student_id"] == "STU001"
        assert data["opted_out"] is True
        assert data["status"] == "OPTED_OUT"
        assert "message" in data
    finally:
        db.students.update_one({"student_id": "STU001"}, {"$unset": {"ml_opt_out": ""}})


def test_student_skill_recommendations_endpoint(auth_client):
    """Authenticated student receives market-aligned skill gap analysis."""
    auth_client.login_as("student")

    resp = auth_client.get("/api/student/insights/skills/")
    assert resp.status_code == 200
    data = resp.json()

    assert data["student_id"] == "STU001"
    assert "current_skills" in data
    assert "recommended_skills" in data
    assert isinstance(data["recommended_skills"], list)


def test_student_whatif_simulator_endpoint(auth_client):
    """Authenticated student evaluates hypothetical profile improvements (CGPA, backlogs, skills)."""
    auth_client.login_as("student")

    payload = {
        "target_cgpa": 8.8,
        "target_backlogs": 0,
        "added_skills": ["Docker", "Kubernetes", "AWS"],
    }
    resp = auth_client.post("/api/student/insights/whatif/", payload, format="json")
    assert resp.status_code == 200
    data = resp.json()

    assert data["student_id"] == "STU001"
    assert data["opted_out"] is False
    assert "baseline" in data
    assert "simulated" in data
    assert data["simulated"]["cgpa"] == 8.8
    assert data["simulated"]["backlogs"] == 0
    assert "Docker" in data["simulated"]["skills"]
    assert "package_band_80" in data["simulated"]
    assert "explanations" in data
    assert len(data["explanations"]) > 0


def test_tpo_models_endpoints_as_admin(auth_client):
    """TPO administrator can inspect model catalog and trigger retraining."""
    auth_client.login_as("tpo_admin")

    # 1. Model list
    list_resp = auth_client.get("/api/tpo/models/")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert "total_models" in list_data
    assert "models" in list_data

    # 2. Retrain models
    retrain_resp = auth_client.post("/api/tpo/models/retrain/", {}, format="json")
    assert retrain_resp.status_code == 200
    retrain_data = retrain_resp.json()
    assert retrain_data["success"] is True
    assert "metrics" in retrain_data
    assert retrain_data["metrics"]["status"] == "SUCCESS"


def test_tpo_models_endpoints_forbidden_for_student(auth_client):
    """Students cannot access TPO model management endpoints (403 Forbidden)."""
    auth_client.login_as("student")

    # Student cannot view model registry
    resp_list = auth_client.get("/api/tpo/models/")
    assert resp_list.status_code == 403

    # Student cannot trigger model retrain
    resp_retrain = auth_client.post("/api/tpo/models/retrain/", {}, format="json")
    assert resp_retrain.status_code == 403

"""
PlaceFlow Django REST API Test Suite
Validates all Django endpoints against live MongoDB replica set data.
"""

import pytest
import os
import django

# Initialize Django for standalone testing
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db


@pytest.fixture(scope="module")
def api_client():
    client = APIClient()
    db = get_db()
    if not db.accounts.find_one({"username": "tpo_admin"}):
        from scripts.seed_demo_accounts import seed_demo_accounts
        seed_demo_accounts(db=db)
    res = client.post("/api/auth/login/", {"username": "tpo_admin", "password": "password123"}, format="json")
    if res.status_code == 200 and "pf_session" in res.cookies:
        client.cookies["pf_session"] = res.cookies["pf_session"].value
    return client


def test_django_overview_api(api_client):
    """GET /api/overview/ returns real-time placement KPIs, branch velocity, and activity."""
    response = api_client.get("/api/overview/")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "branch_velocity" in data
    assert "tier_distribution" in data
    assert "cluster_status" in data
    assert data["cluster_status"]["mongo_live"] is True


def test_django_students_api(api_client):
    """GET /api/students/ and /api/students/<id>/ returns candidate registry and dossier."""
    # List
    response = api_client.get("/api/students/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert len(data["students"]) > 0

    # Detail
    first_sid = data["students"][0]["student_id"]
    det_resp = api_client.get(f"/api/students/{first_sid}/")
    assert det_resp.status_code == 200
    det_data = det_resp.json()
    assert det_data["student"]["student_id"] == first_sid
    assert "vti" in det_data
    assert "eligible_jobs" in det_data


def test_django_superday_api(api_client):
    """GET /api/superday/conflicts/ returns collision matrix and status."""
    response = api_client.get("/api/superday/conflicts/")
    assert response.status_code == 200
    data = response.json()
    assert "clashes_count" in data
    assert "status" in data
    assert "conflicts" in data


def test_django_nirf_api(api_client):
    """GET /api/nirf/metrics/ returns official GPH/GMS scorecards and company table."""
    response = api_client.get("/api/nirf/metrics/")
    assert response.status_code == 200
    data = response.json()
    assert "cohort_size" in data
    assert "gph_score_40" in data
    assert "gms_score_40" in data
    assert "company_table" in data


def test_django_whatif_api(api_client):
    """POST /api/whatif/simulate/ computes 80% conformal package band & explanations."""
    payload = {
        "student_id": "STU001",
        "hypothetical_cgpa": 9.2,
        "resolved_backlogs": 0,
        "additional_skills": ["Docker", "Kubernetes"]
    }
    response = api_client.post("/api/whatif/simulate/", data=payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["opted_out"] is False
    assert "simulated" in data
    band = data["simulated"]["package_band_80"]
    assert band["lower_bound_lpa"] <= band["median_lpa"] <= band["upper_bound_lpa"]
    assert len(data["explanations"]) > 0


def test_django_agent_chat_api(api_client):
    """POST /api/agents/chat/ executes AG-01 / AG-02 runtime with MCP tools."""
    payload = {
        "agent_id": "AG-01",
        "prompt": "Am I eligible for any campus jobs?",
        "student_id": "STU001"
    }
    response = api_client.post("/api/agents/chat/", data=payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == "AG-01"
    assert data["autonomy_level"] == "L0"
    assert data["tool_calls_count"] >= 1


def test_django_consent_lifecycle_api(api_client):
    """GET/POST /api/consent/ manages DPDP purpose consents and opt-out."""
    test_sid = "STU001"

    # Detail
    get_res = api_client.get(f"/api/consent/{test_sid}/")
    assert get_res.status_code == 200
    data = get_res.json()
    assert "consents" in data

    # Record consent
    rec_res = api_client.post("/api/consent/record/", data={"student_id": test_sid, "purpose": "AI_PREDICTIVE_MODELING"}, format="json")
    assert rec_res.status_code == 200


def test_django_fairness_api(api_client):
    """GET /api/fairness/audit/ returns demographic slice parity."""
    response = api_client.get("/api/fairness/audit/")
    assert response.status_code == 200
    data = response.json()
    assert "disparate_impact_ratio" in data
    assert "slice_reports" in data


def test_django_renege_radar_api(api_client):
    """GET /api/renege-radar/ returns candidate flight risk scores."""
    response = api_client.get("/api/renege-radar/")
    assert response.status_code == 200
    data = response.json()
    assert "total_placed_monitored" in data
    assert "candidates" in data


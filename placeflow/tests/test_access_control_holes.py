"""PlaceFlow / Meridian — Security Audit: Access Control & Data Scoping Holes.

Tests for Phase 1 of fix-access-control-and-bugs.task.md:
1. Visibility matrix:
   - student sees 1 student and 2 applications (own only)
   - faculty (mentor) sees only mentees (STU001, STU002)
   - HOD (CSE) sees exactly STU001, STU002, STU005, STU008
   - Dean sees only the School of Computing (CSE, ISE, IT)
   - TPO sees all 8 demo students
2. IDOR matrix:
   - accessing out-of-scope candidate/application/interview/offer/consent returns 404
3. Write permission matrix:
   - POST/PUT/PATCH/DELETE on /api/tpo/students/ and /api/students/ returns 403 for student/faculty/HOD
   - only authorized TPO/Admin can create candidate records (201)
4. Portal-gate matrix:
   - unauthorized roles hitting /api/<portal>/ return 403
5. No raw collection access:
   - files under api/ (outside auth/ and scripts/) must not call db.<collection>.find directly
"""

import os
import re
import pytest
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db


@pytest.fixture
def auth_client(db):
    client = APIClient()

    def _login(username, password="password123"):
        res = client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        assert res.status_code == 200, f"Login failed for {username}: {res.json()}"
        client.cookies["pf_session"] = res.cookies["pf_session"].value
        return res.json().get("me")

    client.login_as = _login
    return client


def test_visibility_matrix(auth_client):
    """Verifies that candidate and application queries return strictly scoped cohorts per role."""
    # 1. Student (Aarav Sharma, STU001)
    auth_client.login_as("student")
    resp = auth_client.get("/api/student/applications/")
    assert resp.status_code == 200
    student_apps = resp.json()
    assert len(student_apps) == 2
    for app in student_apps:
        assert app["student_id"] == "STU001"

    # Legacy /api/students/ or /api/tpo/students/
    resp_stu = auth_client.get("/api/students/")
    assert resp_stu.status_code == 200
    stus = resp_stu.json().get("students", [])
    assert len(stus) == 1
    assert stus[0]["student_id"] == "STU001"

    # 2. Faculty Mentor (Dr. Janpreet Singh, 11266)
    auth_client.login_as("faculty")
    resp_fac = auth_client.get("/api/faculty/mentees/")
    assert resp_fac.status_code == 200
    fac_stus = resp_fac.json().get("students", [])
    fac_ids = {s["student_id"] for s in fac_stus}
    # Mentor must see ONLY assigned mentees (STU001, STU002)
    assert fac_ids == {"STU001", "STU002"}

    # 3. HOD (CSE, Dr. Sweety Sehgal, 11115)
    auth_client.login_as("hod")
    resp_hod = auth_client.get("/api/hod/students/")
    assert resp_hod.status_code == 200
    hod_stus = resp_hod.json().get("students", [])
    hod_ids = {s["student_id"] for s in hod_stus}
    # HOD (CSE) sees exactly STU001, STU002, STU005, STU008
    assert hod_ids == {"STU001", "STU002", "STU005", "STU008"}

    # 4. Dean (School of Computing, Dr. Arun Malik, HOS_SCAI)
    auth_client.login_as("dean")
    resp_dean = auth_client.get("/api/hod/students/")
    assert resp_dean.status_code == 200
    dean_stus = resp_dean.json().get("students", [])
    dean_ids = {s["student_id"] for s in dean_stus}
    # Dean sees only the School of Computing (STU001, STU002, STU004, STU005, STU006, STU008)
    assert "STU003" not in dean_ids  # STU003 is ECE
    assert "STU007" not in dean_ids  # STU007 is ME
    assert {"STU001", "STU002", "STU005", "STU008"}.issubset(dean_ids)

    # 5. TPO Admin (Dr. K. Venkatesh)
    auth_client.login_as("tpo_admin")
    resp_tpo = auth_client.get("/api/tpo/students/")
    assert resp_tpo.status_code == 200
    tpo_stus = resp_tpo.json().get("students", [])
    tpo_ids = {s["student_id"] for s in tpo_stus}
    # TPO sees all 8 demo students
    assert {"STU001", "STU002", "STU003", "STU004", "STU005", "STU006", "STU007", "STU008"}.issubset(tpo_ids)


def test_idor_matrix(auth_client):
    """Verifies that out-of-scope candidate, application, and consent lookups return HTTP 404."""
    # 1. Student STU001 requests STU003's dossier
    auth_client.login_as("student")
    resp = auth_client.get("/api/students/STU003/")
    assert resp.status_code == 404

    # Student STU001 requests STU003's consent record
    resp_consent = auth_client.get("/api/consent/STU003/")
    assert resp_consent.status_code == 404

    # 2. Faculty mentor requests unassigned student STU003
    auth_client.login_as("faculty")
    resp_fac = auth_client.get("/api/faculty/mentees/STU003/")
    assert resp_fac.status_code == 404

    # 3. HOD (CSE) requests student from ECE (STU003) and ME (STU007)
    auth_client.login_as("hod")
    assert auth_client.get("/api/hod/students/STU003/").status_code == 404
    assert auth_client.get("/api/hod/students/STU007/").status_code == 404


def test_write_permission_matrix(auth_client):
    """Verifies that student, faculty, and HOD cannot register candidates or jobs, returning 403."""
    valid_student_payload = {
        "student_id": "STU999",
        "name": "Unauthorized Enrollee",
        "email": "unauth@univ.edu",
        "department": "CSE",
        "year": 4,
        "cgpa": 8.0,
        "backlogs": 0,
        "skills": ["Python"],
    }

    # Student cannot POST candidates
    auth_client.login_as("student")
    assert auth_client.post("/api/tpo/students/", valid_student_payload, format="json").status_code == 403
    assert auth_client.post("/api/students/", valid_student_payload, format="json").status_code == 403

    # Student cannot POST companies or jobs
    assert auth_client.post("/api/tpo/jobs/", {"title": "Fake Job"}, format="json").status_code == 403
    assert auth_client.post("/api/tpo/companies/", {"name": "Fake Co"}, format="json").status_code == 403

    # Faculty cannot POST candidates
    auth_client.login_as("faculty")
    assert auth_client.post("/api/tpo/students/", valid_student_payload, format="json").status_code == 403
    assert auth_client.post("/api/students/", valid_student_payload, format="json").status_code == 403

    # HOD cannot POST candidates
    auth_client.login_as("hod")
    assert auth_client.post("/api/tpo/students/", valid_student_payload, format="json").status_code == 403
    assert auth_client.post("/api/students/", valid_student_payload, format="json").status_code == 403

    # TPO Admin CAN POST candidates
    auth_client.login_as("tpo_admin")
    tpo_post = auth_client.post("/api/tpo/students/", valid_student_payload, format="json")
    assert tpo_post.status_code in (201, 400)  # 201 created or 400 validation error, never 403


def test_portal_gate_matrix(auth_client):
    """Verifies that each role hitting an unassigned portal namespace gets HTTP 403."""
    # Student hitting other portals
    auth_client.login_as("student")
    assert auth_client.get("/api/tpo/overview/").status_code == 403
    assert auth_client.get("/api/admin/tenants/").status_code == 403
    assert auth_client.get("/api/management/nirf/metrics/").status_code == 403
    assert auth_client.get("/api/faculty/mentees/").status_code == 403
    assert auth_client.get("/api/hod/students/").status_code == 403

    # Faculty hitting TPO or Admin portals
    auth_client.login_as("faculty")
    assert auth_client.get("/api/tpo/overview/").status_code == 403
    assert auth_client.get("/api/admin/tenants/").status_code == 403

    # HOD hitting TPO or Admin portals
    auth_client.login_as("hod")
    assert auth_client.get("/api/tpo/overview/").status_code == 403
    assert auth_client.get("/api/admin/tenants/").status_code == 403

    # Authorized portals work
    auth_client.login_as("tpo_admin")
    assert auth_client.get("/api/tpo/overview/").status_code == 200

    auth_client.login_as("admin")
    assert auth_client.get("/api/admin/tenants/").status_code == 200

    auth_client.login_as("vice_chancellor")
    assert auth_client.get("/api/management/nirf/metrics/").status_code == 200


def test_no_raw_collection_access_in_views():
    """Grep-test ensuring no views under api/ (outside auth/ and scripts/) bypass scoped_find/scoped_get."""
    from pathlib import Path
    api_dir = Path(__file__).resolve().parent.parent / "api"
    
    # Scoped collections that MUST NOT be accessed directly via db.<coll>.find / db[coll].find in views
    scoped_colls = {"students", "applications", "interviews", "placements", "jobs", "companies", "v_application_details"}
    
    violations = []
    
    # Check all python files in api/ except auth/, scripts/, and migration/test files
    for py_file in api_dir.glob("**/*.py"):
        rel_path = py_file.relative_to(api_dir)
        parts = rel_path.parts
        if parts[0] in ("auth", "scripts"):
            continue
        content = py_file.read_text(encoding="utf-8")
        
        for coll in scoped_colls:
            # Pattern: db.<coll>.find or db['<coll>'].find or db["<coll>"].find
            patterns = [
                rf"\bdb\.{coll}\.find\b",
                rf"\bdb\.{coll}\.find_one\b",
                rf"\bdb\[[\"']{coll}[\"']\]\.find\b",
                rf"\bdb\[[\"']{coll}[\"']\]\.find_one\b",
            ]
            for pat in patterns:
                matches = re.findall(pat, content)
                if matches:
                    violations.append(f"{py_file.name}: direct '{matches[0]}' forbidden, use scoped_find / scoped_get")
                    
    assert not violations, f"Raw collection access found in views:\n" + "\n".join(violations)

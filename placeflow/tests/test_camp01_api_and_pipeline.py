"""Architectural and Integration Tests for CAMP-01 Sub-Phase 1.4: Onboarding, Config & REST API."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from rest_framework.test import APIClient
from database.connection import get_db
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_01.directory import seed_public_directory
from camp_01.tenants import create_tenant, transition_tenant_status
from camp_01.institutions import create_institution
from camp_01.config import (
    create_configuration_version,
    resolve_effective_configuration,
    list_configuration_history,
)
from camp_01.onboarding import execute_full_onboarding_pipeline


@pytest.fixture(autouse=True)
def setup_camp01_test_db():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    seed_public_directory(db)
    yield db


def test_onboarding_pipeline_full_execution(setup_camp01_test_db):
    """Verifies that the 10-step institutional onboarding pipeline executes successfully end-to-end."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "pipeline-demo-uni"})

    res = execute_full_onboarding_pipeline(
        tenant_name="Demo State University",
        tenant_slug="pipeline-demo-uni",
        customer_type="STATE_UNIVERSITY",
        admin_email="chancellor@demouni.ac.in",
        institution_code="DEMO_STATE_01",
        legal_name="Demo State University of Technology",
        display_name="Demo State Tech",
        institution_type="STATE_UNIVERSITY",
        classifications={
            "institution_kind": "UNIVERSITY",
            "ownership": "STATE_GOVERNMENT",
            "governance": "PUBLIC",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
        campus_code="MAIN_CAMPUS",
        campus_name="University Enclave",
        primary_location_data={
            "building_name": "Administrative Senate Block",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
        regulatory_identifiers=[
            {"scheme": "AISHE", "value": "U-77777", "issuer": "Ministry of Education"}
        ],
        root_org_unit_name="Office of the Vice Chancellor",
        branding_settings={
            "identity": {"primary_color": "#0B1B3D", "portal_title": "Demo State Career Portal"}
        },
    )

    assert res["is_successful"] is True
    assert res["tenant"]["status"] == "ACTIVE"
    assert res["institution"]["status"] == "ACTIVE"
    assert len(res["pipeline_log"]) == 10
    assert all(step["status"] in {"COMPLETED", "PASSED"} for step in res["pipeline_log"])


def test_hierarchical_configuration_resolution(setup_camp01_test_db):
    """Verifies that configuration resolves through Platform -> Tenant -> Institution -> Campus inheritance."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-config-test"})
    t = create_tenant("Config Uni", "tenant-config-test", "STANDALONE_COLLEGE", "admin@cfg.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="CFG_01",
        legal_name="Configuration University",
        display_name="Config Uni",
        institution_type="UNIVERSITY",
        classifications={
            "institution_kind": "UNIVERSITY",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_UNAIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    # 1. Tenant-level configuration overrides primary color
    create_configuration_version(
        tenant_id=tid,
        institution_id=iid,
        scope_level="TENANT",
        settings={"identity": {"primary_color": "#1E3A8A"}},
        changed_by="superadmin",
        change_reason="Tenant brand styling",
    )

    # 2. Institution-level configuration overrides portal title
    create_configuration_version(
        tenant_id=tid,
        institution_id=iid,
        scope_level="INSTITUTION",
        settings={"identity": {"portal_title": "Custom Institution Career Portal"}},
        changed_by="inst_admin",
        change_reason="Institution portal naming",
    )

    # 3. Resolve effective configuration
    eff = resolve_effective_configuration(tid, iid)
    assert eff["identity"]["primary_color"] == "#1E3A8A"  # from tenant
    assert eff["identity"]["portal_title"] == "Custom Institution Career Portal"  # from institution
    assert eff["localization"]["timezone"] == "Asia/Kolkata"  # from platform defaults

    # 4. Version history check
    history = list_configuration_history(tid, iid)
    assert len(history) >= 2


def test_drf_camp01_rest_api_endpoints(setup_camp01_test_db):
    """Verifies that Django REST Framework endpoints for CAMP-01 work correctly."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "api-test-trust"})
    client = APIClient()

    # 1. Public directory search
    res_dir = client.get("/api/v4/directory/search/?q=Bombay")
    assert res_dir.status_code == 200
    assert res_dir.data["count"] >= 1
    assert "Bombay" in res_dir.data["directory_results"][0]["display_name"]

    # 2. Create tenant via REST API
    res_t = client.post(
        "/api/v4/tenants/",
        {
            "name": "API Test Trust",
            "slug": "api-test-trust",
            "customer_type": "EDUCATION_GROUP",
            "admin_email": "tpo@apitest.edu",
        },
        format="json",
    )
    assert res_t.status_code == 201
    tid = res_t.data["id"]

    # Transition tenant to ACTIVE
    client.post(f"/api/v4/tenants/{tid}/", {"status": "PROVISIONING"}, format="json")
    client.post(f"/api/v4/tenants/{tid}/", {"status": "ACTIVE"}, format="json")

    # 3. Create institution via REST API with X-Tenant-ID header
    res_inst = client.post(
        "/api/v4/institutions/",
        {
            "institution_code": "API_INST_01",
            "legal_name": "API College of Engineering",
            "display_name": "API Engg",
            "institution_type": "COLLEGE",
            "contact_email": "principal@apiengg.edu",
            "classifications": {
                "institution_kind": "COLLEGE",
                "ownership": "PRIVATE",
                "governance": "PRIVATE_UNAIDED",
                "recognition_status": "ACCREDITED",
                "institutional_role": "DEGREE_AWARDING",
                "delivery_model": "PHYSICAL",
            },
        },
        HTTP_X_TENANT_ID=tid,
        format="json",
    )
    assert res_inst.status_code == 201
    iid = res_inst.data["institution_id"]

    # 4. Query readiness via REST API
    res_readiness = client.get(f"/api/v4/institutions/{iid}/readiness/", HTTP_X_TENANT_ID=tid)
    assert res_readiness.status_code == 200
    assert "checklist" in res_readiness.data

    # 5. Create campus via REST API
    res_camp = client.post(
        "/api/v4/campuses/",
        {
            "campus_code": "MAIN_CAMPUS",
            "campus_name": "Main Engineering Campus",
            "campus_kind": "PHYSICAL",
            "status": "ACTIVE",
        },
        HTTP_X_TENANT_ID=tid,
        format="json",
    )
    assert res_camp.status_code == 201
    cid = res_camp.data["campus_id"]

    # 6. Associate campus via REST API
    res_assoc = client.post(
        f"/api/v4/institutions/{iid}/campuses/",
        {"campus_id": cid, "relationship_type": "MAIN_CAMPUS", "is_primary": True},
        HTTP_X_TENANT_ID=tid,
        format="json",
    )
    assert res_assoc.status_code == 201

    # 7. Create Organizational Unit via REST API
    res_unit = client.post(
        f"/api/v4/institutions/{iid}/org-units/",
        {"unit_code": "DEPT_IT", "name": "Department of Information Technology", "unit_type": "DEPARTMENT"},
        HTTP_X_TENANT_ID=tid,
        format="json",
    )
    assert res_unit.status_code == 201

    # 8. Query hierarchy tree via REST API
    res_tree = client.get(f"/api/v4/institutions/{iid}/hierarchy/", HTTP_X_TENANT_ID=tid)
    assert res_tree.status_code == 200
    assert "hierarchy_tree" in res_tree.data

"""Architectural and Unit Tests for CAMP-01 Sub-Phase 1.1: Platform Core & Tenant Isolation Engine."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from database.connection import get_db
from camp_01.context import (
    TenantContext,
    TenantContextMissingError,
    get_current_tenant_id,
    set_current_tenant_id,
)
from camp_01.directory import (
    get_directory_entry_by_aishe,
    get_directory_entry_by_id,
    search_public_directory,
    seed_public_directory,
)
from camp_01.outbox import (
    process_pending_outbox_events,
    publish_event,
    register_event_handler,
)
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_01.tenants import (
    InvalidTenantStateTransitionError,
    TenantNotFoundError,
    TenantValidationError,
    create_tenant,
    get_tenant_by_id,
    get_tenant_by_slug,
    list_tenants,
    transition_tenant_status,
)


@pytest.fixture(autouse=True)
def setup_camp01_test_db():
    """Ensures schemas are applied and provides test isolation."""
    db = get_db()
    apply_camp01_foundation_schemas(db)
    seed_public_directory(db)
    yield db


def test_tenant_creation_and_slug_normalization(setup_camp01_test_db):
    """Verifies that tenants can be provisioned with validated and normalized slugs."""
    db = setup_camp01_test_db
    # Clean any prior test tenant with this slug
    db.platform_tenants.delete_many({"slug": "test-iit-bombay"})

    tenant = create_tenant(
        name="IIT Bombay Foundation",
        slug="Test-IIT-Bombay  ",
        customer_type="STANDALONE_COLLEGE",
        admin_email="tpo@iitb.ac.in",
        subscription_tier="INSTITUTIONAL_FLAGSHIP",
        actor_id="admin@campusos.in",
    )

    assert tenant["id"] is not None
    assert tenant["slug"] == "test-iit-bombay"
    assert tenant["status"] == "REQUESTED"
    assert len(tenant["status_history"]) == 1
    assert tenant["status_history"][0]["status"] == "REQUESTED"

    # Verify duplicate slug is rejected
    with pytest.raises(TenantValidationError) as exc_info:
        create_tenant(
            name="Duplicate College",
            slug="test-iit-bombay",
            customer_type="STANDALONE_COLLEGE",
            admin_email="admin@duplicate.in",
        )
    assert "already registered" in str(exc_info.value)

    # Verify reserved slugs are rejected (redesign.txt Section 2.2)
    for res_slug in ["api", "admin", "system", "auth", "billing"]:
        with pytest.raises(TenantValidationError) as res_exc:
            create_tenant(
                name="Reserved Test",
                slug=res_slug,
                customer_type="STANDALONE_COLLEGE",
                admin_email="test@reserved.edu",
            )
        assert "reserved platform keyword" in str(res_exc.value)

    # Verify lookup by slug and ID
    fetched = get_tenant_by_slug("test-iit-bombay")
    assert fetched["id"] == tenant["id"]
    assert get_tenant_by_id(tenant["id"])["name"] == "IIT Bombay Foundation"


def test_tenant_lifecycle_state_machine(setup_camp01_test_db):
    """Verifies that tenant state transitions follow the formal lifecycle state machine."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "test-lifecycle-tenant"})

    tenant = create_tenant(
        name="Lifecycle University",
        slug="test-lifecycle-tenant",
        customer_type="STATE_UNIVERSITY",
        admin_email="registrar@lifecycle.edu.in",
    )
    tid = tenant["id"]

    # 1. Illegal transition: REQUESTED -> ACTIVE directly is forbidden (must pass PROVISIONING)
    with pytest.raises(InvalidTenantStateTransitionError):
        transition_tenant_status(tid, "ACTIVE", reason="Skipping provisioning")

    # 2. Valid transition: REQUESTED -> PROVISIONING
    t_prov = transition_tenant_status(tid, "PROVISIONING", reason="Starting automated cluster provisioning")
    assert t_prov["status"] == "PROVISIONING"

    # 3. Valid transition: PROVISIONING -> ACTIVE
    t_active = transition_tenant_status(tid, "ACTIVE", reason="Cluster provisioning verified")
    assert t_active["status"] == "ACTIVE"

    # 4. Valid transition: ACTIVE -> SUSPENDED
    t_susp = transition_tenant_status(tid, "SUSPENDED", reason="Audit hold")
    assert t_susp["status"] == "SUSPENDED"

    # 5. Valid transition: SUSPENDED -> ACTIVE
    t_react = transition_tenant_status(tid, "ACTIVE", reason="Audit cleared")
    assert t_react["status"] == "ACTIVE"

    # 6. Valid transition: ACTIVE -> CLOSING -> CLOSED
    transition_tenant_status(tid, "CLOSING", reason="Contract expired")
    t_closed = transition_tenant_status(tid, "CLOSED", reason="Data retention period finished")
    assert t_closed["status"] == "CLOSED"

    # 7. Terminal state: CLOSED cannot transition to any status
    with pytest.raises(InvalidTenantStateTransitionError):
        transition_tenant_status(tid, "ACTIVE", reason="Attempting resurrection")

    # Verify history chain has 7 events (1 initial + 6 transitions)
    final_tenant = get_tenant_by_id(tid)
    assert len(final_tenant["status_history"]) == 7


def test_tenant_context_scoping():
    """Verifies that TenantContext correctly enforces runtime isolation boundaries."""
    # Outside context, required lookup raises error
    set_current_tenant_id(None)
    with pytest.raises(TenantContextMissingError):
        get_current_tenant_id(required=True)

    assert get_current_tenant_id(required=False) is None

    # Inside context
    with TenantContext(tenant_id="tenant-alpha", actor_id="user-1"):
        assert get_current_tenant_id() == "tenant-alpha"

        # Nested context switches and restores
        with TenantContext(tenant_id="tenant-beta", actor_id="user-2"):
            assert get_current_tenant_id() == "tenant-beta"

        assert get_current_tenant_id() == "tenant-alpha"

    # Cleaned up after exit
    assert get_current_tenant_id(required=False) is None


def test_public_directory_queries(setup_camp01_test_db):
    """Verifies that platform institutional directory provides public reference search."""
    # Lookup by AISHE
    iitb = get_directory_entry_by_aishe("U-0053")
    assert iitb is not None
    assert iitb["legal_name"] == "Indian Institute of Technology Bombay"
    assert iitb["state"] == "Maharashtra"

    # Search by text
    results = search_public_directory(query="Mumbai")
    assert len(results) >= 1
    names = [r["display_name"] for r in results]
    assert any("Mumbai" in name for name in names)

    # Search by state
    kar_results = search_public_directory(state="Karnataka")
    assert len(kar_results) >= 1
    assert kar_results[0]["directory_id"] == "AISHE-U-0217"


def test_transactional_outbox_processing(setup_camp01_test_db):
    """Verifies that outbox events are reliably persisted and dispatched to registered handlers."""
    db = setup_camp01_test_db
    test_events_received = []

    def mock_tenant_created_consumer(event):
        test_events_received.append(event["payload"]["tenant_id"])

    register_event_handler("TestOutboxEvent", mock_tenant_created_consumer)

    # Publish test event
    event_id = publish_event(
        event_type="TestOutboxEvent",
        aggregate_type="TENANT",
        aggregate_id="tenant-999",
        tenant_id="tenant-999",
        payload={"tenant_id": "tenant-999", "custom_metric": 42},
        db=db,
    )
    assert event_id is not None

    # Check that event is initially PENDING
    event_doc = db.platform_events_outbox.find_one({"event_id": event_id})
    assert event_doc["status"] == "PENDING"

    # Process pending events
    processed = process_pending_outbox_events(filter_dict={"event_id": event_id}, db=db)
    assert processed >= 1
    assert "tenant-999" in test_events_received

    # Verify event is now marked PUBLISHED
    event_doc_after = db.platform_events_outbox.find_one({"event_id": event_id})
    assert event_doc_after["status"] == "PUBLISHED"
    assert event_doc_after["published_at"] is not None


def test_middleware_tenant_resolution(setup_camp01_test_db):
    """Verifies that TenantResolutionMiddleware extracts tenant from headers and rejects closed/missing tenants."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "test-middleware-inst"})
    from django.test import RequestFactory
    from camp_01.middleware import TenantResolutionMiddleware
    from django.http import HttpResponse

    rf = RequestFactory()
    middleware = TenantResolutionMiddleware(get_response=lambda r: HttpResponse("OK"))

    # 1. Request with non-existent tenant -> 404
    req_unknown = rf.get("/api/overview/", HTTP_X_TENANT_ID="non-existent-tenant-id")
    resp_unknown = middleware(req_unknown)
    assert resp_unknown.status_code == 404

    # 2. Request with valid active tenant -> 200 and binds tenant context
    tenant = create_tenant(
        name="Middleware Test Institute",
        slug="test-middleware-inst",
        customer_type="STANDALONE_COLLEGE",
        admin_email="test@middleware.edu.in",
    )
    tid = tenant["id"]
    transition_tenant_status(tid, "PROVISIONING")
    transition_tenant_status(tid, "ACTIVE")

    req_valid = rf.get("/api/overview/", HTTP_X_TENANT_ID=tid)
    resp_valid = middleware(req_valid)
    assert resp_valid.status_code == 200
    assert getattr(req_valid, "tenant_id", None) == tid

    # 3. Request with CLOSED tenant -> 403 Forbidden
    transition_tenant_status(tid, "CLOSING")
    transition_tenant_status(tid, "CLOSED")

    req_closed = rf.get("/api/overview/", HTTP_X_TENANT_ID=tid)
    resp_closed = middleware(req_closed)
    assert resp_closed.status_code == 403


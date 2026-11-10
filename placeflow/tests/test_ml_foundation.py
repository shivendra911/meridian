"""Tests for ML Core Foundation, Multi-Tenant Feature Store & Model Registry (Phase 1).

Spec reference: docs/redesign4.txt Sections 1, 11, 12, 13, 15, and 19.
"""

from datetime import datetime, timezone
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from database.connection import get_db
from ml.features import (
    extract_student_features,
    extract_cohort_features,
    CrossTenantFeatureAccessDenied,
    FeatureExtractionError,
)
from ml.registry import ModelRegistry, ModelMetadata
from ml.serving import MLServingManager


@pytest.fixture
def mock_ml_db():
    """Sets up isolated student and placement records for ML testing."""
    db = get_db()
    # Clean previous test entries
    db.students.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.applications.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.placements.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.ai_inference_traces.delete_many({"entity_id": {"$in": ["STU981", "STU982", "STU983"]}})

    now = datetime.now(timezone.utc)

    # Insert test students matching $jsonSchema
    db.students.insert_one({
        "student_id": "STU981",
        "tenant_id": "ten_alpha",
        "institution_id": "inst_alpha",
        "name": "Rohan Verma",
        "email": "rohan@alpha.edu",
        "phone": "+919876543210",
        "cgpa": 8.75,
        "backlogs": 0,
        "year": 4,
        "department": "CSE",
        "skills": ["Python", "Machine Learning", "System Design", "SQL", "Docker"],
        "placement_status": "Unplaced",
        "ml_opt_out": False,
        "attendance": 92.5,
        "created_at": now,
    })

    db.students.insert_one({
        "student_id": "STU982",
        "tenant_id": "ten_beta",
        "institution_id": "inst_beta",
        "name": "Priya Nair",
        "email": "priya@beta.edu",
        "phone": "+919876543211",
        "cgpa": 6.2,
        "backlogs": 2,
        "year": 4,
        "department": "ECE",
        "skills": ["C++", "Embedded"],
        "placement_status": "Unplaced",
        "ml_opt_out": False,
        "attendance": 74.0,
        "created_at": now,
    })

    # Student with DPDP Opt-Out
    db.students.insert_one({
        "student_id": "STU983",
        "tenant_id": "ten_alpha",
        "institution_id": "inst_alpha",
        "name": "Ananya Sen",
        "email": "ananya@alpha.edu",
        "phone": "+919876543212",
        "cgpa": 9.1,
        "backlogs": 0,
        "year": 4,
        "department": "CSE",
        "skills": ["Java", "Spring Boot"],
        "placement_status": "Unplaced",
        "ml_opt_out": True,  # Opted out of ML profiling
        "attendance": 95.0,
        "created_at": now,
    })

    # Valid application record
    db.applications.insert_one({
        "application_id": "APP981",
        "student_id": "STU981",
        "job_id": "JOB001",
        "application_date": now,
        "status": "Applied",
        "status_history": [{"status": "Applied", "at": now}],
    })

    yield db

    # Teardown
    db.students.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.applications.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.placements.delete_many({"student_id": {"$in": ["STU981", "STU982", "STU983"]}})
    db.ai_inference_traces.delete_many({"entity_id": {"$in": ["STU981", "STU982", "STU983"]}})


# ------------------------------------------------------------------------------
# 1. Feature Extraction & Multi-Tenant Boundary Tests
# ------------------------------------------------------------------------------

def test_student_feature_extraction_success(mock_ml_db):
    """Verifies that numerical features are normalized and PII is stripped."""
    feat = extract_student_features("STU981", tenant_id="ten_alpha", db=mock_ml_db)
    assert feat["student_id"] == "STU981"
    assert feat["cgpa"] == 8.75
    assert feat["backlogs"] == 0
    assert feat["year"] == 4
    assert feat["department"] == "CSE"
    assert feat["skill_count"] == 5
    assert feat["application_count"] == 1
    assert feat["attendance_pct"] == 92.5
    assert feat["opt_out"] is False

    # Verify PII is NOT in the feature payload
    assert "name" not in feat
    assert "email" not in feat
    assert "phone" not in feat


def test_cross_tenant_feature_extraction_forbidden(mock_ml_db):
    """Verifies that requesting features for student outside tenant boundary raises PermissionError."""
    with pytest.raises(CrossTenantFeatureAccessDenied):
        # STU981 belongs to ten_alpha, but caller provides ten_beta
        extract_student_features("STU981", tenant_id="ten_beta", db=mock_ml_db)


def test_missing_student_feature_extraction_error(mock_ml_db):
    """Verifies error raised when student does not exist."""
    with pytest.raises(FeatureExtractionError):
        extract_student_features("STU999", tenant_id="ten_alpha", db=mock_ml_db)


def test_cohort_features_strict_tenant_slicing(mock_ml_db):
    """Verifies cohort batch extraction slices strictly by tenant."""
    df_alpha = extract_cohort_features(tenant_id="ten_alpha", db=mock_ml_db)
    assert not df_alpha.empty
    assert "STU981" in df_alpha["student_id"].values
    assert "STU982" not in df_alpha["student_id"].values  # belongs to ten_beta


# ------------------------------------------------------------------------------
# 2. Model Registry & Versioning Tests
# ------------------------------------------------------------------------------

def test_model_registry_save_and_load(tmp_path):
    """Verifies artifact serialization and manifest generation in ModelRegistry."""
    from sklearn.dummy import DummyClassifier
    reg = ModelRegistry(model_dir=tmp_path)

    dummy_model = DummyClassifier(strategy="most_frequent")
    dummy_model.fit([[1, 2], [3, 4]], [0, 1])

    meta = ModelMetadata(
        model_id="test_dummy_clf",
        version="2.0.1",
        algorithm="DummyClassifier",
        risk_tier="TIER_B",
        feature_names=["cgpa", "skills"],
        metrics={"accuracy": 0.85},
    )

    reg.save_model("test_dummy_clf", dummy_model, meta)

    # Verify files created on disk
    assert (tmp_path / "test_dummy_clf.pkl").exists()
    assert (tmp_path / "test_dummy_clf.manifest.json").exists()

    # Load back
    loaded_model, loaded_meta = reg.load_model("test_dummy_clf")
    assert loaded_model is not None
    assert loaded_meta.model_id == "test_dummy_clf"
    assert loaded_meta.version == "2.0.1"
    assert loaded_meta.risk_tier == "TIER_B"
    assert loaded_meta.metrics["accuracy"] == 0.85


def test_model_registry_list_models(tmp_path):
    """Verifies scanning and listing registered models."""
    from sklearn.dummy import DummyRegressor
    reg = ModelRegistry(model_dir=tmp_path)

    m = DummyRegressor()
    m.fit([[1], [2]], [3.5, 4.5])
    reg.save_model("reg_v1", m, ModelMetadata(model_id="reg_v1", version="1.0.0"))

    models = reg.list_models()
    assert len(models) == 1
    assert models[0].model_id == "reg_v1"


# ------------------------------------------------------------------------------
# 3. ML Serving Manager & Inference Governance Tests
# ------------------------------------------------------------------------------

def test_predict_placement_readiness_inference(mock_ml_db):
    """Verifies full inference pipeline: probability, package band, readiness band, drivers, and latency."""
    manager = MLServingManager()
    res = manager.predict_placement_readiness(
        student_id="STU981",
        tenant_id="ten_alpha",
        actor_id="usr_tpo_test",
        db=mock_ml_db,
    )

    assert res["status"] == "SUCCESS"
    assert res["opted_out"] is False
    assert 0.0 <= res["placement_probability"] <= 100.0
    assert res["expected_package_lpa"] > 0
    assert res["readiness_band"] in ("READY", "MODERATE", "NEEDS_PREPARATION")
    assert res["risk_tier"] == "TIER_B"
    assert len(res["drivers"]) >= 2
    assert res["latency_ms"] < 1000.0  # Cold start SLA

    # Cached warm inference SLA
    res_warm = manager.predict_placement_readiness("STU981", tenant_id="ten_alpha", db=mock_ml_db)
    assert res_warm["latency_ms"] < 100.0  # Warm in-memory cache SLA

    # Verify audit trace was appended to ai_inference_traces
    trace = mock_ml_db.ai_inference_traces.find_one({"entity_id": "STU981"})
    assert trace is not None
    assert trace["model_id"] == "placement_clf"
    assert trace["tenant_id"] == "ten_alpha"
    assert trace["actor_id"] == "usr_tpo_test"


def test_dpdp_opt_out_enforcement(mock_ml_db):
    """Verifies that students with ml_opt_out=True are NOT profiled by the ML models."""
    manager = MLServingManager()
    res = manager.predict_placement_readiness(
        student_id="STU983",
        tenant_id="ten_alpha",
        db=mock_ml_db,
    )

    assert res["status"] == "OPTED_OUT"
    assert res["opted_out"] is True
    assert res["placement_probability"] is None
    assert res["expected_package_lpa"] is None
    assert res["readiness_band"] == "UNASSESSED"

    # Verify no inference trace recorded for opted-out candidate
    trace = mock_ml_db.ai_inference_traces.find_one({"entity_id": "STU983"})
    assert trace is None


def test_explainability_directional_drivers(mock_ml_db):
    """Verifies that high CGPA and low backlogs generate positive drivers, while backlogs generate negative."""
    manager = MLServingManager()

    # High CGPA student
    res_high = manager.predict_placement_readiness("STU981", tenant_id="ten_alpha", db=mock_ml_db)
    high_drivers = {d["feature"]: d["impact"] for d in res_high["drivers"]}
    assert high_drivers.get("Academic Standing") == "POSITIVE"
    assert high_drivers.get("Active Backlogs") == "POSITIVE"

    # Lower CGPA student with backlogs
    res_low = manager.predict_placement_readiness("STU982", tenant_id="ten_beta", db=mock_ml_db)
    low_drivers = {d["feature"]: d["impact"] for d in res_low["drivers"]}
    assert low_drivers.get("Active Backlogs") == "CRITICAL"

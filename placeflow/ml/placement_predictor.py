"""Placement prediction model. Trains on PlaceFlow data, predicts placement probability and package band.

Usage:
    python -m ml.placement_predictor train     # Train and save model
    python -m ml.placement_predictor predict STU001  # Predict for a student
    python -m ml.placement_predictor batch     # Predict for all unplaced students
"""
import sys
import pathlib

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder

# Ensure project root is on path
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from database.connection import get_db  # noqa: E402

MODEL_DIR = pathlib.Path(__file__).resolve().parent / "models"
PLACEMENT_CLF_PATH = MODEL_DIR / "placement_clf.pkl"
PACKAGE_REG_PATH = MODEL_DIR / "package_reg.pkl"
ENCODERS_PATH = MODEL_DIR / "encoders.pkl"


def _extract_features(db):
    """Build a feature DataFrame from the database. Each row is a student."""
    students = list(db.students.find({}, {"_id": 0}))
    if not students:
        raise RuntimeError("No students in database. Run setup_database.py --bulk first.")

    df = pd.DataFrame(students)

    # Count applications per student
    app_counts = {}
    for app in db.applications.find({}, {"student_id": 1, "_id": 0}):
        sid = app["student_id"]
        app_counts[sid] = app_counts.get(sid, 0) + 1
    df["application_count"] = df["student_id"].map(app_counts).fillna(0).astype(int)

    # Count skills
    df["skill_count"] = df["skills"].apply(lambda s: len(s) if isinstance(s, list) else 0)

    # Placement info
    placement_map = {}
    for p in db.placements.find({}, {"student_id": 1, "package_lpa": 1, "_id": 0}):
        placement_map[p["student_id"]] = p["package_lpa"]
    df["placed"] = df["student_id"].map(lambda s: 1 if s in placement_map else 0)
    df["package_lpa"] = df["student_id"].map(placement_map).fillna(0)

    # Encode department
    dept_encoder = LabelEncoder()
    df["dept_encoded"] = dept_encoder.fit_transform(df["department"])

    feature_cols = ["cgpa", "backlogs", "year", "skill_count", "application_count", "dept_encoded"]
    return df, feature_cols, dept_encoder


def train():
    """Train placement classifier and package regressor on the current database."""
    db = get_db()
    df, feature_cols, dept_encoder = _extract_features(db)

    X = df[feature_cols].values
    y_placed = df["placed"].values

    # Classifier: will this student get placed?
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    scores = cross_val_score(clf, X, y_placed, cv=5, scoring="accuracy")
    print(f"Placement classifier — 5-fold CV accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")
    clf.fit(X, y_placed)

    # Regressor: for placed students, what package?
    placed_mask = df["placed"] == 1
    if placed_mask.sum() < 10:
        print("WARNING: fewer than 10 placed students — package regressor will be unreliable")
    X_placed = df.loc[placed_mask, feature_cols].values
    y_package = df.loc[placed_mask, "package_lpa"].values

    reg = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    if placed_mask.sum() >= 5:
        pkg_scores = cross_val_score(reg, X_placed, y_package, cv=min(5, placed_mask.sum()), scoring="r2")
        print(f"Package regressor — 5-fold CV R²: {pkg_scores.mean():.3f} (+/- {pkg_scores.std():.3f})")
    reg.fit(X_placed, y_package)

    # Feature importance
    print("\nFeature importance (placement):")
    for name, imp in sorted(zip(feature_cols, clf.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name:20s} {imp:.3f}")

    # Save
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, PLACEMENT_CLF_PATH)
    joblib.dump(reg, PACKAGE_REG_PATH)
    joblib.dump({"dept_encoder": dept_encoder, "feature_cols": feature_cols}, ENCODERS_PATH)
    global _MODEL_CACHE
    _MODEL_CACHE = (clf, reg, {"dept_encoder": dept_encoder, "feature_cols": feature_cols})
    print(f"\nModels saved to {MODEL_DIR}")


_MODEL_CACHE = None


def _get_models():
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        if not (PLACEMENT_CLF_PATH.exists() and PACKAGE_REG_PATH.exists() and ENCODERS_PATH.exists()):
            return None, None, None
        clf = joblib.load(PLACEMENT_CLF_PATH)
        reg = joblib.load(PACKAGE_REG_PATH)
        meta = joblib.load(ENCODERS_PATH)
        _MODEL_CACHE = (clf, reg, meta)
    return _MODEL_CACHE


def predict_student(student_id):
    """Predict placement probability and expected package for one student."""
    db = get_db()

    clf, reg, meta = _get_models()
    if clf is None or reg is None or meta is None:
        return None

    student = db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        print(f"Student {student_id} not found")
        return None

    app_count = db.applications.count_documents({"student_id": student_id})
    skill_count = len(student.get("skills", []))

    try:
        dept_encoded = meta["dept_encoder"].transform([student["department"]])[0]
    except ValueError:
        dept_encoded = 0

    features = np.array([[
        student["cgpa"], student["backlogs"], student["year"],
        skill_count, app_count, dept_encoded
    ]])

    prob = clf.predict_proba(features)[0][1]  # probability of being placed
    expected_pkg = reg.predict(features)[0]

    result = {
        "student_id": student_id,
        "name": student["name"],
        "current_status": student["placement_status"],
        "placement_probability": round(float(prob) * 100, 1),
        "expected_package_lpa": round(float(expected_pkg), 1),
        "risk_level": "HIGH" if prob < 0.3 else "MEDIUM" if prob < 0.6 else "LOW",
    }
    return result


def batch_predict():
    """Predict for all unplaced students, sorted by risk."""
    db = get_db()
    unplaced = db.students.find({"placement_status": "Unplaced"}, {"student_id": 1, "_id": 0})
    results = []
    for s in unplaced:
        r = predict_student(s["student_id"])
        if r:
            results.append(r)
    results.sort(key=lambda r: r["placement_probability"])
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "train":
        train()
    elif cmd == "predict" and len(sys.argv) > 2:
        r = predict_student(sys.argv[2])
        if r:
            for k, v in r.items():
                print(f"  {k:25s} {v}")
    elif cmd == "batch":
        for r in batch_predict():
            print(f"  {r['student_id']} {r['name']:20s} prob={r['placement_probability']:5.1f}%  "
                  f"pkg={r['expected_package_lpa']:5.1f} LPA  risk={r['risk_level']}")
    else:
        print(__doc__)


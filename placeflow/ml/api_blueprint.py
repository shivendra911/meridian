"""Flask Blueprint for ML endpoints. Register in web_app.py with:
    from ml.api_blueprint import ml_bp
    app.register_blueprint(ml_bp)

Endpoints:
    GET  /ml/predict/<student_id>     — placement prediction
    GET  /ml/recommend/<student_id>   — skill recommendations
    POST /ml/parse-resume             — extract skills from text
    GET  /ml/batch-risk               — all unplaced students ranked by risk
    GET  /ml/skill-gaps               — campus-wide skill gap telemetry
"""
from flask import Blueprint, jsonify, request

from database.connection import get_db

ml_bp = Blueprint("ml", __name__, url_prefix="/ml")


@ml_bp.get("/predict/<student_id>")
def predict(student_id):
    try:
        from ml.placement_predictor import predict_student
        result = predict_student(student_id)
        if result is None:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({"error": "Model not trained. Run: python -m ml.placement_predictor train"}), 503


@ml_bp.get("/recommend/<student_id>")
def recommend(student_id):
    from ml.skill_recommender import recommend as do_recommend
    result = do_recommend(get_db(), student_id)
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result)


@ml_bp.post("/parse-resume")
def parse_resume():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Send JSON with 'text' field"}), 400
    from ml.resume_parser import extract_skills, match_jobs
    skills = extract_skills(text)
    jobs = match_jobs(get_db(), skills)
    return jsonify({"skills": skills, "matching_jobs": jobs})


@ml_bp.get("/batch-risk")
def batch_risk():
    try:
        from ml.placement_predictor import batch_predict
        return jsonify(batch_predict())
    except FileNotFoundError:
        return jsonify({"error": "Model not trained"}), 503


@ml_bp.get("/skill-gaps")
def skill_gaps():
    from operations import reports
    return jsonify(reports.skill_gap(get_db()))

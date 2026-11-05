"""Describes the generic collection pages and converts form text into typed values."""
from datetime import datetime, timezone

from database.validation import DEPARTMENTS, TIERS

from .common import parse_date


def F(name, kind="str", type_="text", required=False, options=None, step=None, label=None):
    return {"name": name, "kind": kind, "type": type_, "required": required, "options": options,
            "step": step, "label": label or name.split(".")[-1].replace("_", " ").title()}


COLLECTIONS = {
    "students": {"pk": "student_id", "fields": [
        F("name", required=True), F("email", type_="email", required=True),
        F("department", type_="select", options=DEPARTMENTS, required=True),
        F("year", "int", "number", True), F("cgpa", "float", "number", True, step="0.01"),
        F("backlogs", "int", "number", True), F("skills", "list"), F("phone")]},
    "companies": {"pk": "company_id", "fields": [
        F("name", required=True), F("industry", required=True), F("location", required=True),
        F("website", type_="url"), F("contact_email", type_="email")]},
    "jobs": {"pk": "job_id", "fields": [
        F("company_id", required=True), F("title", required=True),
        F("tier", type_="select", options=TIERS, required=True),
        F("package_lpa", "float", "number", True, step="0.1", label="Package (LPA)"),
        F("location"), F("skills_required", "list"),
        F("eligibility.min_cgpa", "float", "number", True, step="0.1", label="Minimum CGPA"),
        F("eligibility.max_backlogs", "int", "number", True, label="Maximum backlogs"),
        F("eligibility.departments", "list", required=True, label="Departments (comma separated)"),
        F("vacancies", "int", "number", True), F("deadline", "date", "date", True)]},
    "applications": {"pk": "application_id", "fields": [
        F("student_id", required=True), F("job_id", required=True)]},
    "interviews": {"pk": "interview_id", "fields": [
        F("application_id", required=True), F("round", required=True),
        F("scheduled_start", "datetime", "datetime-local", True),
        F("scheduled_end", "datetime", "datetime-local", True),
        F("mode", type_="select", options=["Online", "Offline"], required=True), F("venue")]},
    "placements": {"pk": "placement_id", "fields": [
        F("student_id", required=True), F("job_id", required=True)]},
}


def coerce(raw, field):
    text = (raw or "").strip()
    if not text:
        if field["required"]:
            raise ValueError(f'{field["label"]} is required')
        return None
    kind = field["kind"]
    try:
        if kind == "int":
            return int(text)
        if kind == "float":
            return float(text)
        if kind == "list":
            return [part.strip() for part in text.split(",") if part.strip()]
        if kind == "date":
            return parse_date(text)
        if kind == "datetime":
            return datetime.strptime(text, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    except ValueError:
        raise ValueError(f'{field["label"]}: expected {kind}') from None
    return text


def build_doc(cfg, form):
    """Form fields -> typed document. Dotted names (eligibility.min_cgpa) become nested objects."""
    doc = {}
    for field in cfg["fields"]:
        value = coerce(form.get(field["name"]), field)
        if value is None:
            continue
        *parents, leaf = field["name"].split(".")
        node = doc
        for parent in parents:
            node = node.setdefault(parent, {})
        node[leaf] = value
    return doc


def fmt(value):
    """Display formatting used by every table: dates DD Mon YYYY, arrays comma-separated, numbers fixed."""
    if value is None:
        return "—"
    if isinstance(value, datetime):
        pattern = "%d %b %Y" if (value.hour, value.minute) == (0, 0) else "%d %b %Y %H:%M"
        return value.strftime(pattern)
    if isinstance(value, float):
        return f"{value:.2f}"
    if isinstance(value, (list, tuple)):
        return ", ".join(fmt(v) for v in value)
    if isinstance(value, dict):
        return "; ".join(f"{k}: {fmt(v)}" for k, v in value.items())
    return str(value)


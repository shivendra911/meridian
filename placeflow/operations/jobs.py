from .errors import PlaceFlowError
from .ids import insert_with_id


def add_job(db, data):
    """BR-03: a job may only be created for a company that exists."""
    company_id = data.get("company_id")
    if db.companies.count_documents({"company_id": company_id}, limit=1) == 0:
        raise PlaceFlowError(f"Company {company_id} does not exist")
    return insert_with_id(db, "jobs", {"filled": 0, "status": "Open", **data})


def get_job(db, job_id):
    doc = db.jobs.find_one({"job_id": job_id})
    if not doc:
        raise PlaceFlowError(f"Job {job_id} does not exist")
    return doc


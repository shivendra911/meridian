"""Simple resume skill extractor + job matcher.

Usage:
    python -m ml.resume_parser "Experienced in Java, Spring Boot, and microservices. Worked with MySQL and Docker."
"""
import re
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from database.connection import get_db  # noqa: E402

# Known skill vocabulary (expandable)
KNOWN_SKILLS = {
    "java", "python", "c++", "c", "sql", "mysql", "mongodb", "react", "angular", "vue",
    "spring boot", "spring", "django", "flask", "node.js", "nodejs", "express",
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "linux",
    "machine learning", "ml", "deep learning", "tensorflow", "pytorch",
    "html", "css", "javascript", "typescript", "rust", "go", "golang",
    "dsa", "data structures", "system design", "microservices",
    "redis", "kafka", "rabbitmq", "graphql", "rest", "api",
    "embedded", "autocad", "matlab", "verilog", "communication",
}


def extract_skills(text):
    """Extract known skills from free text."""
    text_lower = text.lower()
    found = set()

    # Multi-word skills first (greedy)
    for skill in sorted(KNOWN_SKILLS, key=len, reverse=True):
        if skill in text_lower:
            found.add(skill)
            # Normalize some common variants
            if skill in ("nodejs", "node.js"):
                found.discard("nodejs")
                found.add("node.js")
            if skill == "golang":
                found.discard("golang")
                found.add("go")

    return sorted(found)


def match_jobs(db, skills, limit=10):
    """Find open jobs that require any of the extracted skills."""
    if not skills:
        return []
    return list(db.jobs.find(
        {"status": "Open", "skills_required": {"$in": [re.compile(f"^{re.escape(s)}$", re.I) for s in skills]}},
        {"_id": 0, "job_id": 1, "title": 1, "tier": 1, "package_lpa": 1, "skills_required": 1}
    ).sort("package_lpa", -1).limit(limit))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    text = " ".join(sys.argv[1:])
    skills = extract_skills(text)
    print(f"\n  Extracted skills: {', '.join(skills) or 'none found'}")

    if skills:
        db = get_db()
        jobs = match_jobs(db, skills)
        if jobs:
            print(f"\n  Matching open jobs ({len(jobs)}):")
            for j in jobs:
                print(f"    {j['job_id']} {j['title']:30s} {j['tier']:14s} {j['package_lpa']:6.1f} LPA")
        else:
            print("  No matching open jobs found.")


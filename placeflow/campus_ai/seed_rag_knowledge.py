"""PlaceFlow / Meridian — Institutional Knowledge Seeder for Tenant-Isolated Vector Store.

Seeds authoritative campus documents into `ai_knowledge_documents` and `ai_knowledge_chunks`
with deterministic embeddings for semantic retrieval.

Documents:
1. Institutional Placement Handbook 2026 (Compensation Tiers, One-Student-One-Offer, Renege Penalties)
2. NEP 2020 & NCrF Credit Framework (Multiple Exit Levels, Electives, Internship Credits)
3. DPDP Act 2023 Statutory Governance Policy (Candidate Consent, Section 12 Opt-Out)
4. Academic Mentorship & Placement NOC Regulations (Attendance criteria, remediation)
5. NIRF & Statutory Accreditation Placement Metrics Policy (Table 5.1, NBA Criterion 4)

Usage:
    python placeflow/campus_ai/seed_rag_knowledge.py
"""

from datetime import datetime, timezone
import sys
import pathlib
from typing import List, Optional

# Ensure placeflow root on PYTHONPATH
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from database.connection import get_db
from campus_ai.vector_store import TenantIsolatedVectorStore


INSTITUTIONAL_DOCUMENTS = [
    {
        "title": "Institutional Placement Handbook 2026",
        "category": "PLACEMENT_POLICY",
        "source_authority": "Senate Placement Directorate",
        "version": "v2.0",
        "raw_sections": [
            {
                "heading": "Compensation Tiers & Academic Thresholds",
                "content": (
                    "Campus recruitment compensation tiers are defined as: "
                    "Tier-1 Super Dream (CTC >= ₹20.0 LPA), "
                    "Tier-2 Dream (CTC >= ₹7.5 LPA and < ₹20.0 LPA), and "
                    "Tier-3 Normal/Regular (CTC < ₹7.5 LPA). "
                    "Students with CGPA >= 7.50 and zero active backlogs are eligible for Tier-1 Super Dream drives. "
                    "Students with CGPA >= 6.50 are eligible for Tier-2 Dream drives."
                ),
            },
            {
                "heading": "One-Student-One-Offer & Acceptance Policy",
                "content": (
                    "Under the university one-student-one-offer regulation, once a candidate signs an acceptance letter "
                    "or joins a Dream/Normal tier company, they are locked from attending further regular drives, "
                    "except for upgrading to a single Super Dream opportunity (>= ₹20 LPA) with prior approval from the Placement Cell."
                ),
            },
            {
                "heading": "Post-Offer Renege Penalties & Disciplinary Action",
                "content": (
                    "Declining or reneging on a verified corporate offer after formal signing without statutory extenuating medical grounds "
                    "carries immediate revocation of campus placement assistance and referral to the Disciplinary Committee. "
                    "Candidates must provide 30-day prior written notice."
                ),
            },
            {
                "heading": "Superday Operational Protocol & Interview Conflict Buffer",
                "content": (
                    "During Superday campus interview marathons, a mandatory 30-minute decompression buffer must separate concurrent "
                    "technical rounds across different corporate recruiters. Interview collisions are resolved via the Placement Coordinator "
                    "by adjusting the later recruiter's slot."
                ),
            },
        ],
    },
    {
        "title": "National Education Policy (NEP 2020) & NCrF Credit Framework",
        "category": "CURRICULUM_FRAMEWORK",
        "source_authority": "Academic Council & Ministry of Education",
        "version": "v1.4",
        "raw_sections": [
            {
                "heading": "Undergraduate Exit Pathways & Degree Qualifications",
                "content": (
                    "In compliance with NEP 2020 and the National Credit Framework (NCrF), students may exit with: "
                    "Undergraduate Certificate after 1 year (40 credits, Level 5.0), "
                    "Undergraduate Diploma after 2 years (80 credits, Level 6.0), "
                    "Bachelor Degree after 3 years (120 credits, Level 7.0), or "
                    "Bachelor Degree Honours / Research after 4 years (160 credits, Level 8.0)."
                ),
            },
            {
                "heading": "Multidisciplinary & Internship Credit Conversion",
                "content": (
                    "A minimum of 20 multidisciplinary elective credits and 12 value-added credits are mandatory for B.Tech graduation. "
                    "Final-semester corporate internships of 6 months carry 16 academic credits upon joint evaluation by faculty mentor "
                    "and industry supervisor."
                ),
            },
        ],
    },
    {
        "title": "Digital Personal Data Protection (DPDP) Act 2023 Statutory Governance Policy",
        "category": "DATA_PROTECTION",
        "source_authority": "Institutional Privacy Office & MeitY",
        "version": "v1.0",
        "raw_sections": [
            {
                "heading": "Candidate Consent & Recruiter Data Sharing",
                "content": (
                    "Under Section 6 of the DPDP Act 2023, student academic, resume, and contact records are shared with prospective "
                    "employers exclusively upon explicit, granular consent. Students hold an absolute right to withdraw consent or "
                    "withhold specific data categories (e.g. personal contact numbers, demographic information, academic transcripts) "
                    "via the Placement Portal privacy control center."
                ),
            },
            {
                "heading": "Right to Opt-Out of Automated Profiling & Ranking (Section 12)",
                "content": (
                    "Students have the statutory right under Section 12 to opt out of automated machine learning predictive scoring, "
                    "rank ordering, and behavioral profiling. Opting out ensures manual verification of placement drive eligibility "
                    "without algorithmic discrimination."
                ),
            },
        ],
    },
    {
        "title": "Academic Mentorship & Placement NOC Regulations",
        "category": "ACADEMIC_REGULATIONS",
        "source_authority": "Dean of Academic Affairs",
        "version": "v2.0",
        "raw_sections": [
            {
                "heading": "Minimum Attendance Criteria for Corporate Internship NOC",
                "content": (
                    "A student must maintain a minimum attendance of 75% in all registered coursework to receive a Faculty Mentor "
                    "Endorsement and Placement No Objection Certificate (NOC) for corporate internships. Students between 65% and 74.9% "
                    "attendance require an Academic Senate condonation hearing; attendance below 65% results in automatic NOC rejection."
                ),
            },
            {
                "heading": "Remediation & Mentee Progress Tracking",
                "content": (
                    "Faculty mentors must review mentee academic performance bi-weekly. Any student with backlogs or semester GPA falling "
                    "below 6.0 must be placed on an Academic Remediation Plan with designated peer tutoring."
                ),
            },
        ],
    },
    {
        "title": "NIRF & Statutory Accreditation Placement Metrics Policy",
        "category": "GOVERNANCE_AUDIT",
        "source_authority": "Internal Quality Assurance Cell (IQAC)",
        "version": "v2026.1",
        "raw_sections": [
            {
                "heading": "Table 5.1 Outcome Verification & Median Salary Calculation",
                "content": (
                    "NIRF Table 5.1 requires audited accounting of graduating cohort outcomes: number of students admitted, "
                    "graduated within minimum stipulated time, placed through campus drives, and selected for higher studies. "
                    "Median salary must reflect base compensation plus assured first-year bonuses, excluding speculative performance incentives."
                ),
            },
            {
                "heading": "NBA Criterion 4 Placement & Progression Targets",
                "content": (
                    "To achieve full marks in NBA Criterion 4 (Students Performance), engineering departments must maintain an index "
                    "of placement and higher studies greater than 80% of the eligible graduating class."
                ),
            },
        ],
    },
]


def seed_rag_knowledge(db=None, tenant_ids: Optional[List[str]] = None):
    """Indexes institutional policy documents across all active platform tenants."""
    if db is None:
        db = get_db()

    store = TenantIsolatedVectorStore(db)

    # 1. Discover target tenants
    if tenant_ids is None:
        tenants = list(db.platform_tenants.find({}, {"id": 1, "slug": 1, "_id": 0}))
        tenant_ids = [t["id"] for t in tenants]

        # Include fallback default tenant
        if "tenant_nitk" not in tenant_ids:
            tenant_ids.append("tenant_nitk")

    indexed_summary = []

    for t_id in tenant_ids:
        print(f"\n--- Seeding Knowledge for Tenant: {t_id} ---")
        # Remove existing documents for this tenant to allow clean re-seeding
        db.ai_knowledge_chunks.delete_many({"tenant_id": t_id})
        db.ai_knowledge_documents.delete_many({"tenant_id": t_id})

        for doc_def in INSTITUTIONAL_DOCUMENTS:
            doc_id = store.index_document(
                tenant_id=t_id,
                institution_id=t_id,
                title=doc_def["title"],
                category=doc_def["category"],
                source_authority=doc_def["source_authority"],
                version=doc_def["version"],
                raw_sections=doc_def["raw_sections"],
            )
            print(f"  ✓ Indexed: '{doc_def['title']}' ({len(doc_def['raw_sections'])} sections) -> Doc ID: {doc_id}")
            indexed_summary.append({"tenant_id": t_id, "doc_id": doc_id, "title": doc_def["title"]})

    print(f"\nTotal Indexed Documents: {len(indexed_summary)}")
    total_chunks = db.ai_knowledge_chunks.count_documents({})
    print(f"Total Vector Chunks in Database: {total_chunks}")
    return indexed_summary


if __name__ == "__main__":
    seed_rag_knowledge()

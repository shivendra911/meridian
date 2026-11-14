"""PlaceFlow / Meridian — Seed Demo Accounts & Identity Linkage Engine (Phase 1)
=================================================================================
Seeds one authenticated demo account per baseline platform role with linked
person identities, institutional memberships, and authoritative role assignments.

Strictly REFUSES to run when Django settings.DEBUG is False.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Ensure placeflow root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
import django
django.setup()

from django.conf import settings
from database.connection import get_db
from camp_01.seed_core import seed_baseline_institutions
from camp_02.identities import create_person_identity, resolve_subject
from camp_02.accounts import create_account, hash_password, set_account_password
from camp_02.memberships import create_institutional_membership
from camp_02.roles import seed_baseline_roles, get_role_by_id
from camp_02.permissions import seed_permission_catalogue
from camp_02.assignments import assign_role, get_effective_user_permissions


DEMO_SPECS = [
    {
        "role_code": "STUDENT_MEMBER",
        "username": "student",
        "email": "aarav.student@univ.edu",
        "name": "Aarav Sharma",
        "subject_type": "student",
        "subject_id": "STU001",
        "person_id": "PER_STU_001",
        "membership_type": "STUDENT",
        "scope_type": "SELF",
        "scope_id": "STU001",
    },
    {
        "role_code": "PLACEMENT_REP",
        "username": "placement_rep",
        "email": "diya.rep@univ.edu",
        "name": "Diya Patel",
        "subject_type": "student",
        "subject_id": "STU002",
        "person_id": "PER_STU_002",
        "membership_type": "STUDENT",
        "scope_type": "ORGANIZATIONAL_UNIT",
        "scope_id": "OU_CSE",
    },
    {
        "role_code": "FACULTY_MENTOR",
        "username": "faculty",
        "email": "faculty@univ.edu",
        "name": "Dr. Janpreet Singh",
        "subject_type": "faculty",
        "subject_id": "11266",
        "person_id": "PER_FAC_11266",
        "membership_type": "FACULTY",
        "scope_type": "ORGANIZATIONAL_UNIT",
        "scope_id": "OU_CSE",
    },
    {
        "role_code": "DEPT_COORDINATOR",
        "username": "coordinator",
        "email": "coordinator@univ.edu",
        "name": "Prof. Swathy Reghu",
        "subject_type": "faculty",
        "subject_id": "35422",
        "person_id": "PER_FAC_35422",
        "membership_type": "FACULTY",
        "scope_type": "ORGANIZATIONAL_UNIT",
        "scope_id": "OU_CSE",
    },
    {
        "role_code": "DEPARTMENT_HEAD",
        "username": "hod",
        "email": "hod.cse@univ.edu",
        "name": "Dr. Sweety Sehgal",
        "subject_type": "department_head",
        "subject_id": "11115",
        "person_id": "PER_HOD_11115",
        "membership_type": "FACULTY",
        "scope_type": "ORGANIZATIONAL_UNIT",
        "scope_id": "OU_CSE",
    },
    {
        "role_code": "SCHOOL_HEAD",
        "username": "dean",
        "email": "dean.scai@univ.edu",
        "name": "Dr. Arun Malik",
        "subject_type": "school_head",
        "subject_id": "HOS_SCAI",
        "person_id": "PER_HOS_HOS_SCAI",
        "membership_type": "FACULTY",
        "scope_type": "CAMPUS",
        "scope_id": "CMP_MAIN",
    },
    {
        "role_code": "TPO_COORDINATOR",
        "username": "tpo_coordinator",
        "email": "tpocoord@univ.edu",
        "name": "Placement Operations Officer",
        "subject_type": "faculty",
        "subject_id": "FAC_TPO_COORD",
        "person_id": "PER_TPO_COORD",
        "membership_type": "STAFF",
        "scope_type": "CAMPUS",
        "scope_id": "CMP_MAIN",
    },
    {
        "role_code": "TPO_ADMIN",
        "username": "tpo_admin",
        "email": "tpo.head@univ.edu",
        "name": "Dr. K. Venkatesh",
        "subject_type": "admin",
        "subject_id": "ADM_TPO_HEAD",
        "person_id": "PER_TPO_004",
        "membership_type": "STAFF",
        "scope_type": "INSTITUTION",
        "scope_id": None,  # Dynamically resolved to institution_id
    },
    {
        "role_code": "INSTITUTION_HEAD",
        "username": "vice_chancellor",
        "email": "vc@univ.edu",
        "name": "Prof. Dr. P. K. Bansal",
        "subject_type": "admin",
        "subject_id": "ADM_VC",
        "person_id": "PER_VC_001",
        "membership_type": "STAFF",
        "scope_type": "INSTITUTION",
        "scope_id": None,
    },
    {
        "role_code": "INSTITUTION_ADMIN",
        "username": "admin",
        "email": "admin@univ.edu",
        "name": "Arjun Mehta",
        "subject_type": "admin",
        "subject_id": "ADM_SYS",
        "person_id": "PER_SYS_006",
        "membership_type": "STAFF",
        "scope_type": "INSTITUTION",
        "scope_id": None,
    },
    {
        "role_code": "SUPER_ADMIN",
        "username": "superadmin",
        "email": "superadmin@univ.edu",
        "name": "Platform Super Administrator",
        "subject_type": "admin",
        "subject_id": "ADM_SUPER",
        "person_id": "PER_SUPER_ADMIN",
        "membership_type": "STAFF",
        "scope_type": "PLATFORM",
        "scope_id": "global",
    },
    {
        "role_code": "AUDITOR",
        "username": "auditor",
        "email": "auditor@univ.edu",
        "name": "NIRF Statutory Auditor",
        "subject_type": "admin",
        "subject_id": "ADM_AUDITOR",
        "person_id": "PER_AUDITOR_001",
        "membership_type": "STAFF",
        "scope_type": "INSTITUTION",
        "scope_id": None,
    },
    {
        "role_code": "RECRUITER_EXTERNAL",
        "username": "recruiter",
        "email": "recruiter@accenture.com",
        "name": "Accenture Campus Lead",
        "subject_type": "recruiter",
        "subject_id": "COMP001",
        "person_id": "PER_RECRUITER_001",
        "membership_type": "EXTERNAL_RECRUITER",
        "scope_type": "SELF",
        "scope_id": "COMP001",
    },
]

DEMO_PASSWORD = "password123"


def seed_demo_accounts(db=None):
    """Authoritative idempotent seeding of demo accounts."""
    if not settings.DEBUG:
        raise RuntimeError("CRITICAL: Refusing to seed demo accounts in non-DEBUG production mode!")

    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)

    # 1. Ensure permissions catalogue & baseline roles are loaded
    seed_permission_catalogue(db=db)
    seed_baseline_roles(db=db)

    # 2. Resolve default tenant & institution (ensure baseline institutions exist)
    if db.platform_tenants.count_documents({"status": "ACTIVE"}) == 0:
        seed_baseline_institutions()

    tenant = db.platform_tenants.find_one({"status": "ACTIVE"})
    tenant_id = tenant["id"] if tenant else "ten_default"

    inst = db.institutions.find_one({"tenant_id": tenant_id})
    institution_id = inst["institution_id"] if inst else "inst_default"

    # Seed demo student mentors and schools
    from database.sample_data import STUDENTS
    for s in STUDENTS:
        db.students.update_one(
            {"student_id": s["student_id"]},
            {"$set": {
                "name": s["name"],
                "department": s["department"],
                "school": s.get("school", "School of Computing"),
                "mentor_id": s.get("mentor_id"),
            }},
            upsert=True,
        )

    # Seed institutional mentorship topology
    mentorship_rels = [
        {
            "relation_id": "REL_STU_MEN_STU001_11266",
            "from_type": "STUDENT",
            "from_id": "STU001",
            "from_name": "Aarav Sharma",
            "relation_type": "MENTORED_BY",
            "to_type": "FACULTY",
            "to_id": "11266",
            "to_name": "Dr. Janpreet Singh",
            "metadata": {"school": "School of Computing", "department": "CSE"},
            "created_at": now,
        },
        {
            "relation_id": "REL_STU_MEN_STU002_11266",
            "from_type": "STUDENT",
            "from_id": "STU002",
            "from_name": "Diya Patel",
            "relation_type": "MENTORED_BY",
            "to_type": "FACULTY",
            "to_id": "11266",
            "to_name": "Dr. Janpreet Singh",
            "metadata": {"school": "School of Computing", "department": "CSE"},
            "created_at": now,
        },
    ]
    for rel in mentorship_rels:
        db.institutional_relationships.update_one(
            {"relation_id": rel["relation_id"]},
            {"$set": rel},
            upsert=True,
        )

    results = []

    for spec in DEMO_SPECS:
        role_code = spec["role_code"]
        username = spec["username"]
        email = spec["email"]
        name = spec["name"]
        person_id = spec["person_id"]
        subject_type = spec["subject_type"]
        subject_id = spec["subject_id"]
        scope_type = spec["scope_type"]
        scope_id = spec["scope_id"] or institution_id
        membership_type = spec["membership_type"]

        # Backfill subject record with person_id
        if subject_type == "student":
            db.students.update_one(
                {"student_id": subject_id},
                {"$set": {"person_id": person_id}},
            )
        elif subject_type == "faculty":
            db.faculty.update_one(
                {"faculty_id": subject_id},
                {
                    "$set": {"person_id": person_id, "name": name, "updated_at": now},
                    "$setOnInsert": {"faculty_id": subject_id, "created_at": now},
                },
                upsert=True,
            )
        elif subject_type == "department_head":
            db.department_heads.update_one(
                {"hod_id": subject_id},
                {
                    "$set": {"person_id": person_id, "name": name, "department": "CSE", "school": "School of Computing", "updated_at": now},
                    "$setOnInsert": {"hod_id": subject_id, "created_at": now},
                },
                upsert=True,
            )
        elif subject_type == "school_head":
            db.school_heads.update_one(
                {"hos_id": subject_id},
                {
                    "$set": {"person_id": person_id, "name": name, "school": "School of Computing", "updated_at": now},
                    "$setOnInsert": {"hos_id": subject_id, "created_at": now},
                },
                upsert=True,
            )
        elif subject_type == "admin":
            db.admins.update_one(
                {"admin_id": subject_id},
                {
                    "$set": {"person_id": person_id, "name": name, "role": role_code, "email": email, "updated_at": now},
                    "$setOnInsert": {"admin_id": subject_id, "created_at": now},
                },
                upsert=True,
            )

        # Ensure Person Identity exists
        first_name = name.split()[0]
        last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else "Demo"
        person_meta = {"company_id": subject_id} if subject_type == "recruiter" else {}
        db.person_identities.update_one(
            {"person_id": person_id},
            {
                "$set": {
                    "person_id": person_id,
                    "primary_email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "legal_first_name": first_name,
                    "legal_last_name": last_name,
                    "metadata": person_meta,
                    "status": "ACTIVE",
                    "tenant_id": tenant_id,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

        # Ensure Account exists with valid password hash
        account = db.accounts.find_one({"$or": [{"username": username}, {"email": email}]})
        pwd_hash, salt = hash_password(DEMO_PASSWORD)
        if not account:
            account_id = f"acc_demo_{username}"
            db.accounts.insert_one({
                "account_id": account_id,
                "person_id": person_id,
                "tenant_id": tenant_id,
                "account_type": "HUMAN",
                "username": username,
                "email": email,
                "password_hash": pwd_hash,
                "password_salt": salt,
                "status": "ACTIVE",
                "failed_login_attempts": 0,
                "created_at": now,
                "updated_at": now,
            })
            account = db.accounts.find_one({"account_id": account_id})
        else:
            db.accounts.update_one(
                {"account_id": account["account_id"]},
                {"$set": {
                    "tenant_id": tenant_id,
                    "person_id": person_id,
                    "username": username,
                    "email": email,
                    "password_hash": pwd_hash,
                    "password_salt": salt,
                    "status": "ACTIVE",
                    "failed_login_attempts": 0,
                    "updated_at": now,
                }},
            )

        account_id = account["account_id"]
        set_account_password(account_id, DEMO_PASSWORD, db=db)

        # Ensure Institutional Membership exists
        mem = db.institution_memberships.find_one({
            "$or": [
                {
                    "institution_id": institution_id,
                    "person_id": person_id,
                    "membership_type": membership_type,
                },
                {"membership_id": f"mem_demo_{username}"},
            ]
        })
        if not mem:
            mem_id = f"mem_demo_{username}"
            db.institution_memberships.insert_one({
                "membership_id": mem_id,
                "tenant_id": tenant_id,
                "institution_id": institution_id,
                "person_id": person_id,
                "account_id": account_id,
                "membership_type": membership_type,
                "status": "ACTIVE",
                "valid_from": now - timedelta(days=365),
                "created_at": now,
                "updated_at": now,
            })
            mem = db.institution_memberships.find_one({"membership_id": mem_id})
        else:
            db.institution_memberships.update_one(
                {"membership_id": mem["membership_id"]},
                {"$set": {
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "person_id": person_id,
                    "account_id": account_id,
                    "membership_type": membership_type,
                    "status": "ACTIVE",
                    "updated_at": now,
                }},
            )

        membership_id = mem["membership_id"]

        # Resolve role record
        role = get_role_by_id(role_code, db=db)
        canonical_role_id = role["role_id"]

        # Assign Role idempotently
        existing_asgn = db.role_assignments.find_one({
            "account_id": account_id,
            "role_id": canonical_role_id,
        })
        if not existing_asgn:
            asgn = assign_role(
                tenant_id=tenant_id,
                institution_id=institution_id,
                account_id=account_id,
                membership_id=membership_id,
                role_id=canonical_role_id,
                scope_type=scope_type,
                scope_id=scope_id,
                assigned_by="seed_script",
                db=db,
            )
        else:
            db.role_assignments.update_one(
                {"assignment_id": existing_asgn["assignment_id"]},
                {"$set": {
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "membership_id": membership_id,
                    "status": "ACTIVE",
                    "scope_type": scope_type,
                    "scope_id": scope_id,
                    "valid_from": now - timedelta(days=30),
                    "valid_to": None,
                }},
            )

        # Compute effective permissions
        perms = get_effective_user_permissions(account_id, institution_id=institution_id, db=db)
        total_perms = sum(len(p.get("permissions", [])) for p in perms)
        resolved = resolve_subject(person_id, db=db)

        results.append({
            "username": username,
            "password": DEMO_PASSWORD,
            "role": role_code,
            "subject_type": resolved["type"] if resolved else "none",
            "subject_id": resolved["id"] if resolved else "none",
            "effective_perms": total_perms,
        })

    return results


if __name__ == "__main__":
    print("=" * 80)
    print("PlaceFlow / Meridian — Seeding Demo Accounts (DEBUG Mode)")
    print("=" * 80)
    demo_results = seed_demo_accounts()
    print(f"\n{'Username':18} | {'Password':12} | {'Role':20} | {'Subject':18} | {'Perms':5}")
    print("-" * 80)
    for r in demo_results:
        subj = f"{r['subject_type']}:{r['subject_id']}"
        print(f"{r['username']:18} | {r['password']:12} | {r['role']:20} | {subj:18} | {r['effective_perms']:5}")
    print("=" * 80)
    print(f"Successfully seeded and linked {len(demo_results)} demo accounts with verified effective permissions.\n")

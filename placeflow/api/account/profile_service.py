"""PlaceFlow / Meridian — Composed Profile & Identity Card Service (Phase 1).

Implements server-side profile composition, self-asserted patch allowlists,
and privacy-preserving PersonCard generation with RBAC masking.
Reference: docs/PLATFORM_SPEC.md Section 1, 2, and 4.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from database.connection import get_db

DEFAULT_TENANT_ID = "3f0708bc-4852-4900-a0b2-5e27865a36fe"

# Strict allowlist for PATCH /api/account/profile/
SELF_ASSERTED_ALLOWLIST = {
    "preferred_name",
    "headline",
    "primary_phone",
    "phone",
    "locale",
    "timezone",
    "notification_prefs",
    "summary",
    "skills",
    "links",
}


def get_profile_summary(
    account_id: str,
    person_id: Optional[str],
    subject: Optional[Dict[str, Any]],
    tenant_id: str,
    institution_id: Optional[str],
    db=None,
) -> Dict[str, Any]:
    """Builds the compact profile summary embedded into /api/auth/me/."""
    if db is None:
        db = get_db()

    person = db.person_identities.find_one({"person_id": person_id}, {"_id": 0}) if person_id else None
    account = db.accounts.find_one({"account_id": account_id}, {"_id": 0}) or {}

    # 1. Names
    fn = (person or {}).get("first_name", "")
    ln = (person or {}).get("last_name", "")
    full_name = f"{fn} {ln}".strip() or (person or {}).get("display_name") or account.get("username", "User")
    preferred_name = (person or {}).get("preferred_name") or None

    # 2. Avatar URL
    avatar_url = None
    if person and person.get("avatar") and person["avatar"].get("key"):
        avatar_url = f"/api/media/avatar/{person_id}/"

    # 3. Email
    email = account.get("email") or account.get("primary_email") or (person or {}).get("primary_email") or ""

    # 4. Department & Subject info
    dept = ""
    affiliation_label = "Campus Member"
    headline = (person or {}).get("headline") or ""

    # Check person_affiliations
    primary_aff = None
    if person_id:
        primary_aff = db.person_affiliations.find_one(
            {"person_id": person_id, "status": "VERIFIED"},
            {"_id": 0},
            sort=[("created_at", -1)],
        )

    if subject and subject.get("type") == "student":
        student = db.students.find_one({"student_id": subject.get("id")}, {"_id": 0}) or {}
        dept = student.get("department", "CSE")
        sem = (student.get("year", 4) * 2) - 1 if student.get("year") else 7
        affiliation_label = f"B.Tech {dept}, Semester {sem}"
        if not headline:
            headline = f"Student · {affiliation_label}"
    elif subject and subject.get("type") == "faculty":
        faculty = db.faculty.find_one({"faculty_id": subject.get("id")}, {"_id": 0}) or {}
        dept = faculty.get("department", "CSE")
        rank = faculty.get("academic_rank") or faculty.get("designation") or "Faculty"
        affiliation_label = f"{rank}, {dept}"
        if not headline:
            headline = affiliation_label
    elif primary_aff:
        aff_type = primary_aff.get("type")
        aff_meta = primary_aff.get("metadata") or {}
        dept = aff_meta.get("department") or ""
        if aff_type == "STUDENT":
            affiliation_label = f"Student · {dept}"
        elif aff_type == "FACULTY":
            affiliation_label = f"Faculty · {dept}"
        elif aff_type == "HOD":
            affiliation_label = f"Head of Department · {dept}"
        elif aff_type == "DEAN":
            affiliation_label = f"Dean · {aff_meta.get('school', 'Academic School')}"
        if not headline:
            headline = affiliation_label

    # 5. Institution Name
    inst_name = "Apex Institute of Technology"
    if institution_id:
        inst_doc = db.institutions.find_one({"institution_id": institution_id}, {"_id": 0, "legal_name": 1, "name": 1})
        if inst_doc:
            inst_name = inst_doc.get("legal_name") or inst_doc.get("name") or inst_name

    return {
        "display_name": full_name,
        "preferred_name": preferred_name,
        "avatar_url": avatar_url,
        "headline": headline,
        "email": email,
        "affiliation_label": affiliation_label,
        "institution_name": inst_name,
        "department": dept,
    }


def get_unread_notifications_count(person_id: Optional[str], db=None) -> int:
    """Returns the count of unread notifications for a person."""
    if not person_id:
        return 0
    if db is None:
        db = get_db()
    return db.notifications.count_documents({"person_id": person_id, "read_at": None})


def get_full_composed_profile(
    account_id: str,
    person_id: Optional[str],
    tenant_id: str,
    institution_id: Optional[str],
    db=None,
) -> Dict[str, Any]:
    """Composes the full profile dossier for GET /api/account/profile/."""
    if db is None:
        db = get_db()

    account = db.accounts.find_one({"account_id": account_id}, {"_id": 0}) or {}
    person = db.person_identities.find_one({"person_id": person_id}, {"_id": 0}) if person_id else {}

    # Person identity core
    fn = (person or {}).get("first_name", "")
    ln = (person or {}).get("last_name", "")
    full_name = f"{fn} {ln}".strip() or (person or {}).get("display_name") or account.get("username", "User")

    # Affiliations
    affiliations_list = []
    if person_id:
        affs = list(db.person_affiliations.find({"person_id": person_id}, {"_id": 0}))
        for aff in affs:
            # Enrich with official record details
            official_data = dict(aff.get("metadata") or {})
            rec_id = aff.get("record_id")
            if aff.get("type") == "STUDENT" and rec_id:
                stu = db.students.find_one({"student_id": rec_id}, {"_id": 0}) or {}
                official_data.update({
                    "reg_no": stu.get("reg_no"),
                    "department": stu.get("department"),
                    "year": stu.get("year"),
                    "batch": stu.get("batch"),
                    "cgpa": stu.get("cgpa"),
                    "placement_status": stu.get("placement_status"),
                })
            elif aff.get("type") == "FACULTY" and rec_id:
                fac = db.faculty.find_one({"faculty_id": rec_id}, {"_id": 0}) or {}
                official_data.update({
                    "department": fac.get("department"),
                    "designation": fac.get("academic_rank") or fac.get("designation"),
                })
            aff_item = dict(aff)
            aff_item["official_data"] = official_data
            affiliations_list.append(aff_item)

    # Roles
    from camp_02.assignments import list_active_role_assignments
    raw_assignments = list_active_role_assignments(account_id, institution_id=institution_id, db=db)
    roles_list = []
    for a in raw_assignments:
        r_doc = db.roles.find_one({"role_id": a.get("role_id")}, {"_id": 0, "role_code": 1, "name": 1})
        roles_list.append({
            "role_id": a.get("role_id"),
            "role_code": r_doc.get("role_code") if r_doc else a.get("role_id", "").replace("role_sys_", "").upper(),
            "name": r_doc.get("name") if r_doc else "",
            "scope_type": a.get("scope_type"),
            "scope_id": a.get("scope_id"),
        })

    # Student Profile Extension
    extension = None
    student_record = None
    if person_id:
        student_aff = next((a for a in affiliations_list if a.get("type") == "STUDENT"), None)
        if student_aff:
            sid = student_aff["record_id"]
            extension = db.student_profiles.find_one({"student_id": sid}, {"_id": 0})
            student_record = db.students.find_one({"student_id": sid}, {"_id": 0})

    # Completeness calculation
    completeness_factors = [
        bool(person.get("avatar", {}).get("key")),
        bool(person.get("headline")),
        bool(person.get("preferred_name")),
        bool(person.get("primary_phone")),
        bool(extension and extension.get("skills")),
    ]
    completeness_score = int((sum(completeness_factors) / len(completeness_factors)) * 100)
    next_missing = "add a photo" if not person.get("avatar", {}).get("key") else (
        "write a headline" if not person.get("headline") else (
            "add skills" if not (extension and extension.get("skills")) else "complete"
        )
    )

    avatar_url = f"/api/media/avatar/{person_id}/" if person.get("avatar", {}).get("key") else None

    return {
        "person_id": person_id,
        "account_id": account_id,
        "first_name": person.get("first_name", ""),
        "last_name": person.get("last_name", ""),
        "display_name": full_name,
        "preferred_name": person.get("preferred_name"),
        "headline": person.get("headline") or "",
        "primary_email": account.get("email") or person.get("primary_email", ""),
        "primary_phone": person.get("primary_phone") or (student_record or {}).get("phone"),
        "avatar_url": avatar_url,
        "locale": person.get("locale", "en-IN"),
        "timezone": person.get("timezone", "Asia/Kolkata"),
        "notification_prefs": person.get("notification_prefs", {"email": True, "in_app": True}),
        "onboarded_at": person.get("onboarded_at"),
        "completeness": {
            "score": completeness_score,
            "next_missing": next_missing,
        },
        "affiliations": affiliations_list,
        "roles": roles_list,
        "extension": extension,
    }


def update_self_profile(
    person_id: Optional[str],
    student_id: Optional[str],
    tenant_id: str,
    patch_data: Dict[str, Any],
    db=None,
) -> Dict[str, Any]:
    """Updates editable self-asserted profile fields, strictly enforcing allowlist."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)

    # 1. Enforce strict allowlist: reject unknown or read-only fields
    for k in patch_data.keys():
        if k not in SELF_ASSERTED_ALLOWLIST:
            raise ValueError(f"Field '{k}' is read-only or not editable.")

    # 2. Extract Person fields
    person_updates = {}
    if "preferred_name" in patch_data:
        person_updates["preferred_name"] = str(patch_data["preferred_name"]).strip() if patch_data["preferred_name"] else None
    if "headline" in patch_data:
        person_updates["headline"] = str(patch_data["headline"]).strip() if patch_data["headline"] else None
    if "primary_phone" in patch_data or "phone" in patch_data:
        raw_phone = patch_data.get("primary_phone") or patch_data.get("phone")
        person_updates["primary_phone"] = str(raw_phone).strip() if raw_phone else None
    if "locale" in patch_data:
        person_updates["locale"] = str(patch_data["locale"]).strip()
    if "timezone" in patch_data:
        person_updates["timezone"] = str(patch_data["timezone"]).strip()
    if "notification_prefs" in patch_data and isinstance(patch_data["notification_prefs"], dict):
        person_updates["notification_prefs"] = {
            "email": bool(patch_data["notification_prefs"].get("email", True)),
            "in_app": bool(patch_data["notification_prefs"].get("in_app", True)),
        }

    if person_id and person_updates:
        person_updates["updated_at"] = now
        db.person_identities.update_one({"person_id": person_id}, {"$set": person_updates})

    # 3. Extract Student Profile Extension fields
    ext_updates = {}
    if "summary" in patch_data:
        ext_updates["summary"] = str(patch_data["summary"]).strip() if patch_data["summary"] else None
    if "skills" in patch_data and isinstance(patch_data["skills"], list):
        clean_skills = [str(s).strip() for s in patch_data["skills"] if str(s).strip()]
        ext_updates["skills"] = clean_skills
        # Sync back to students collection if student_id available
        if student_id:
            db.students.update_one({"student_id": student_id}, {"$set": {"skills": clean_skills}})
    if "links" in patch_data and isinstance(patch_data["links"], list):
        clean_links = [str(l).strip() for l in patch_data["links"] if str(l).strip()]
        ext_updates["links"] = clean_links

    if student_id and (ext_updates or "summary" in patch_data or "skills" in patch_data or "links" in patch_data):
        ext_updates["updated_at"] = now
        db.student_profiles.update_one(
            {"student_id": student_id, "tenant_id": tenant_id},
            {"$set": ext_updates, "$setOnInsert": {"student_id": student_id, "tenant_id": tenant_id}},
            upsert=True,
        )

    return {"success": True, "updated_fields": list(patch_data.keys())}


def get_person_card(
    target_person_id: str,
    viewer_user: Any,
    db=None,
) -> Dict[str, Any]:
    """Generates the card payload for GET /api/people/<person_id>/card/ with RBAC masking."""
    if db is None:
        db = get_db()

    target_person = db.person_identities.find_one({"person_id": target_person_id}, {"_id": 0})
    if not target_person:
        return {"error": "PersonNotFound"}

    # Determine viewer relation
    is_self = (getattr(viewer_user, "person_id", None) == target_person_id)

    fn = target_person.get("first_name", "")
    ln = target_person.get("last_name", "")
    name = f"{fn} {ln}".strip() or target_person.get("display_name", "User")
    preferred_name = target_person.get("preferred_name")
    avatar_url = f"/api/media/avatar/{target_person_id}/" if target_person.get("avatar", {}).get("key") else None
    headline = target_person.get("headline") or ""

    # Check target affiliations
    affs = list(db.person_affiliations.find({"person_id": target_person_id, "status": "VERIFIED"}, {"_id": 0}))
    primary_aff = affs[0] if affs else None

    role_labels = []
    department = ""
    official_data: Dict[str, Any] = {}
    hidden_fields: List[str] = []

    # Check if target is student
    target_student_aff = next((a for a in affs if a.get("type") == "STUDENT"), None)
    if target_student_aff:
        role_labels.append("Student")
        sid = target_student_aff.get("record_id")
        student_doc = db.students.find_one({"student_id": sid}, {"_id": 0}) or {}
        department = student_doc.get("department", "")
        if not headline:
            headline = f"B.Tech {department}, Semester {(student_doc.get('year', 4) * 2) - 1 if student_doc.get('year') else 7}"

        official_data["reg_no"] = student_doc.get("reg_no")
        official_data["department"] = department
        official_data["batch"] = student_doc.get("batch")

        # Viewer scope and masking checks:
        viewer_subject = getattr(viewer_user, "subject", None) or {}
        is_viewer_student = (viewer_subject.get("type") == "student")

        if is_self:
            # Self sees all their data
            official_data["cgpa"] = student_doc.get("cgpa")
            official_data["phone"] = student_doc.get("phone") or target_person.get("primary_phone")
            official_data["email"] = student_doc.get("email") or target_person.get("primary_email")
            hidden_fields = []
        elif is_viewer_student:
            # Fellow student viewing another student: phone, email, CGPA, backlogs are MASKED
            hidden_fields = ["phone", "email", "cgpa", "backlogs"]
        else:
            # Administrative or faculty role viewing student:
            # check if viewer has student.record.export or student.profile.read
            has_full_read = viewer_user.has("student.record.export") or viewer_user.has("placement.application.view")
            if has_full_read:
                official_data["cgpa"] = student_doc.get("cgpa")
                official_data["phone"] = student_doc.get("phone") or target_person.get("primary_phone")
                official_data["email"] = student_doc.get("email") or target_person.get("primary_email")
                hidden_fields = []
            else:
                official_data["cgpa"] = student_doc.get("cgpa")
                hidden_fields = ["phone", "email"]
    elif primary_aff:
        aff_type = primary_aff.get("type")
        role_labels.append(aff_type.capitalize())
        meta = primary_aff.get("metadata") or {}
        department = meta.get("department", "")
        if not headline:
            headline = f"{aff_type.capitalize()} · {department}"
        official_data["department"] = department

        if is_self or viewer_user.has("directory.view.all"):
            official_data["email"] = target_person.get("primary_email")
            official_data["phone"] = target_person.get("primary_phone")
            hidden_fields = []
        else:
            hidden_fields = ["phone", "email"]

    return {
        "person_id": target_person_id,
        "name": name,
        "display_name": name,
        "preferred_name": preferred_name,
        "avatar_url": avatar_url,
        "headline": headline,
        "role_labels": role_labels,
        "department": department,
        "is_verified": bool(primary_aff),
        "verification_label": "Verified by institution" if primary_aff else "Unverified",
        "official_data": official_data,
        "hidden": hidden_fields,
    }


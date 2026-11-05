"""MongoDB $jsonSchema validators and index configurations for CAMP-03 Sub-Phase 3.1.

Governs Academic Programs, Qualifications, Offerings, Joint Delivery Units,
and Specializations.
"""

QUALIFICATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "qualification_id",
            "tenant_id",
            "institution_id",
            "qualification_code",
            "official_title",
            "qualification_level",
            "qualification_category",
            "awarding_authority_type",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "qualification_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "qualification_code": {"bsonType": "string", "minLength": 2, "maxLength": 50},
            "official_title": {"bsonType": "string", "minLength": 2, "maxLength": 255},
            "qualification_level": {"bsonType": "number"},
            "qualification_category": {
                "enum": [
                    "UNDERGRADUATE",
                    "POSTGRADUATE",
                    "DOCTORAL",
                    "DIPLOMA",
                    "POST_GRADUATE_DIPLOMA",
                    "CERTIFICATE",
                    "VOCATIONAL",
                ]
            },
            "awarding_authority_type": {
                "enum": [
                    "UNIVERSITY",
                    "AUTONOMOUS_COLLEGE",
                    "TECHNICAL_BOARD",
                    "STATE_COUNCIL",
                    "PROFESSIONAL_BODY",
                ]
            },
            "framework_reference": {
                "bsonType": "object",
                "properties": {
                    "framework_name": {"bsonType": "string"},
                    "standard_version": {"bsonType": "string"},
                    "framework_level": {"bsonType": "string"},
                    "reference_url": {"bsonType": "string"},
                },
            },
            "status": {"enum": ["ACTIVE", "INACTIVE", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

PROGRAMS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "program_id",
            "tenant_id",
            "institution_id",
            "program_code",
            "program_title",
            "qualification_id",
            "primary_academic_unit_id",
            "is_interdisciplinary",
            "delivery_mode",
            "nominal_duration_semesters",
            "maximum_duration_semesters",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "program_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "program_code": {"bsonType": "string", "minLength": 2, "maxLength": 50},
            "program_title": {"bsonType": "string", "minLength": 2, "maxLength": 255},
            "qualification_id": {"bsonType": "string"},
            "primary_academic_unit_id": {"bsonType": "string"},
            "is_interdisciplinary": {"bsonType": "bool"},
            "delivery_mode": {
                "enum": [
                    "REGULAR_FULL_TIME",
                    "EVENING_PART_TIME",
                    "ONLINE_DISTANCE",
                    "HYBRID",
                    "APPRENTICESHIP_EMBEDDED",
                ]
            },
            "nominal_duration_semesters": {"bsonType": "number", "multipleOf": 1},
            "maximum_duration_semesters": {"bsonType": "number", "multipleOf": 1},
            "status": {"enum": ["DRAFT", "ACTIVE", "PHASING_OUT", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

PROGRAM_VERSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "program_version_id",
            "program_id",
            "tenant_id",
            "institution_id",
            "version_code",
            "curriculum_name",
            "effective_from",
            "applicable_cohorts",
            "total_credits_required",
            "credit_policy",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "program_version_id": {"bsonType": "string"},
            "program_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "version_code": {"bsonType": "string", "minLength": 1, "maxLength": 50},
            "curriculum_name": {"bsonType": "string", "minLength": 2, "maxLength": 255},
            "effective_from": {"bsonType": "date"},
            "effective_to": {"bsonType": ["date", "null"]},
            "applicable_cohorts": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "total_credits_required": {"bsonType": "number"},
            "credit_policy": {"bsonType": "object"},
            "status": {
                "enum": ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "SUPERSEDED"]
            },
            "approved_by_membership_id": {"bsonType": ["string", "null"]},
            "approved_at": {"bsonType": ["date", "null"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

PROGRAM_OFFERINGS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "offering_id",
            "tenant_id",
            "institution_id",
            "program_version_id",
            "program_id",
            "campus_id",
            "academic_year",
            "shift",
            "sanctioned_intake",
            "supernumerary_quota",
            "enrolled_count",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "offering_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "program_version_id": {"bsonType": "string"},
            "program_id": {"bsonType": "string"},
            "campus_id": {"bsonType": "string"},
            "academic_year": {"bsonType": "string"},
            "shift": {
                "enum": ["REGULAR_MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]
            },
            "sanctioned_intake": {"bsonType": "number", "multipleOf": 1},
            "supernumerary_quota": {"bsonType": "number", "multipleOf": 1},
            "enrolled_count": {"bsonType": "number", "multipleOf": 1},
            "status": {
                "enum": [
                    "PLANNED",
                    "ADMISSIONS_OPEN",
                    "ADMISSIONS_CLOSED",
                    "ACTIVE",
                    "CONCLUDED",
                    "CANCELLED",
                ]
            },
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

PROGRAM_OFFERING_UNITS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "offering_unit_id",
            "offering_id",
            "academic_unit_id",
            "responsibility_type",
            "created_at",
        ],
        "properties": {
            "offering_unit_id": {"bsonType": "string"},
            "offering_id": {"bsonType": "string"},
            "academic_unit_id": {"bsonType": "string"},
            "responsibility_type": {
                "enum": [
                    "PRIMARY_ADMIN",
                    "JOINT_TEACHING",
                    "LAB_FACILITY",
                    "RESEARCH_AFFILIATION",
                ]
            },
            "share_percentage": {"bsonType": "number"},
            "created_at": {"bsonType": "date"},
        },
    }
}

PROGRAM_SPECIALIZATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "specialization_id",
            "program_version_id",
            "specialization_code",
            "specialization_title",
            "specialization_type",
            "required_credits",
            "status",
            "created_at",
        ],
        "properties": {
            "specialization_id": {"bsonType": "string"},
            "program_version_id": {"bsonType": "string"},
            "specialization_code": {"bsonType": "string", "minLength": 2, "maxLength": 50},
            "specialization_title": {"bsonType": "string", "minLength": 2, "maxLength": 255},
            "specialization_type": {
                "enum": ["MAJOR", "MINOR", "HONOURS_RESEARCH", "CONCENTRATION"]
            },
            "required_credits": {"bsonType": "number"},
            "status": {"enum": ["ACTIVE", "INACTIVE"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}


def setup_camp03_foundation_collections(db):
    """Idempotently apply collections, validators and indexes for Sub-Phase 3.1."""
    # 1. qualifications
    if "qualifications" not in db.list_collection_names():
        db.create_collection("qualifications", validator=QUALIFICATIONS_VALIDATOR)
    else:
        db.command("collMod", "qualifications", validator=QUALIFICATIONS_VALIDATOR)
    db.qualifications.create_index([("qualification_id", 1)], unique=True, name="uq_qual_id")
    db.qualifications.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("qualification_code", 1)],
        unique=True,
        name="uq_qual_tenant_inst_code",
    )
    db.qualifications.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("qualification_level", 1)],
        name="ix_qual_level",
    )

    # 2. programs
    if "programs" not in db.list_collection_names():
        db.create_collection("programs", validator=PROGRAMS_VALIDATOR)
    else:
        db.command("collMod", "programs", validator=PROGRAMS_VALIDATOR)
    db.programs.create_index([("program_id", 1)], unique=True, name="uq_program_id")
    db.programs.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("program_code", 1)],
        unique=True,
        name="uq_prog_tenant_inst_code",
    )
    db.programs.create_index([("qualification_id", 1)], name="ix_prog_qual")
    db.programs.create_index([("primary_academic_unit_id", 1)], name="ix_prog_academic_unit")

    # 3. program_versions
    if "program_versions" not in db.list_collection_names():
        db.create_collection("program_versions", validator=PROGRAM_VERSIONS_VALIDATOR)
    else:
        db.command("collMod", "program_versions", validator=PROGRAM_VERSIONS_VALIDATOR)
    db.program_versions.create_index([("program_version_id", 1)], unique=True, name="uq_pv_id")
    db.program_versions.create_index(
        [("program_id", 1), ("version_code", 1)],
        unique=True,
        name="uq_pv_prog_version_code",
    )
    db.program_versions.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("status", 1)],
        name="ix_pv_tenant_status",
    )

    # 4. program_offerings
    if "program_offerings" not in db.list_collection_names():
        db.create_collection("program_offerings", validator=PROGRAM_OFFERINGS_VALIDATOR)
    else:
        db.command("collMod", "program_offerings", validator=PROGRAM_OFFERINGS_VALIDATOR)
    db.program_offerings.create_index([("offering_id", 1)], unique=True, name="uq_offering_id")
    db.program_offerings.create_index(
        [
            ("tenant_id", 1),
            ("institution_id", 1),
            ("program_version_id", 1),
            ("campus_id", 1),
            ("academic_year", 1),
            ("shift", 1),
        ],
        unique=True,
        name="uq_offering_inst_campus_shift_year",
    )
    db.program_offerings.create_index([("program_id", 1)], name="ix_offering_prog")
    db.program_offerings.create_index([("campus_id", 1)], name="ix_offering_campus")

    # 5. program_offering_units
    if "program_offering_units" not in db.list_collection_names():
        db.create_collection("program_offering_units", validator=PROGRAM_OFFERING_UNITS_VALIDATOR)
    else:
        db.command("collMod", "program_offering_units", validator=PROGRAM_OFFERING_UNITS_VALIDATOR)
    db.program_offering_units.create_index(
        [("offering_unit_id", 1)], unique=True, name="uq_offering_unit_id"
    )
    db.program_offering_units.create_index(
        [("offering_id", 1), ("academic_unit_id", 1), ("responsibility_type", 1)],
        unique=True,
        name="uq_offering_unit_resp",
    )

    # 6. program_specializations
    if "program_specializations" not in db.list_collection_names():
        db.create_collection("program_specializations", validator=PROGRAM_SPECIALIZATIONS_VALIDATOR)
    else:
        db.command("collMod", "program_specializations", validator=PROGRAM_SPECIALIZATIONS_VALIDATOR)
    db.program_specializations.create_index(
        [("specialization_id", 1)], unique=True, name="uq_spec_id"
    )
    db.program_specializations.create_index(
        [("program_version_id", 1), ("specialization_code", 1)],
        unique=True,
        name="uq_spec_pv_code",
    )


# --- Sub-Phase 3.2: Curriculum, Course Registry & NEP 2020 Credit Architecture ---

COURSES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "course_id",
            "tenant_id",
            "institution_id",
            "course_code",
            "course_title",
            "offering_academic_unit_id",
            "course_level",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "course_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "course_code": {"bsonType": "string", "minLength": 2, "maxLength": 50},
            "course_title": {"bsonType": "string", "minLength": 2, "maxLength": 255},
            "offering_academic_unit_id": {"bsonType": "string"},
            "course_level": {"bsonType": "number", "multipleOf": 1},
            "status": {"enum": ["ACTIVE", "PHASING_OUT", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

COURSE_VERSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "course_version_id",
            "course_id",
            "tenant_id",
            "institution_id",
            "version_code",
            "lecture_hours_per_week",
            "tutorial_hours_per_week",
            "practical_hours_per_week",
            "studio_self_study_hours",
            "calculated_credits",
            "total_credits",
            "course_category",
            "syllabus_learning_outcomes",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "course_version_id": {"bsonType": "string"},
            "course_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "version_code": {"bsonType": "string", "minLength": 1, "maxLength": 50},
            "lecture_hours_per_week": {"bsonType": "number"},
            "tutorial_hours_per_week": {"bsonType": "number"},
            "practical_hours_per_week": {"bsonType": "number"},
            "studio_self_study_hours": {"bsonType": "number"},
            "calculated_credits": {"bsonType": "number"},
            "total_credits": {"bsonType": "number"},
            "course_category": {
                "enum": [
                    "MAJOR_CORE",
                    "MAJOR_ELECTIVE",
                    "MINOR_CORE",
                    "MINOR_ELECTIVE",
                    "MULTIDISCIPLINARY_MDC",
                    "ABILITY_ENHANCEMENT_AEC",
                    "SKILL_ENHANCEMENT_SEC",
                    "VALUE_ADDED_VAC",
                    "INTERNSHIP_EXPERIENTIAL",
                    "RESEARCH_DISSERTATION",
                    "NON_CREDIT_MANDATORY",
                ]
            },
            "syllabus_learning_outcomes": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "status": {"enum": ["DRAFT", "ACTIVE", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

CURRICULUM_REQUIREMENT_GROUPS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "group_id",
            "program_version_id",
            "group_name",
            "group_type",
            "minimum_credits",
            "maximum_credits",
            "is_mandatory",
            "status",
            "created_at",
        ],
        "properties": {
            "group_id": {"bsonType": "string"},
            "program_version_id": {"bsonType": "string"},
            "group_name": {"bsonType": "string", "minLength": 2, "maxLength": 200},
            "group_type": {
                "enum": [
                    "COMPULSORY_CORE",
                    "ELECTIVE_BASKET",
                    "OPEN_ELECTIVE",
                    "EXPERIENTIAL_PROJECT",
                    "AUDIT_NON_CREDIT",
                ]
            },
            "minimum_credits": {"bsonType": "number"},
            "maximum_credits": {"bsonType": "number"},
            "is_mandatory": {"bsonType": "bool"},
            "status": {"enum": ["ACTIVE", "INACTIVE"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

CURRICULUM_COURSE_REQUIREMENTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "requirement_id",
            "group_id",
            "course_id",
            "course_version_id",
            "is_compulsory",
            "recommended_term_sequence",
            "created_at",
        ],
        "properties": {
            "requirement_id": {"bsonType": "string"},
            "group_id": {"bsonType": "string"},
            "course_id": {"bsonType": "string"},
            "course_version_id": {"bsonType": "string"},
            "is_compulsory": {"bsonType": "bool"},
            "recommended_term_sequence": {"bsonType": "number", "multipleOf": 1},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

CURRICULUM_PREREQUISITES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "prerequisite_id",
            "target_course_id",
            "dependency_course_id",
            "dependency_type",
            "created_at",
        ],
        "properties": {
            "prerequisite_id": {"bsonType": "string"},
            "target_course_id": {"bsonType": "string"},
            "dependency_course_id": {"bsonType": "string"},
            "dependency_type": {
                "enum": [
                    "HARD_PREREQUISITE",
                    "SOFT_PREREQUISITE",
                    "CO_REQUISITE",
                    "MUTUALLY_EXCLUSIVE",
                ]
            },
            "minimum_grade_point": {"bsonType": ["number", "null"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

MULTIPLE_EXIT_RULES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "rule_id",
            "program_version_id",
            "exit_qualification_id",
            "exit_credential_title",
            "minimum_earned_credits",
            "mandatory_group_ids",
            "created_at",
        ],
        "properties": {
            "rule_id": {"bsonType": "string"},
            "program_version_id": {"bsonType": "string"},
            "exit_qualification_id": {"bsonType": "string"},
            "exit_credential_title": {"bsonType": "string"},
            "minimum_earned_credits": {"bsonType": "number"},
            "mandatory_group_ids": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "required_internship_credits": {"bsonType": ["number", "null"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}


def setup_camp03_curriculum_collections(db):
    """Idempotently apply collections, validators and indexes for Sub-Phase 3.2."""
    # First ensure foundation collections are ready
    setup_camp03_foundation_collections(db)

    # 1. courses
    if "courses" not in db.list_collection_names():
        db.create_collection("courses", validator=COURSES_VALIDATOR)
    else:
        db.command("collMod", "courses", validator=COURSES_VALIDATOR)
    db.courses.create_index([("course_id", 1)], unique=True, name="uq_course_id")
    db.courses.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("course_code", 1)],
        unique=True,
        name="uq_course_tenant_inst_code",
    )
    db.courses.create_index([("offering_academic_unit_id", 1)], name="ix_course_unit")

    # 2. course_versions
    if "course_versions" not in db.list_collection_names():
        db.create_collection("course_versions", validator=COURSE_VERSIONS_VALIDATOR)
    else:
        db.command("collMod", "course_versions", validator=COURSE_VERSIONS_VALIDATOR)
    db.course_versions.create_index(
        [("course_version_id", 1)], unique=True, name="uq_course_ver_id"
    )
    db.course_versions.create_index(
        [("course_id", 1), ("version_code", 1)],
        unique=True,
        name="uq_cv_course_version_code",
    )
    db.course_versions.create_index([("course_category", 1)], name="ix_cv_category")

    # 3. curriculum_requirement_groups
    if "curriculum_requirement_groups" not in db.list_collection_names():
        db.create_collection(
            "curriculum_requirement_groups",
            validator=CURRICULUM_REQUIREMENT_GROUPS_VALIDATOR,
        )
    else:
        db.command(
            "collMod",
            "curriculum_requirement_groups",
            validator=CURRICULUM_REQUIREMENT_GROUPS_VALIDATOR,
        )
    db.curriculum_requirement_groups.create_index(
        [("group_id", 1)], unique=True, name="uq_crg_id"
    )
    db.curriculum_requirement_groups.create_index(
        [("program_version_id", 1), ("group_name", 1)],
        unique=True,
        name="uq_crg_pv_name",
    )

    # 4. curriculum_course_requirements
    if "curriculum_course_requirements" not in db.list_collection_names():
        db.create_collection(
            "curriculum_course_requirements",
            validator=CURRICULUM_COURSE_REQUIREMENTS_VALIDATOR,
        )
    else:
        db.command(
            "collMod",
            "curriculum_course_requirements",
            validator=CURRICULUM_COURSE_REQUIREMENTS_VALIDATOR,
        )
    db.curriculum_course_requirements.create_index(
        [("requirement_id", 1)], unique=True, name="uq_ccr_id"
    )
    db.curriculum_course_requirements.create_index(
        [("group_id", 1), ("course_id", 1)],
        unique=True,
        name="uq_ccr_group_course",
    )

    # 5. curriculum_prerequisites
    if "curriculum_prerequisites" not in db.list_collection_names():
        db.create_collection(
            "curriculum_prerequisites", validator=CURRICULUM_PREREQUISITES_VALIDATOR
        )
    else:
        db.command(
            "collMod",
            "curriculum_prerequisites",
            validator=CURRICULUM_PREREQUISITES_VALIDATOR,
        )
    db.curriculum_prerequisites.create_index(
        [("prerequisite_id", 1)], unique=True, name="uq_prereq_id"
    )
    db.curriculum_prerequisites.create_index(
        [("target_course_id", 1), ("dependency_course_id", 1), ("dependency_type", 1)],
        unique=True,
        name="uq_prereq_target_dep_type",
    )
    db.curriculum_prerequisites.create_index(
        [("dependency_course_id", 1)], name="ix_prereq_dep"
    )

    # 6. multiple_exit_rules
    if "multiple_exit_rules" not in db.list_collection_names():
        db.create_collection("multiple_exit_rules", validator=MULTIPLE_EXIT_RULES_VALIDATOR)
    else:
        db.command("collMod", "multiple_exit_rules", validator=MULTIPLE_EXIT_RULES_VALIDATOR)
    db.multiple_exit_rules.create_index([("rule_id", 1)], unique=True, name="uq_exit_rule_id")
    db.multiple_exit_rules.create_index(
        [("program_version_id", 1), ("exit_qualification_id", 1)],
        unique=True,
        name="uq_exit_rule_pv_qual",
    )


# --- Sub-Phase 3.3: Calendars, Terms, Cohorts & Course Registration Engine ---

ACADEMIC_CALENDARS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "calendar_id",
            "tenant_id",
            "institution_id",
            "calendar_name",
            "calendar_type",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "calendar_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "calendar_name": {"bsonType": "string", "minLength": 2, "maxLength": 200},
            "calendar_type": {
                "enum": ["SEMESTER", "TRIMESTER", "ANNUAL", "MODULAR"]
            },
            "status": {"enum": ["DRAFT", "ACTIVE", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

ACADEMIC_YEARS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "academic_year_id",
            "tenant_id",
            "institution_id",
            "year_code",
            "start_date",
            "end_date",
            "status",
            "created_at",
        ],
        "properties": {
            "academic_year_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "year_code": {"bsonType": "string", "minLength": 4, "maxLength": 50},
            "start_date": {"bsonType": "date"},
            "end_date": {"bsonType": "date"},
            "status": {"enum": ["UPCOMING", "CURRENT", "CONCLUDED", "ARCHIVED"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

ACADEMIC_TERMS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "term_id",
            "calendar_id",
            "academic_year_id",
            "tenant_id",
            "institution_id",
            "term_code",
            "term_name",
            "sequence_number",
            "term_type",
            "instruction_start_date",
            "instruction_end_date",
            "term_status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "term_id": {"bsonType": "string"},
            "calendar_id": {"bsonType": "string"},
            "academic_year_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "term_code": {"bsonType": "string", "minLength": 2, "maxLength": 50},
            "term_name": {"bsonType": "string", "minLength": 2, "maxLength": 200},
            "sequence_number": {"bsonType": "number", "multipleOf": 1},
            "term_type": {
                "enum": [
                    "SEMESTER",
                    "TRIMESTER",
                    "ANNUAL_PERIOD",
                    "SUMMER_SESSION",
                    "WINTER_SESSION",
                ]
            },
            "instruction_start_date": {"bsonType": "date"},
            "instruction_end_date": {"bsonType": "date"},
            "term_status": {
                "enum": [
                    "DRAFT",
                    "SCHEDULED",
                    "REGISTRATION_OPEN",
                    "REGISTRATION_CLOSED",
                    "IN_PROGRESS",
                    "RESULT_PROCESSING",
                    "RESULTS_PUBLISHED",
                    "CLOSED",
                    "ARCHIVED",
                ]
            },
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

REGISTRATION_WINDOWS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "window_id",
            "term_id",
            "tenant_id",
            "institution_id",
            "window_type",
            "open_timestamp",
            "close_timestamp",
            "is_active",
            "created_at",
        ],
        "properties": {
            "window_id": {"bsonType": "string"},
            "term_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "window_type": {
                "enum": [
                    "REGULAR_REGISTRATION",
                    "LATE_REGISTRATION",
                    "ADD_DROP_WINDOW",
                    "COURSE_WITHDRAWAL",
                ]
            },
            "open_timestamp": {"bsonType": "date"},
            "close_timestamp": {"bsonType": "date"},
            "is_active": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
        },
    }
}

STUDENT_RECORDS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "student_id",
            "tenant_id",
            "institution_id",
            "person_id",
            "membership_id",
            "registration_number",
            "roll_number",
            "admission_number",
            "admission_date",
            "student_status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "student_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "person_id": {"bsonType": "string"},
            "membership_id": {"bsonType": "string"},
            "registration_number": {"bsonType": "string", "minLength": 2, "maxLength": 100},
            "roll_number": {"bsonType": "string", "minLength": 2, "maxLength": 100},
            "admission_number": {"bsonType": "string", "minLength": 2, "maxLength": 100},
            "admission_date": {"bsonType": "date"},
            "student_status": {
                "enum": [
                    "APPLICANT",
                    "ADMITTED",
                    "ENROLLED",
                    "ACTIVE",
                    "ON_LEAVE",
                    "SUSPENDED",
                    "ACADEMICALLY_RESTRICTED",
                    "COMPLETED",
                    "GRADUATED",
                    "WITHDRAWN",
                    "TRANSFERRED",
                    "TERMINATED",
                ]
            },
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

STUDENT_IDENTIFIERS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "identifier_id",
            "student_id",
            "scheme",
            "value",
            "verification_status",
            "created_at",
        ],
        "properties": {
            "identifier_id": {"bsonType": "string"},
            "student_id": {"bsonType": "string"},
            "scheme": {
                "enum": [
                    "ROLL_NUMBER",
                    "REGISTRATION_NUMBER",
                    "APAAR_ID",
                    "ABC_ACCOUNT_ID",
                    "EXAM_SEAT_NUMBER",
                    "LEGACY_ERP_ID",
                ]
            },
            "value": {"bsonType": "string"},
            "verification_status": {
                "enum": ["SELF_REPORTED", "INSTITUTION_VERIFIED", "NATIONAL_API_VERIFIED"]
            },
            "created_at": {"bsonType": "date"},
        },
    }
}

COHORT_BATCHES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "cohort_id",
            "tenant_id",
            "institution_id",
            "program_offering_id",
            "cohort_code",
            "matriculation_year",
            "nominal_graduation_year",
            "active_students_count",
            "created_at",
        ],
        "properties": {
            "cohort_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "program_offering_id": {"bsonType": "string"},
            "cohort_code": {"bsonType": "string", "minLength": 2, "maxLength": 100},
            "matriculation_year": {"bsonType": "number", "multipleOf": 1},
            "nominal_graduation_year": {"bsonType": "number", "multipleOf": 1},
            "active_students_count": {"bsonType": "number", "multipleOf": 1},
            "created_at": {"bsonType": "date"},
        },
    }
}

STUDENT_PROGRAM_ENROLLMENTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "enrollment_id",
            "student_id",
            "tenant_id",
            "institution_id",
            "program_offering_id",
            "program_version_id",
            "cohort_id",
            "admission_category",
            "enrollment_status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "enrollment_id": {"bsonType": "string"},
            "student_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "program_offering_id": {"bsonType": "string"},
            "program_version_id": {"bsonType": "string"},
            "cohort_id": {"bsonType": "string"},
            "admission_category": {
                "enum": [
                    "REGULAR_FRESHER",
                    "LATERAL_ENTRY_2ND_YEAR",
                    "INTER_UNIVERSITY_TRANSFER",
                    "READMISSION",
                ]
            },
            "enrollment_status": {
                "enum": [
                    "ENROLLED",
                    "ACTIVE",
                    "ON_LEAVE",
                    "PROBATION",
                    "SUSPENDED",
                    "COMPLETED",
                    "GRADUATED",
                    "WITHDRAWN",
                ]
            },
            "primary_specialization_id": {"bsonType": ["string", "null"]},
            "minor_specialization_id": {"bsonType": ["string", "null"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

TERM_COURSE_OFFERINGS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "offering_id",
            "tenant_id",
            "institution_id",
            "course_version_id",
            "course_id",
            "term_id",
            "campus_id",
            "capacity",
            "enrolled_seats",
            "status",
            "created_at",
            "updated_at",
        ],
        "properties": {
            "offering_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "course_version_id": {"bsonType": "string"},
            "course_id": {"bsonType": "string"},
            "term_id": {"bsonType": "string"},
            "campus_id": {"bsonType": "string"},
            "capacity": {"bsonType": "number", "multipleOf": 1},
            "enrolled_seats": {"bsonType": "number", "multipleOf": 1},
            "status": {"enum": ["PLANNED", "OPEN", "ACTIVE", "CLOSED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

COURSE_REGISTRATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "registration_id",
            "enrollment_id",
            "offering_id",
            "course_id",
            "term_id",
            "attempt_number",
            "registration_type",
            "registration_status",
            "registered_at",
        ],
        "properties": {
            "registration_id": {"bsonType": "string"},
            "enrollment_id": {"bsonType": "string"},
            "offering_id": {"bsonType": "string"},
            "course_id": {"bsonType": "string"},
            "term_id": {"bsonType": "string"},
            "attempt_number": {"bsonType": "number", "multipleOf": 1},
            "registration_type": {
                "enum": [
                    "REGULAR_CREDIT",
                    "BACKLOG_REPEAT",
                    "GRADE_IMPROVEMENT",
                    "AUDIT_NON_CREDIT",
                    "HONOURS_ADDITIONAL",
                ]
            },
            "registration_status": {
                "enum": [
                    "DRAFT",
                    "SUBMITTED",
                    "APPROVED",
                    "REGISTERED",
                    "DROPPED",
                    "WITHDRAWN",
                    "COMPLETED",
                ]
            },
            "final_grade": {"bsonType": ["string", "null"]},
            "grade_point": {"bsonType": ["number", "null"]},
            "credits_earned": {"bsonType": ["number", "null"]},
            "registered_at": {"bsonType": "date"},
            "dropped_at": {"bsonType": ["date", "null"]},
        },
    }
}


def setup_camp03_registration_collections(db):
    """Idempotently apply collections, validators and indexes for Sub-Phase 3.3."""
    setup_camp03_curriculum_collections(db)

    # 1. academic_calendars
    if "academic_calendars" not in db.list_collection_names():
        db.create_collection("academic_calendars", validator=ACADEMIC_CALENDARS_VALIDATOR)
    else:
        db.command("collMod", "academic_calendars", validator=ACADEMIC_CALENDARS_VALIDATOR)
    db.academic_calendars.create_index([("calendar_id", 1)], unique=True, name="uq_cal_id")
    db.academic_calendars.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("calendar_name", 1)],
        unique=True,
        name="uq_cal_tenant_inst_name",
    )

    # 2. academic_years
    if "academic_years" not in db.list_collection_names():
        db.create_collection("academic_years", validator=ACADEMIC_YEARS_VALIDATOR)
    else:
        db.command("collMod", "academic_years", validator=ACADEMIC_YEARS_VALIDATOR)
    db.academic_years.create_index([("academic_year_id", 1)], unique=True, name="uq_ay_id")
    db.academic_years.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("year_code", 1)],
        unique=True,
        name="uq_ay_tenant_inst_year",
    )

    # 3. academic_terms
    if "academic_terms" not in db.list_collection_names():
        db.create_collection("academic_terms", validator=ACADEMIC_TERMS_VALIDATOR)
    else:
        db.command("collMod", "academic_terms", validator=ACADEMIC_TERMS_VALIDATOR)
    db.academic_terms.create_index([("term_id", 1)], unique=True, name="uq_term_id")
    db.academic_terms.create_index(
        [("calendar_id", 1), ("term_code", 1)], unique=True, name="uq_term_cal_code"
    )

    # 4. registration_windows
    if "registration_windows" not in db.list_collection_names():
        db.create_collection("registration_windows", validator=REGISTRATION_WINDOWS_VALIDATOR)
    else:
        db.command("collMod", "registration_windows", validator=REGISTRATION_WINDOWS_VALIDATOR)
    db.registration_windows.create_index([("window_id", 1)], unique=True, name="uq_regwin_id")
    db.registration_windows.create_index([("term_id", 1), ("window_type", 1)], name="ix_regwin_term_type")

    # 5. student_records
    if "student_records" not in db.list_collection_names():
        db.create_collection("student_records", validator=STUDENT_RECORDS_VALIDATOR)
    else:
        db.command("collMod", "student_records", validator=STUDENT_RECORDS_VALIDATOR)
    db.student_records.create_index([("student_id", 1)], unique=True, name="uq_student_id")
    db.student_records.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("registration_number", 1)],
        unique=True,
        name="uq_student_reg_number",
    )
    db.student_records.create_index([("person_id", 1)], name="ix_student_person")
    db.student_records.create_index([("membership_id", 1)], name="ix_student_membership")

    # 6. student_identifiers
    if "student_identifiers" not in db.list_collection_names():
        db.create_collection("student_identifiers", validator=STUDENT_IDENTIFIERS_VALIDATOR)
    else:
        db.command("collMod", "student_identifiers", validator=STUDENT_IDENTIFIERS_VALIDATOR)
    db.student_identifiers.create_index([("identifier_id", 1)], unique=True, name="uq_stuid_id")
    db.student_identifiers.create_index(
        [("student_id", 1), ("scheme", 1)], unique=True, name="uq_stuid_scheme"
    )

    # 7. cohort_batches
    if "cohort_batches" not in db.list_collection_names():
        db.create_collection("cohort_batches", validator=COHORT_BATCHES_VALIDATOR)
    else:
        db.command("collMod", "cohort_batches", validator=COHORT_BATCHES_VALIDATOR)
    db.cohort_batches.create_index([("cohort_id", 1)], unique=True, name="uq_cohort_id")
    db.cohort_batches.create_index(
        [("program_offering_id", 1), ("cohort_code", 1)],
        unique=True,
        name="uq_cohort_offering_code",
    )

    # 8. student_program_enrollments
    if "student_program_enrollments" not in db.list_collection_names():
        db.create_collection(
            "student_program_enrollments",
            validator=STUDENT_PROGRAM_ENROLLMENTS_VALIDATOR,
        )
    else:
        db.command(
            "collMod",
            "student_program_enrollments",
            validator=STUDENT_PROGRAM_ENROLLMENTS_VALIDATOR,
        )
    db.student_program_enrollments.create_index(
        [("enrollment_id", 1)], unique=True, name="uq_spe_id"
    )
    db.student_program_enrollments.create_index(
        [("student_id", 1), ("program_offering_id", 1)],
        unique=True,
        name="uq_spe_student_offering",
    )

    # 9. term_course_offerings
    if "term_course_offerings" not in db.list_collection_names():
        db.create_collection(
            "term_course_offerings", validator=TERM_COURSE_OFFERINGS_VALIDATOR
        )
    else:
        db.command(
            "collMod", "term_course_offerings", validator=TERM_COURSE_OFFERINGS_VALIDATOR
        )
    db.term_course_offerings.create_index([("offering_id", 1)], unique=True, name="uq_tco_id")
    db.term_course_offerings.create_index(
        [("term_id", 1), ("course_id", 1), ("campus_id", 1)],
        unique=True,
        name="uq_tco_term_course_campus",
    )

    # 10. course_registrations
    if "course_registrations" not in db.list_collection_names():
        db.create_collection(
            "course_registrations", validator=COURSE_REGISTRATIONS_VALIDATOR
        )
    else:
        db.command(
            "collMod", "course_registrations", validator=COURSE_REGISTRATIONS_VALIDATOR
        )
    db.course_registrations.create_index(
        [("registration_id", 1)], unique=True, name="uq_creg_id"
    )
    db.course_registrations.create_index(
        [("enrollment_id", 1), ("offering_id", 1), ("attempt_number", 1)],
        unique=True,
        name="uq_creg_enroll_offering_attempt",
    )
    db.course_registrations.create_index(
        [("enrollment_id", 1), ("course_id", 1)], name="ix_creg_enroll_course"
    )


# --- Sub-Phase 3.4: Academic Records, Progression & Mobility ---

ACADEMIC_CREDIT_LEDGER_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "credit_entry_id",
            "enrollment_id",
            "source_type",
            "source_record_id",
            "credit_amount",
            "credit_type",
            "effective_date",
            "recognition_status",
            "created_at",
        ],
        "properties": {
            "credit_entry_id": {"bsonType": "string"},
            "enrollment_id": {"bsonType": "string"},
            "source_type": {
                "enum": [
                    "COURSE_COMPLETION",
                    "INTER_INSTITUTIONAL_TRANSFER",
                    "ABC_REDEMPTION",
                    "PRIOR_LEARNING_RECOGNITION",
                    "VOCATIONAL_EXPERIENTIAL",
                    "CREDIT_REVERSAL_ADJUSTMENT",
                ]
            },
            "source_record_id": {"bsonType": "string"},
            "course_id": {"bsonType": ["string", "null"]},
            "credit_amount": {"bsonType": "number"},
            "credit_type": {
                "enum": [
                    "ACADEMIC",
                    "VOCATIONAL",
                    "EXPERIENTIAL",
                    "TRANSFER",
                    "PRIOR_LEARNING",
                ]
            },
            "course_category": {"bsonType": ["string", "null"]},
            "effective_date": {"bsonType": "date"},
            "recognition_status": {
                "enum": [
                    "PENDING_VERIFICATION",
                    "RECOGNIZED",
                    "REJECTED",
                    "SUPERSEDED",
                ]
            },
            "authorized_by_membership_id": {"bsonType": ["string", "null"]},
            "reversal_reference_id": {"bsonType": ["string", "null"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

ACADEMIC_TERM_SUMMARIES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "summary_id",
            "enrollment_id",
            "term_id",
            "term_credits_registered",
            "term_credits_earned",
            "cumulative_credits_earned",
            "sgpa",
            "cgpa",
            "active_backlogs_count",
            "academic_standing",
            "evaluated_at",
        ],
        "properties": {
            "summary_id": {"bsonType": "string"},
            "enrollment_id": {"bsonType": "string"},
            "term_id": {"bsonType": "string"},
            "term_credits_registered": {"bsonType": "number"},
            "term_credits_earned": {"bsonType": "number"},
            "cumulative_credits_earned": {"bsonType": "number"},
            "sgpa": {"bsonType": "number"},
            "cgpa": {"bsonType": "number"},
            "active_backlogs_count": {"bsonType": "number", "multipleOf": 1},
            "academic_standing": {
                "enum": [
                    "GOOD_STANDING",
                    "ACADEMIC_WARNING",
                    "PROBATION",
                    "CRITICAL_PROBATION",
                    "DISQUALIFIED_FROM_PROMOTION",
                ]
            },
            "evaluated_at": {"bsonType": "date"},
        },
    }
}

PROGRESSION_DECISIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "decision_id",
            "enrollment_id",
            "academic_year_id",
            "from_sequence",
            "to_sequence",
            "decision",
            "policy_rules_evaluated",
            "evaluated_at",
        ],
        "properties": {
            "decision_id": {"bsonType": "string"},
            "enrollment_id": {"bsonType": "string"},
            "academic_year_id": {"bsonType": "string"},
            "from_sequence": {"bsonType": "number", "multipleOf": 1},
            "to_sequence": {"bsonType": "number", "multipleOf": 1},
            "decision": {
                "enum": [
                    "ELIGIBLE_PROMOTED",
                    "PROBATIONARY_PROMOTED",
                    "RETAINED_YEAR_REPEAT",
                    "ACADEMICALLY_RESTRICTED",
                    "COMPLETED_AWAITING_AWARD",
                ]
            },
            "policy_rules_evaluated": {
                "bsonType": "array",
                "items": {"bsonType": "object"},
            },
            "authorized_by_membership_id": {"bsonType": ["string", "null"]},
            "evaluated_at": {"bsonType": "date"},
        },
    }
}

ACADEMIC_BANK_OF_CREDITS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "abc_record_id",
            "student_id",
            "apaar_id",
            "abc_account_id",
            "transferred_in_credits",
            "redeemed_credits",
            "sync_status",
            "created_at",
        ],
        "properties": {
            "abc_record_id": {"bsonType": "string"},
            "student_id": {"bsonType": "string"},
            "apaar_id": {"bsonType": "string", "pattern": "^[0-9]{12}$"},
            "abc_account_id": {"bsonType": "string"},
            "transferred_in_credits": {"bsonType": "number"},
            "redeemed_credits": {"bsonType": "number"},
            "sync_status": {"enum": ["PENDING", "SYNCED", "FAILED"]},
            "last_synced_at": {"bsonType": ["date", "null"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}


def setup_camp03_records_collections(db):
    """Idempotently apply collections, validators and indexes for Sub-Phase 3.4."""
    setup_camp03_registration_collections(db)

    # 1. academic_credit_ledger
    if "academic_credit_ledger" not in db.list_collection_names():
        db.create_collection(
            "academic_credit_ledger", validator=ACADEMIC_CREDIT_LEDGER_VALIDATOR
        )
    else:
        db.command(
            "collMod",
            "academic_credit_ledger",
            validator=ACADEMIC_CREDIT_LEDGER_VALIDATOR,
        )
    db.academic_credit_ledger.create_index(
        [("credit_entry_id", 1)], unique=True, name="uq_acl_id"
    )
    db.academic_credit_ledger.create_index(
        [("enrollment_id", 1), ("effective_date", 1)], name="ix_acl_enroll_date"
    )
    db.academic_credit_ledger.create_index(
        [("source_record_id", 1)], name="ix_acl_source_record"
    )

    # 2. academic_term_summaries
    if "academic_term_summaries" not in db.list_collection_names():
        db.create_collection(
            "academic_term_summaries", validator=ACADEMIC_TERM_SUMMARIES_VALIDATOR
        )
    else:
        db.command(
            "collMod",
            "academic_term_summaries",
            validator=ACADEMIC_TERM_SUMMARIES_VALIDATOR,
        )
    db.academic_term_summaries.create_index(
        [("summary_id", 1)], unique=True, name="uq_ats_id"
    )
    db.academic_term_summaries.create_index(
        [("enrollment_id", 1), ("term_id", 1)],
        unique=True,
        name="uq_ats_enroll_term",
    )

    # 3. progression_decisions
    if "progression_decisions" not in db.list_collection_names():
        db.create_collection(
            "progression_decisions", validator=PROGRESSION_DECISIONS_VALIDATOR
        )
    else:
        db.command(
            "collMod",
            "progression_decisions",
            validator=PROGRESSION_DECISIONS_VALIDATOR,
        )
    db.progression_decisions.create_index(
        [("decision_id", 1)], unique=True, name="uq_progdec_id"
    )
    db.progression_decisions.create_index(
        [("enrollment_id", 1), ("academic_year_id", 1)],
        name="ix_progdec_enroll_year",
    )

    # 4. academic_bank_of_credits
    if "academic_bank_of_credits" not in db.list_collection_names():
        db.create_collection(
            "academic_bank_of_credits", validator=ACADEMIC_BANK_OF_CREDITS_VALIDATOR
        )
    else:
        db.command(
            "collMod",
            "academic_bank_of_credits",
            validator=ACADEMIC_BANK_OF_CREDITS_VALIDATOR,
        )
    db.academic_bank_of_credits.create_index(
        [("abc_record_id", 1)], unique=True, name="uq_abc_id"
    )
    db.academic_bank_of_credits.create_index(
        [("student_id", 1)], unique=True, name="uq_abc_student"
    )
    db.academic_bank_of_credits.create_index(
        [("apaar_id", 1)], unique=True, name="uq_abc_apaar"
    )

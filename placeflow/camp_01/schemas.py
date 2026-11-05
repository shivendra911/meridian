"""MongoDB $jsonSchema validators and index definitions for CAMP-01 collections."""

PLATFORM_TENANTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "id", "slug", "name", "status", "customer_type",
            "admin_email", "created_at", "updated_at"
        ],
        "properties": {
            "id": {"bsonType": "string"},
            "slug": {
                "bsonType": "string",
                "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                "minLength": 3,
                "maxLength": 100,
            },
            "name": {"bsonType": "string", "minLength": 2, "maxLength": 200},
            "status": {
                "enum": ["REQUESTED", "PROVISIONING", "ACTIVE", "SUSPENDED", "CLOSING", "CLOSED"]
            },
            "customer_type": {
                "enum": ["ENTERPRISE", "EDUCATION_GROUP", "STANDALONE_COLLEGE", "STATE_UNIVERSITY", "TRIAL"]
            },
            "admin_email": {
                "bsonType": "string",
                "pattern": "^[^@]+@[^@]+\\.[^@]+$",
            },
            "subscription_tier": {
                "enum": ["STANDARD", "PREMIUM", "INSTITUTIONAL_FLAGSHIP"],
            },
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
            "status_history": {
                "bsonType": "array",
                "items": {
                    "bsonType": "object",
                    "required": ["status", "changed_at", "changed_by"],
                    "properties": {
                        "status": {"bsonType": "string"},
                        "changed_at": {"bsonType": "date"},
                        "changed_by": {"bsonType": "string"},
                        "reason": {"bsonType": ["string", "null"]},
                    },
                },
            },
            "operational_flags": {"bsonType": "object"},
        },
    }
}

PLATFORM_DIRECTORY_ENTRIES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "directory_id", "legal_name", "display_name",
            "institution_type", "state", "district", "is_verified", "created_at"
        ],
        "properties": {
            "directory_id": {"bsonType": "string"},
            "aishe_code": {"bsonType": ["string", "null"]},
            "legal_name": {"bsonType": "string", "minLength": 2, "maxLength": 300},
            "display_name": {"bsonType": "string", "minLength": 2, "maxLength": 200},
            "institution_type": {
                "enum": [
                    "CENTRAL_UNIVERSITY", "STATE_UNIVERSITY", "DEEMED_UNIVERSITY",
                    "PRIVATE_UNIVERSITY", "INSTITUTE_OF_NATIONAL_IMPORTANCE",
                    "AFFILIATING_UNIVERSITY", "COLLEGE", "AUTONOMOUS_COLLEGE"
                ]
            },
            "state": {"bsonType": "string"},
            "district": {"bsonType": "string"},
            "website_url": {"bsonType": ["string", "null"]},
            "is_verified": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
        },
    }
}

PLATFORM_EVENTS_OUTBOX_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "event_id", "event_type", "aggregate_type", "aggregate_id",
            "tenant_id", "payload", "schema_version", "status", "retry_count", "created_at"
        ],
        "properties": {
            "event_id": {"bsonType": "string"},
            "event_type": {"bsonType": "string"},
            "aggregate_type": {"enum": ["TENANT", "INSTITUTION", "CAMPUS", "ORGANIZATIONAL_UNIT", "CONFIGURATION", "PERSON_IDENTITY", "ACCOUNT", "MEMBERSHIP", "ROLE", "PERMISSION_GRANT", "SESSION"]},
            "aggregate_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "payload": {"bsonType": "object"},
            "schema_version": {"bsonType": "int"},
            "status": {"enum": ["PENDING", "PROCESSING", "PUBLISHED", "FAILED"]},
            "retry_count": {"bsonType": "int"},
            "created_at": {"bsonType": "date"},
            "published_at": {"bsonType": ["date", "null"]},
            "error_message": {"bsonType": ["string", "null"]},
        },
    }
}

INSTITUTIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "tenant_id", "institution_id", "institution_code", "normalized_code",
            "legal_name", "display_name", "institution_type", "classifications",
            "status", "timezone", "default_locale", "created_at", "updated_at"
        ],
        "properties": {
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "institution_code": {"bsonType": "string", "maxLength": 80},
            "normalized_code": {"bsonType": "string", "maxLength": 80},
            "legal_name": {"bsonType": "string", "minLength": 1, "maxLength": 300},
            "display_name": {"bsonType": "string", "minLength": 1, "maxLength": 200},
            "short_name": {"bsonType": ["string", "null"]},
            "institution_type": {"bsonType": "string"},
            "ownership_type": {"bsonType": ["string", "null"]},
            "classifications": {
                "bsonType": "object",
                "required": ["institution_kind", "ownership", "governance", "institutional_role", "delivery_model"],
                "properties": {
                    "institution_kind": {
                        "enum": ["UNIVERSITY", "COLLEGE", "INSTITUTE", "AUTONOMOUS_COLLEGE", "DEEMED_UNIVERSITY"]
                    },
                    "ownership": {
                        "enum": ["CENTRAL_GOVERNMENT", "STATE_GOVERNMENT", "PRIVATE", "PUBLIC_PRIVATE_PARTNERSHIP", "OTHER"]
                    },
                    "governance": {
                        "enum": ["PUBLIC", "PRIVATE_AIDED", "PRIVATE_UNAIDED", "AUTONOMOUS"]
                    },
                    "recognition_status": {
                        "enum": ["RECOGNIZED", "PROVISIONALLY_RECOGNIZED", "ACCREDITED", "PENDING_ACCREDITATION"]
                    },
                    "institutional_role": {
                        "enum": ["DEGREE_AWARDING", "TEACHING_CONSTITUENT", "AFFILIATED", "RESEARCH_ONLY"]
                    },
                    "delivery_model": {
                        "enum": ["PHYSICAL", "ONLINE", "HYBRID", "DISTRIBUTED"]
                    },
                },
            },
            "directory_entry_id": {"bsonType": ["string", "null"]},
            "status": {
                "enum": ["DRAFT", "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "ARCHIVED"]
            },
            "timezone": {"bsonType": "string"},
            "default_locale": {"bsonType": "string"},
            "website_url": {"bsonType": ["string", "null"]},
            "contact_email": {"bsonType": ["string", "null"]},
            "phone_number": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_IDENTIFIERS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "identifier_id", "tenant_id", "institution_id",
            "scheme", "value", "valid_from", "verification_status", "created_at"
        ],
        "properties": {
            "identifier_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "scheme": {
                "enum": [
                    "AISHE", "UGC", "AICTE", "STATE_HIGHER_EDUCATION",
                    "AFFILIATION_CODE", "PAN", "INTERNAL"
                ]
            },
            "value": {"bsonType": "string", "minLength": 1, "maxLength": 120},
            "issuer": {"bsonType": ["string", "null"]},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "verification_status": {
                "enum": ["UNVERIFIED", "SUBMITTED", "VERIFIED", "REJECTED", "EXPIRED"]
            },
            "evidence_document_id": {"bsonType": ["string", "null"]},
            "verified_by": {"bsonType": ["string", "null"]},
            "verified_at": {"bsonType": ["date", "null"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

CAMPUSES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "tenant_id", "campus_id", "campus_code", "normalized_code",
            "campus_name", "campus_kind", "status", "created_at"
        ],
        "properties": {
            "tenant_id": {"bsonType": "string"},
            "campus_id": {"bsonType": "string"},
            "campus_code": {"bsonType": "string", "maxLength": 80},
            "normalized_code": {"bsonType": "string", "maxLength": 80},
            "campus_name": {"bsonType": "string", "maxLength": 200},
            "campus_kind": {
                "enum": ["PHYSICAL", "VIRTUAL", "DISTRIBUTED", "RESEARCH_PARK"]
            },
            "status": {
                "enum": ["PLANNED", "ACTIVE", "INACTIVE", "CLOSING", "CLOSED"]
            },
            "timezone": {"bsonType": "string"},
            "default_locale": {"bsonType": "string"},
            "operational_metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

PHYSICAL_LOCATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "location_id", "tenant_id", "building_name", "city",
            "state", "postal_code", "country", "created_at"
        ],
        "properties": {
            "location_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "campus_id": {"bsonType": ["string", "null"]},
            "building_name": {"bsonType": "string"},
            "block": {"bsonType": ["string", "null"]},
            "street_address": {"bsonType": ["string", "null"]},
            "city": {"bsonType": "string"},
            "district": {"bsonType": ["string", "null"]},
            "state": {"bsonType": "string"},
            "postal_code": {"bsonType": "string"},
            "country": {"bsonType": "string"},
            "geo_coordinates": {
                "bsonType": "object",
                "properties": {
                    "latitude": {"bsonType": "double"},
                    "longitude": {"bsonType": "double"},
                },
            },
            "location_type": {
                "enum": [
                    "ACADEMIC_BLOCK", "ADMINISTRATION", "HOSTEL", "AUDITORIUM",
                    "LABORATORY", "PLACEMENT_VENUE", "SPORTS_COMPLEX", "OTHER"
                ]
            },
            "created_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_CAMPUSES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "association_id", "tenant_id", "institution_id", "campus_id",
            "relationship_type", "is_primary", "valid_from", "status"
        ],
        "properties": {
            "association_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "campus_id": {"bsonType": "string"},
            "relationship_type": {
                "enum": [
                    "MAIN_CAMPUS", "BRANCH_CAMPUS", "CONSTITUENT_CAMPUS",
                    "SHARED_FACILITY", "INCUBATION_CENTRE"
                ]
            },
            "is_primary": {"bsonType": "bool"},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "status": {"enum": ["ACTIVE", "INACTIVE", "TERMINATED"]},
        },
    }
}

VERIFICATION_RECORDS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "record_id", "tenant_id", "institution_id", "verification_type",
            "status", "created_at"
        ],
        "properties": {
            "record_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "verification_type": {"bsonType": "string"},
            "status": {"enum": ["PENDING", "PASSED", "FAILED", "WAIVED"]},
            "notes": {"bsonType": ["string", "null"]},
            "verified_by": {"bsonType": ["string", "null"]},
            "verified_at": {"bsonType": ["date", "null"]},
            "checklist_results": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

ORGANIZATIONAL_UNITS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "unit_id", "tenant_id", "institution_id", "unit_code",
            "normalized_code", "name", "unit_type", "status", "created_at"
        ],
        "properties": {
            "unit_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "unit_code": {"bsonType": "string", "maxLength": 80},
            "normalized_code": {"bsonType": "string", "maxLength": 80},
            "name": {"bsonType": "string", "maxLength": 200},
            "unit_type": {
                "enum": [
                    "EXECUTIVE", "FACULTY", "SCHOOL", "DEPARTMENT", "ADMINISTRATIVE",
                    "PLACEMENT_OFFICE", "EXAMINATION_CELL", "FINANCE_OFFICE",
                    "SUPPORT_SERVICES", "RESEARCH_CENTRE", "OTHER"
                ]
            },
            "status": {"enum": ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]},
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
        },
    }
}

ORGANIZATIONAL_UNIT_RELATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "relation_id", "tenant_id", "institution_id", "child_unit_id",
            "parent_unit_id", "relationship_type", "is_primary", "valid_from", "created_at"
        ],
        "properties": {
            "relation_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "child_unit_id": {"bsonType": "string"},
            "parent_unit_id": {"bsonType": "string"},
            "relationship_type": {
                "enum": ["CONTAINS", "REPORTS_TO", "SUPPORTS", "SHARES_SERVICES_WITH", "COORDINATES_WITH"]
            },
            "is_primary": {"bsonType": "bool"},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "change_reason": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_GROUPS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "group_id", "tenant_id", "group_code", "normalized_code",
            "group_name", "group_type", "status", "created_at"
        ],
        "properties": {
            "group_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "group_code": {"bsonType": "string", "maxLength": 80},
            "normalized_code": {"bsonType": "string", "maxLength": 80},
            "group_name": {"bsonType": "string", "maxLength": 200},
            "group_type": {
                "enum": ["TRUST", "SOCIETY", "EDUCATIONAL_GROUP", "CONSORTIUM", "NETWORK"]
            },
            "status": {"enum": ["ACTIVE", "INACTIVE", "ARCHIVED"]},
            "description": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_GROUP_MEMBERSHIPS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "membership_id", "tenant_id", "group_id", "institution_id",
            "membership_type", "valid_from", "status", "created_at"
        ],
        "properties": {
            "membership_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "group_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "membership_type": {
                "enum": ["OWNED", "MANAGED", "OPERATED", "ASSOCIATED"]
            },
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "status": {"enum": ["ACTIVE", "INACTIVE", "TERMINATED"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_RELATIONSHIPS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "relationship_id", "tenant_id", "source_institution_id", "target_type",
            "target_id", "relationship_type", "valid_from", "verification_status", "created_at"
        ],
        "properties": {
            "relationship_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "source_institution_id": {"bsonType": "string"},
            "target_type": {"enum": ["INTERNAL", "EXTERNAL_DIRECTORY"]},
            "target_id": {"bsonType": "string"},
            "relationship_type": {
                "enum": [
                    "AFFILIATED_TO", "CONSTITUENT_OF", "MANAGED_BY",
                    "PART_OF_GROUP", "MERGED_INTO", "SUCCESSOR_TO", "COLLABORATES_WITH"
                ]
            },
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "verification_status": {"enum": ["UNVERIFIED", "VERIFIED", "EXPIRED"]},
            "authority_reference": {"bsonType": ["string", "null"]},
            "evidence_document_id": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_CONFIGURATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "config_id", "tenant_id", "institution_id", "scope_level",
            "version_number", "settings", "effective_from", "is_active", "created_at"
        ],
        "properties": {
            "config_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "scope_level": {"enum": ["PLATFORM", "TENANT", "INSTITUTION", "CAMPUS"]},
            "scope_id": {"bsonType": ["string", "null"]},
            "version_number": {"bsonType": "int"},
            "settings": {"bsonType": "object"},
            "effective_from": {"bsonType": "date"},
            "effective_to": {"bsonType": ["date", "null"]},
            "changed_by": {"bsonType": "string"},
            "change_reason": {"bsonType": ["string", "null"]},
            "is_active": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
        },
    }
}


def apply_camp01_foundation_schemas(db):
    """Creates or updates collections for CAMP-01 with validators and composite indexes."""
    existing_collections = set(db.list_collection_names())

    # 1. platform_tenants
    if "platform_tenants" not in existing_collections:
        db.create_collection("platform_tenants", validator=PLATFORM_TENANTS_VALIDATOR)
    else:
        db.command("collMod", "platform_tenants", validator=PLATFORM_TENANTS_VALIDATOR)
    db.platform_tenants.create_index("slug", unique=True)
    db.platform_tenants.create_index("status")
    db.platform_tenants.create_index("admin_email")

    # 2. platform_directory_entries
    if "platform_directory_entries" not in existing_collections:
        db.create_collection("platform_directory_entries", validator=PLATFORM_DIRECTORY_ENTRIES_VALIDATOR)
    else:
        db.command("collMod", "platform_directory_entries", validator=PLATFORM_DIRECTORY_ENTRIES_VALIDATOR)
    db.platform_directory_entries.create_index("directory_id", unique=True)
    db.platform_directory_entries.create_index("aishe_code", sparse=True)
    db.platform_directory_entries.create_index([("legal_name", "text"), ("display_name", "text")])
    db.platform_directory_entries.create_index([("state", 1), ("district", 1)])

    # 3. platform_events_outbox
    if "platform_events_outbox" not in existing_collections:
        db.create_collection("platform_events_outbox", validator=PLATFORM_EVENTS_OUTBOX_VALIDATOR)
    else:
        db.command("collMod", "platform_events_outbox", validator=PLATFORM_EVENTS_OUTBOX_VALIDATOR)
    db.platform_events_outbox.create_index("event_id", unique=True)
    db.platform_events_outbox.create_index([("status", 1), ("created_at", 1)])
    db.platform_events_outbox.create_index([("tenant_id", 1), ("aggregate_type", 1), ("aggregate_id", 1)])

    # 4. institutions
    if "institutions" not in existing_collections:
        db.create_collection("institutions", validator=INSTITUTIONS_VALIDATOR)
    else:
        db.command("collMod", "institutions", validator=INSTITUTIONS_VALIDATOR)
    db.institutions.create_index([("tenant_id", 1), ("normalized_code", 1)], unique=True)
    db.institutions.create_index([("tenant_id", 1), ("institution_id", 1)], unique=True)
    db.institutions.create_index([("tenant_id", 1), ("status", 1)])
    db.institutions.create_index("directory_entry_id")

    # 5. institution_identifiers
    if "institution_identifiers" not in existing_collections:
        db.create_collection("institution_identifiers", validator=INSTITUTION_IDENTIFIERS_VALIDATOR)
    else:
        db.command("collMod", "institution_identifiers", validator=INSTITUTION_IDENTIFIERS_VALIDATOR)
    db.institution_identifiers.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("scheme", 1), ("value", 1)],
        unique=True,
    )
    db.institution_identifiers.create_index([("scheme", 1), ("value", 1)])

    # 6. campuses
    if "campuses" not in existing_collections:
        db.create_collection("campuses", validator=CAMPUSES_VALIDATOR)
    else:
        db.command("collMod", "campuses", validator=CAMPUSES_VALIDATOR)
    db.campuses.create_index([("tenant_id", 1), ("normalized_code", 1)], unique=True)
    db.campuses.create_index([("tenant_id", 1), ("campus_id", 1)], unique=True)
    db.campuses.create_index([("tenant_id", 1), ("status", 1)])

    # 7. physical_locations
    if "physical_locations" not in existing_collections:
        db.create_collection("physical_locations", validator=PHYSICAL_LOCATIONS_VALIDATOR)
    else:
        db.command("collMod", "physical_locations", validator=PHYSICAL_LOCATIONS_VALIDATOR)
    db.physical_locations.create_index([("tenant_id", 1), ("location_id", 1)], unique=True)
    db.physical_locations.create_index([("tenant_id", 1), ("campus_id", 1)])

    # 8. institution_campuses
    if "institution_campuses" not in existing_collections:
        db.create_collection("institution_campuses", validator=INSTITUTION_CAMPUSES_VALIDATOR)
    else:
        db.command("collMod", "institution_campuses", validator=INSTITUTION_CAMPUSES_VALIDATOR)
    db.institution_campuses.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("campus_id", 1), ("valid_from", 1)],
        unique=True,
    )
    db.institution_campuses.create_index([("tenant_id", 1), ("institution_id", 1), ("is_primary", 1)])

    # 9. verification_records
    if "verification_records" not in existing_collections:
        db.create_collection("verification_records", validator=VERIFICATION_RECORDS_VALIDATOR)
    else:
        db.command("collMod", "verification_records", validator=VERIFICATION_RECORDS_VALIDATOR)
    db.verification_records.create_index([("tenant_id", 1), ("institution_id", 1)])

    # 10. organizational_units
    if "organizational_units" not in existing_collections:
        db.create_collection("organizational_units", validator=ORGANIZATIONAL_UNITS_VALIDATOR)
    else:
        db.command("collMod", "organizational_units", validator=ORGANIZATIONAL_UNITS_VALIDATOR)
    db.organizational_units.create_index([("tenant_id", 1), ("institution_id", 1), ("normalized_code", 1)], unique=True)
    db.organizational_units.create_index([("tenant_id", 1), ("institution_id", 1), ("unit_id", 1)], unique=True)
    db.organizational_units.create_index([("tenant_id", 1), ("institution_id", 1), ("status", 1)])

    # 11. organizational_unit_relations
    if "organizational_unit_relations" not in existing_collections:
        db.create_collection("organizational_unit_relations", validator=ORGANIZATIONAL_UNIT_RELATIONS_VALIDATOR)
    else:
        db.command("collMod", "organizational_unit_relations", validator=ORGANIZATIONAL_UNIT_RELATIONS_VALIDATOR)
    db.organizational_unit_relations.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("child_unit_id", 1), ("relationship_type", 1), ("valid_from", 1)]
    )
    db.organizational_unit_relations.create_index([("tenant_id", 1), ("institution_id", 1), ("parent_unit_id", 1)])
    db.organizational_unit_relations.create_index([("tenant_id", 1), ("institution_id", 1), ("is_primary", 1)])

    # 12. institution_groups
    if "institution_groups" not in existing_collections:
        db.create_collection("institution_groups", validator=INSTITUTION_GROUPS_VALIDATOR)
    else:
        db.command("collMod", "institution_groups", validator=INSTITUTION_GROUPS_VALIDATOR)
    db.institution_groups.create_index([("tenant_id", 1), ("normalized_code", 1)], unique=True)
    db.institution_groups.create_index([("tenant_id", 1), ("group_id", 1)], unique=True)

    # 13. institution_group_memberships
    if "institution_group_memberships" not in existing_collections:
        db.create_collection("institution_group_memberships", validator=INSTITUTION_GROUP_MEMBERSHIPS_VALIDATOR)
    else:
        db.command("collMod", "institution_group_memberships", validator=INSTITUTION_GROUP_MEMBERSHIPS_VALIDATOR)
    db.institution_group_memberships.create_index(
        [("tenant_id", 1), ("group_id", 1), ("institution_id", 1), ("valid_from", 1)],
        unique=True,
    )
    db.institution_group_memberships.create_index([("tenant_id", 1), ("institution_id", 1)])

    # 14. institution_relationships
    if "institution_relationships" not in existing_collections:
        db.create_collection("institution_relationships", validator=INSTITUTION_RELATIONSHIPS_VALIDATOR)
    else:
        db.command("collMod", "institution_relationships", validator=INSTITUTION_RELATIONSHIPS_VALIDATOR)
    db.institution_relationships.create_index([("tenant_id", 1), ("source_institution_id", 1)])
    db.institution_relationships.create_index([("tenant_id", 1), ("target_id", 1)])

    # 15. institution_configurations
    if "institution_configurations" not in existing_collections:
        db.create_collection("institution_configurations", validator=INSTITUTION_CONFIGURATIONS_VALIDATOR)
    else:
        db.command("collMod", "institution_configurations", validator=INSTITUTION_CONFIGURATIONS_VALIDATOR)
    db.institution_configurations.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("scope_level", 1), ("version_number", 1)],
        unique=True,
    )
    db.institution_configurations.create_index([("tenant_id", 1), ("institution_id", 1), ("is_active", 1)])

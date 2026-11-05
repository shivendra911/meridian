"""MongoDB $jsonSchema validators and index definitions for CAMP-02 Identity, Membership, Roles & Authorization."""

PERSON_IDENTITIES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["person_id", "primary_email", "first_name", "last_name", "status", "created_at", "updated_at"],
        "properties": {
            "person_id": {"bsonType": "string"},
            "primary_email": {
                "bsonType": "string",
                "pattern": "^[^@]+@[^@]+\\.[^@]+$",
            },
            "primary_phone": {"bsonType": ["string", "null"]},
            "first_name": {"bsonType": "string", "minLength": 1, "maxLength": 100},
            "middle_name": {"bsonType": ["string", "null"]},
            "last_name": {"bsonType": "string", "minLength": 1, "maxLength": 100},
            "display_name": {"bsonType": "string", "minLength": 1, "maxLength": 200},
            "date_of_birth": {"bsonType": ["string", "null"]},
            "gender": {"bsonType": ["string", "null"]},
            "status": {
                "enum": ["ACTIVE", "SUSPENDED", "DECEASED", "MERGED"],
            },
            "merged_into_person_id": {"bsonType": ["string", "null"]},
            "national_identifiers": {
                "bsonType": "array",
                "items": {
                    "bsonType": "object",
                    "required": ["scheme", "identifier_value", "is_verified"],
                    "properties": {
                        "scheme": {"enum": ["APAAR", "ABC_ID", "PAN", "PASSPORT", "AADHAAR_HASH", "VOTER_ID", "OTHER"]},
                        "identifier_value": {"bsonType": "string"},
                        "value": {"bsonType": "string"},
                        "issuer": {"bsonType": ["string", "null"]},
                        "is_verified": {"bsonType": "bool"},
                        "verified_at": {"bsonType": ["date", "null"]},
                    },
                },
            },
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

ACCOUNTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["account_id", "account_type", "username", "email", "status", "created_at", "updated_at"],
        "properties": {
            "account_id": {"bsonType": "string"},
            "person_id": {"bsonType": ["string", "null"]},
            "tenant_id": {"bsonType": ["string", "null"]},
            "account_type": {
                "enum": ["HUMAN", "SERVICE", "SYSTEM"],
            },
            "username": {
                "bsonType": "string",
                "minLength": 3,
                "maxLength": 100,
            },
            "email": {
                "bsonType": "string",
                "pattern": "^[^@]+@[^@]+\\.[^@]+$",
            },
            "primary_email": {"bsonType": ["string", "null"]},
            "status": {
                "enum": ["INVITED", "ACTIVE", "LOCKED", "SUSPENDED", "TERMINATED"],
            },
            "failed_login_attempts": {"bsonType": "int"},
            "locked_until": {"bsonType": ["date", "null"]},
            "last_login_at": {"bsonType": ["date", "null"]},
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
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

ACCOUNT_CREDENTIALS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["credential_id", "account_id", "credential_type", "credential_data", "is_active", "created_at", "updated_at"],
        "properties": {
            "credential_id": {"bsonType": "string"},
            "key_id": {"bsonType": "string"},
            "account_id": {"bsonType": "string"},
            "credential_type": {
                "enum": ["PASSWORD_HASH", "PASSKEY", "API_KEY", "TOTP_SECRET", "RECOVERY_CODE"],
            },
            "api_key": {"bsonType": "string"},
            "credential_data": {"bsonType": "object"},
            "is_active": {"bsonType": "bool"},
            "expires_at": {"bsonType": ["date", "null"]},
            "revoked_at": {"bsonType": ["date", "null"]},
            "revocation_reason": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

INSTITUTION_MEMBERSHIPS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "membership_id", "tenant_id", "institution_id", "person_id", "account_id",
            "membership_type", "status", "valid_from", "created_at", "updated_at"
        ],
        "properties": {
            "membership_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "person_id": {"bsonType": "string"},
            "account_id": {"bsonType": "string"},
            "membership_type": {
                "enum": ["STUDENT", "FACULTY", "STAFF", "ALUMNI", "EXTERNAL_RECRUITER", "AFFILIATE"],
            },
            "status": {
                "enum": ["INVITED", "ACTIVE", "SUSPENDED", "EXPIRED", "TERMINATED"],
            },
            "member_number": {"bsonType": ["string", "null"]},
            "department_id": {"bsonType": ["string", "null"]},
            "primary_campus_id": {"bsonType": ["string", "null"]},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
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
            "metadata": {"bsonType": "object"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

PERMISSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["permission_key", "domain", "resource", "action", "description", "is_system", "created_at"],
        "properties": {
            "permission_key": {"bsonType": "string"},
            "domain": {"bsonType": "string"},
            "resource": {"bsonType": "string"},
            "action": {"bsonType": "string"},
            "description": {"bsonType": "string"},
            "is_system": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
        },
    }
}

ROLES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["role_id", "role_code", "role_name", "role_category", "role_owner_type", "status", "current_version", "created_at", "updated_at"],
        "properties": {
            "role_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": ["string", "null"]},
            "institution_id": {"bsonType": ["string", "null"]},
            "role_code": {"bsonType": "string"},
            "role_name": {"bsonType": "string"},
            "role_category": {
                "enum": ["ACADEMIC", "ADMINISTRATIVE", "PLACEMENT", "STUDENT", "SYSTEM"],
            },
            "role_owner_type": {
                "enum": ["PLATFORM", "INSTITUTION"],
            },
            "status": {
                "enum": ["DRAFT", "ACTIVE", "DEPRECATED"],
            },
            "current_version": {"bsonType": "int"},
            "description": {"bsonType": ["string", "null"]},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}

ROLE_VERSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["version_id", "role_id", "version_number", "permissions", "max_allowed_scope", "status", "published_at", "published_by"],
        "properties": {
            "version_id": {"bsonType": "string"},
            "role_id": {"bsonType": "string"},
            "version_number": {"bsonType": "int"},
            "permissions": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "max_allowed_scope": {
                "enum": ["PLATFORM", "TENANT", "INSTITUTION", "CAMPUS", "ORGANIZATIONAL_UNIT", "SELF"],
            },
            "status": {
                "enum": ["ACTIVE", "SUPERSEDED"],
            },
            "change_summary": {"bsonType": ["string", "null"]},
            "published_at": {"bsonType": "date"},
            "published_by": {"bsonType": "string"},
        },
    }
}

ROLE_ASSIGNMENTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "assignment_id", "tenant_id", "account_id", "role_id", "role_version",
            "scope_type", "scope_id", "valid_from", "status", "assigned_by", "assigned_at"
        ],
        "properties": {
            "assignment_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": ["string", "null"]},
            "membership_id": {"bsonType": ["string", "null"]},
            "account_id": {"bsonType": "string"},
            "role_id": {"bsonType": "string"},
            "role_version": {"bsonType": "int"},
            "scope_type": {
                "enum": ["PLATFORM", "TENANT", "INSTITUTION", "CAMPUS", "ORGANIZATIONAL_UNIT", "SELF"],
            },
            "scope_id": {"bsonType": "string"},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": ["date", "null"]},
            "status": {
                "enum": ["ACTIVE", "REVOKED", "EXPIRED"],
            },
            "assigned_by": {"bsonType": "string"},
            "assigned_at": {"bsonType": "date"},
            "revoked_at": {"bsonType": ["date", "null"]},
            "revoked_by": {"bsonType": ["string", "null"]},
            "revocation_reason": {"bsonType": ["string", "null"]},
        },
    }
}

ROLE_DELEGATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "delegation_id", "tenant_id", "institution_id", "delegator_account_id", "delegatee_account_id",
            "delegated_roles", "scope_type", "scope_id", "valid_from", "valid_to", "status", "reason", "created_at"
        ],
        "properties": {
            "delegation_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": "string"},
            "institution_id": {"bsonType": "string"},
            "delegator_account_id": {"bsonType": "string"},
            "delegatee_account_id": {"bsonType": "string"},
            "delegated_roles": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "excluded_permissions": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
            },
            "scope_type": {"bsonType": "string"},
            "scope_id": {"bsonType": "string"},
            "valid_from": {"bsonType": "date"},
            "valid_to": {"bsonType": "date"},
            "status": {
                "enum": ["ACTIVE", "REVOKED", "EXPIRED"],
            },
            "reason": {"bsonType": "string"},
            "created_at": {"bsonType": "date"},
            "revoked_at": {"bsonType": ["date", "null"]},
            "revocation_reason": {"bsonType": ["string", "null"]},
        },
    }
}

AUTH_SESSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["session_id", "account_id", "token_hash", "status", "auth_assurance", "created_at", "last_activity_at", "expires_at"],
        "properties": {
            "session_id": {"bsonType": "string"},
            "account_id": {"bsonType": "string"},
            "tenant_id": {"bsonType": ["string", "null"]},
            "institution_id": {"bsonType": ["string", "null"]},
            "token_hash": {"bsonType": "string"},
            "device_fingerprint": {"bsonType": ["string", "null"]},
            "ip_address": {"bsonType": ["string", "null"]},
            "user_agent": {"bsonType": ["string", "null"]},
            "status": {
                "enum": ["ACTIVE", "REVOKED", "EXPIRED"],
            },
            "auth_assurance": {"bsonType": "string"},
            "created_at": {"bsonType": "date"},
            "last_activity_at": {"bsonType": "date"},
            "expires_at": {"bsonType": "date"},
            "revoked_at": {"bsonType": ["date", "null"]},
        },
    }
}


def setup_camp02_collections(db):
    """Creates collections and composite indexes for CAMP-02 Identity, Membership, Roles & Authorization."""
    # 1. person_identities
    if "person_identities" not in db.list_collection_names():
        db.create_collection("person_identities", validator=PERSON_IDENTITIES_VALIDATOR)
    else:
        db.command("collMod", "person_identities", validator=PERSON_IDENTITIES_VALIDATOR)
    db.person_identities.create_index([("person_id", 1)], unique=True, name="uq_person_id")
    db.person_identities.create_index([("primary_email", 1)], unique=True, name="uq_person_email")
    db.person_identities.create_index([("national_identifiers.scheme", 1), ("national_identifiers.identifier_value", 1)], name="ix_person_national_id")

    # 2. accounts
    if "accounts" not in db.list_collection_names():
        db.create_collection("accounts", validator=ACCOUNTS_VALIDATOR)
    else:
        db.command("collMod", "accounts", validator=ACCOUNTS_VALIDATOR)
    db.accounts.create_index([("account_id", 1)], unique=True, name="uq_account_id")
    db.accounts.create_index([("username", 1)], unique=True, name="uq_account_username")
    db.accounts.create_index([("email", 1)], unique=True, name="uq_account_email")
    db.accounts.create_index([("person_id", 1)], name="ix_account_person_id")
    db.accounts.create_index([("tenant_id", 1)], name="ix_account_tenant_id")

    # 3. account_credentials
    if "account_credentials" not in db.list_collection_names():
        db.create_collection("account_credentials", validator=ACCOUNT_CREDENTIALS_VALIDATOR)
    else:
        db.command("collMod", "account_credentials", validator=ACCOUNT_CREDENTIALS_VALIDATOR)
    db.account_credentials.create_index([("credential_id", 1)], unique=True, name="uq_credential_id")
    db.account_credentials.create_index([("account_id", 1), ("credential_type", 1)], name="ix_cred_account_type")

    # 4. institution_memberships
    if "institution_memberships" not in db.list_collection_names():
        db.create_collection("institution_memberships", validator=INSTITUTION_MEMBERSHIPS_VALIDATOR)
    else:
        db.command("collMod", "institution_memberships", validator=INSTITUTION_MEMBERSHIPS_VALIDATOR)
    db.institution_memberships.create_index([("membership_id", 1)], unique=True, name="uq_membership_id")
    db.institution_memberships.create_index(
        [("tenant_id", 1), ("institution_id", 1), ("person_id", 1), ("membership_type", 1)],
        unique=True,
        name="uq_tenant_inst_person_membership"
    )
    db.institution_memberships.create_index([("tenant_id", 1), ("account_id", 1)], name="ix_member_tenant_account")
    db.institution_memberships.create_index([("tenant_id", 1), ("institution_id", 1), ("status", 1)], name="ix_member_inst_status")
    db.institution_memberships.create_index([("tenant_id", 1), ("institution_id", 1), ("member_number", 1)], name="ix_member_number")

    # 5. permissions
    if "permissions" not in db.list_collection_names():
        db.create_collection("permissions", validator=PERMISSIONS_VALIDATOR)
    else:
        db.command("collMod", "permissions", validator=PERMISSIONS_VALIDATOR)
    db.permissions.create_index([("permission_key", 1)], unique=True, name="uq_permission_key")
    db.permissions.create_index([("domain", 1)], name="ix_perm_domain")

    # 6. roles
    if "roles" not in db.list_collection_names():
        db.create_collection("roles", validator=ROLES_VALIDATOR)
    else:
        db.command("collMod", "roles", validator=ROLES_VALIDATOR)
    db.roles.create_index([("role_id", 1)], unique=True, name="uq_role_id")
    db.roles.create_index([("tenant_id", 1), ("institution_id", 1), ("role_code", 1)], unique=True, name="uq_role_tenant_inst_code")

    # 7. role_versions
    if "role_versions" not in db.list_collection_names():
        db.create_collection("role_versions", validator=ROLE_VERSIONS_VALIDATOR)
    else:
        db.command("collMod", "role_versions", validator=ROLE_VERSIONS_VALIDATOR)
    db.role_versions.create_index([("version_id", 1)], unique=True, name="uq_role_version_id")
    db.role_versions.create_index([("role_id", 1), ("version_number", 1)], unique=True, name="uq_role_id_ver")

    # 8. role_assignments
    if "role_assignments" not in db.list_collection_names():
        db.create_collection("role_assignments", validator=ROLE_ASSIGNMENTS_VALIDATOR)
    else:
        db.command("collMod", "role_assignments", validator=ROLE_ASSIGNMENTS_VALIDATOR)
    db.role_assignments.create_index([("assignment_id", 1)], unique=True, name="uq_assignment_id")
    db.role_assignments.create_index([("account_id", 1), ("status", 1)], name="ix_assign_account_status")
    db.role_assignments.create_index([("tenant_id", 1), ("institution_id", 1), ("role_id", 1)], name="ix_assign_tenant_inst_role")
    db.role_assignments.create_index([("scope_type", 1), ("scope_id", 1)], name="ix_assign_scope")

    # 9. role_delegations
    if "role_delegations" not in db.list_collection_names():
        db.create_collection("role_delegations", validator=ROLE_DELEGATIONS_VALIDATOR)
    else:
        db.command("collMod", "role_delegations", validator=ROLE_DELEGATIONS_VALIDATOR)
    db.role_delegations.create_index([("delegation_id", 1)], unique=True, name="uq_delegation_id")
    db.role_delegations.create_index([("delegator_account_id", 1), ("status", 1)], name="ix_deleg_delegator")
    db.role_delegations.create_index([("delegatee_account_id", 1), ("status", 1)], name="ix_deleg_delegatee")

    # 10. auth_sessions
    if "auth_sessions" not in db.list_collection_names():
        db.create_collection("auth_sessions", validator=AUTH_SESSIONS_VALIDATOR)
    else:
        db.command("collMod", "auth_sessions", validator=AUTH_SESSIONS_VALIDATOR)
    db.auth_sessions.create_index([("session_id", 1)], unique=True, name="uq_session_id")
    db.auth_sessions.create_index([("token_hash", 1)], unique=True, name="uq_session_token")
    db.auth_sessions.create_index([("account_id", 1), ("status", 1)], name="ix_session_account_status")

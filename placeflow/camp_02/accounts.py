"""Account Management & Authentication Credential Service for CAMP-02 (ADR-C02-002).
Decouples login authentication from human person identity and institutional membership.
"""

import hashlib
import hmac
import os
import re
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event
from camp_02.identities import get_person_by_id

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]+$")

ALLOWED_ACCOUNT_STATUS_TRANSITIONS = {
    "INVITED": {"ACTIVE", "TERMINATED"},
    "ACTIVE": {"LOCKED", "SUSPENDED", "TERMINATED"},
    "LOCKED": {"ACTIVE", "TERMINATED"},
    "SUSPENDED": {"ACTIVE", "TERMINATED"},
    "TERMINATED": set(),  # Terminal state
}


class AccountValidationError(ValueError):
    """Raised when account creation or mutation violates validation rules."""
    pass


class AccountNotFoundError(LookupError):
    """Raised when an account cannot be located."""
    pass


class InvalidAccountStateTransitionError(ValueError):
    """Raised when an illegal account lifecycle status change is attempted."""
    pass


class InvalidCredentialError(ValueError):
    """Raised when authentication credentials do not match or are invalid."""
    pass


class AccountLockedError(PermissionError):
    """Raised when authentication is attempted on a locked account."""
    pass


class AccountSuspendedError(PermissionError):
    """Raised when authentication is attempted on a suspended account."""
    pass


def hash_password(password: str, salt: Optional[bytes] = None) -> Tuple[str, str]:
    """Generates a secure PBKDF2 HMAC SHA-256 password hash and salt."""
    if salt is None:
        salt = os.urandom(16)
    iterations = 100_000
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return pwd_hash.hex(), salt.hex()


def verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    """Verifies a plaintext password against the stored salt and hash."""
    salt = bytes.fromhex(stored_salt)
    iterations = 100_000
    candidate_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(candidate_hash.hex(), stored_hash)


def create_account(
    person_id: Optional[str] = None,
    username: Optional[str] = None,
    email: Optional[str] = None,
    primary_email: Optional[str] = None,
    account_type: str = "HUMAN",
    tenant_id: Optional[str] = None,
    password: Optional[str] = None,
    status: str = "ACTIVE",
    actor_id: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Creates a new login or service account bound to a person identity."""
    if db is None:
        db = get_db()

    actual_email = (primary_email or email or "").strip().lower()
    if not actual_email:
        raise AccountValidationError("Account email must not be empty.")

    actual_username = (username or actual_email.split("@")[0]).strip().lower()

    # Invariant: verify person exists and is active (unless SERVICE / SYSTEM account)
    if person_id:
        person = get_person_by_id(person_id, db=db)
        if person.get("status") != "ACTIVE":
            raise AccountValidationError(f"Cannot create account for person in status '{person.get('status')}'.")
    elif account_type not in ["SERVICE", "SYSTEM"]:
        raise AccountValidationError("Human accounts must be bound to an authoritative Person Identity.")

    norm_username = actual_username
    if not USERNAME_REGEX.match(norm_username) or len(norm_username) < 3:
        raise AccountValidationError(f"Invalid username '{norm_username}'. Must be at least 3 characters alphanumeric.")

    norm_email = actual_email

    if account_type not in ["HUMAN", "SERVICE", "SYSTEM"]:
        raise AccountValidationError(f"Invalid account type: '{account_type}'.")

    # Check username / email collisions
    if db.accounts.find_one({"username": norm_username}):
        raise AccountValidationError(f"Username '{norm_username}' is already taken.")
    if db.accounts.find_one({"email": norm_email}):
        raise AccountValidationError(f"Account email '{norm_email}' is already registered.")

    account_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    account_doc = {
        "account_id": account_id,
        "person_id": person_id,
        "tenant_id": tenant_id,
        "account_type": account_type,
        "username": norm_username,
        "email": norm_email,
        "primary_email": norm_email,
        "status": status,
        "failed_login_attempts": 0,
        "locked_until": None,
        "last_login_at": None,
        "status_history": [
            {
                "status": status,
                "changed_at": now,
                "changed_by": actor_id,
                "reason": "Account provisioned",
            }
        ],
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.accounts.insert_one(account_doc)
        account_doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise AccountValidationError(f"Account duplicate key collision: {exc}") from exc

    # If initial password supplied, create credential
    if password:
        set_account_password(account_id, password, db=db)

    publish_event(
        event_type="AccountCreated",
        aggregate_type="ACCOUNT",
        aggregate_id=account_id,
        tenant_id=tenant_id or "global",
        payload={
            "account_id": account_id,
            "person_id": person_id,
            "username": norm_username,
            "account_type": account_type,
            "status": status,
        },
        db=db,
    )

    return account_doc


def get_account_by_id(account_id: str, db=None) -> Dict[str, Any]:
    """Retrieves an account document by ID."""
    if db is None:
        db = get_db()
    acc = db.accounts.find_one({"account_id": account_id}, {"_id": 0})
    if not acc:
        raise AccountNotFoundError(f"Account '{account_id}' not found.")
    return acc


def get_account_by_username(username: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves an account by its unique username or email address."""
    if db is None:
        db = get_db()
    norm = username.strip().lower()
    return db.accounts.find_one(
        {"$or": [{"username": norm}, {"email": norm}, {"primary_email": norm}]},
        {"_id": 0},
    )


def set_account_password(account_id: str, password: str, db=None) -> Dict[str, Any]:
    """Sets or updates the password hash credential for an account."""
    if db is None:
        db = get_db()

    get_account_by_id(account_id, db=db)
    if len(password) < 8:
        raise AccountValidationError("Password must be at least 8 characters in length.")

    pwd_hash, salt = hash_password(password)
    now = datetime.now(timezone.utc)
    cred_id = str(uuid.uuid4())

    # Deactivate existing password credentials
    db.account_credentials.update_many(
        {"account_id": account_id, "credential_type": "PASSWORD_HASH"},
        {"$set": {"is_active": False, "updated_at": now}},
    )

    cred_doc = {
        "credential_id": cred_id,
        "account_id": account_id,
        "credential_type": "PASSWORD_HASH",
        "credential_data": {
            "algorithm": "pbkdf2_sha256",
            "hash": pwd_hash,
            "salt": salt,
            "iterations": 100_000,
        },
        "is_active": True,
        "expires_at": None,
        "created_at": now,
        "updated_at": now,
    }

    db.account_credentials.insert_one(cred_doc)
    cred_doc.pop("_id", None)
    return cred_doc


class ApiKeyResult(dict):
    """Dict that unpacks as (raw_token, cred_doc) for backward-compatible tuple unpacking."""

    def __iter__(self):
        yield self["api_key"]
        yield self


def authenticate_account_credentials(
    username: str,
    password: str,
    db=None,
    raise_on_error: bool = True,
) -> Any:
    """Validates login credentials, increments failed attempts, or unlocks on success."""
    if db is None:
        db = get_db()

    account = get_account_by_username(username, db=db)
    if not account:
        if raise_on_error:
            raise InvalidCredentialError("Invalid username or password")
        return False, None, "Invalid username or password"

    now = datetime.now(timezone.utc)

    # Check if locked
    if account.get("status") == "LOCKED":
        locked_until = account.get("locked_until")
        if locked_until and now < locked_until:
            if raise_on_error:
                raise AccountLockedError(f"Account is locked until {locked_until.isoformat()}")
            return False, None, f"Account is locked until {locked_until.isoformat()}"
        else:
            # Auto-unlock if lock period expired
            db.accounts.update_one(
                {"account_id": account["account_id"]},
                {"$set": {"status": "ACTIVE", "failed_login_attempts": 0, "locked_until": None, "updated_at": now}},
            )
            account["status"] = "ACTIVE"

    if account.get("status") == "SUSPENDED":
        if raise_on_error:
            raise AccountSuspendedError("Account has been suspended")
        return False, None, "Account has been suspended"

    if account.get("status") != "ACTIVE":
        if raise_on_error:
            raise InvalidCredentialError(f"Account is not active (current status: {account.get('status')})")
        return False, None, f"Account is not active (current status: {account.get('status')})"

    # Find active password credential
    cred = db.account_credentials.find_one(
        {"account_id": account["account_id"], "credential_type": "PASSWORD_HASH", "is_active": True}
    )
    if not cred:
        if raise_on_error:
            raise InvalidCredentialError("No active password credential configured")
        return False, None, "No active password credential configured"

    c_data = cred.get("credential_data", {})
    is_valid = verify_password(password, c_data.get("hash", ""), c_data.get("salt", ""))

    if not is_valid:
        # Increment failed attempts
        failed = account.get("failed_login_attempts", 0) + 1
        update_fields: Dict[str, Any] = {"failed_login_attempts": failed, "updated_at": now}
        if failed >= 5:
            lock_time = now + timedelta(minutes=15)
            update_fields["status"] = "LOCKED"
            update_fields["locked_until"] = lock_time
            msg = "Maximum failed attempts exceeded. Account locked for 15 minutes."
            db.accounts.update_one({"account_id": account["account_id"]}, {"$set": update_fields})
            if raise_on_error:
                raise AccountLockedError(msg)
            return False, None, msg
        else:
            msg = f"Invalid password. Attempt {failed} of 5."
            db.accounts.update_one({"account_id": account["account_id"]}, {"$set": update_fields})
            if raise_on_error:
                raise InvalidCredentialError(msg)
            return False, None, msg

    # Reset failed attempts and update last login
    db.accounts.update_one(
        {"account_id": account["account_id"]},
        {"$set": {"failed_login_attempts": 0, "locked_until": None, "last_login_at": now, "updated_at": now}},
    )

    acc = get_account_by_id(account["account_id"], db=db)
    if raise_on_error:
        return acc
    return True, acc, "Authentication successful"


def create_service_account_api_key(
    account_id: str,
    name: str = "Service API Key",
    scopes: Optional[List[str]] = None,
    expires_in_days: int = 90,
    db=None,
) -> ApiKeyResult:
    """Generates a secure API key for service accounts (e.g. AI agents AG-01/02/10)."""
    if db is None:
        db = get_db()

    acc = get_account_by_id(account_id, db=db)
    if acc.get("account_type") not in ["SERVICE", "SYSTEM"]:
        raise AccountValidationError("API keys can only be issued to SERVICE or SYSTEM accounts.")

    raw_token = f"ag_live_{secrets.token_urlsafe(32)}"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expires_in_days)
    cred_id = str(uuid.uuid4())

    cred_doc = {
        "credential_id": cred_id,
        "key_id": cred_id,
        "account_id": account_id,
        "credential_type": "API_KEY",
        "api_key": raw_token,
        "credential_data": {
            "name": name,
            "key_hash": token_hash,
            "prefix": raw_token[:12],
            "scopes": scopes or ["ALL"],
        },
        "is_active": True,
        "expires_at": expires_at,
        "created_at": now,
        "updated_at": now,
    }

    db.account_credentials.insert_one(dict(cred_doc))
    cred_doc.pop("_id", None)

    return ApiKeyResult(cred_doc)


def authenticate_api_key(raw_token: str, db=None) -> Dict[str, Any]:
    """Authenticates an incoming ag_live_ API key by matching SHA-256 hash."""
    if db is None:
        db = get_db()

    if not raw_token or not raw_token.startswith("ag_live_"):
        raise InvalidCredentialError("Invalid API key format")

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)

    cred = db.account_credentials.find_one({
        "credential_type": "API_KEY",
        "credential_data.key_hash": token_hash,
        "is_active": True,
    })

    if not cred:
        raise InvalidCredentialError("Invalid or revoked API key")

    expires_at = cred.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            raise InvalidCredentialError("API key has expired")

    acc = get_account_by_id(cred["account_id"], db=db)
    if acc.get("status") != "ACTIVE":
        raise AccountSuspendedError(f"Associated account is not active (status: {acc.get('status')})")

    return acc


def revoke_api_key(key_id_or_prefix: str, reason: str = "revoked", db=None) -> bool:
    """Revokes an API key credential immediately."""
    if db is None:
        db = get_db()

    res = db.account_credentials.update_many(
        {
            "credential_type": "API_KEY",
            "$or": [
                {"credential_id": key_id_or_prefix},
                {"credential_data.prefix": key_id_or_prefix},
                {"key_id": key_id_or_prefix},
            ],
        },
        {"$set": {"is_active": False, "revoked_at": datetime.now(timezone.utc), "revocation_reason": reason}},
    )
    return res.modified_count > 0


def transition_account_status(
    account_id: str,
    new_status: str,
    reason: Optional[str] = None,
    actor_id: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Executes a validated lifecycle state transition for an account."""
    if db is None:
        db = get_db()

    account = get_account_by_id(account_id, db=db)
    current_status = account["status"]

    if new_status == current_status:
        return account

    allowed = ALLOWED_ACCOUNT_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise InvalidAccountStateTransitionError(
            f"Illegal account transition from '{current_status}' to '{new_status}'. Allowed: {sorted(list(allowed))}"
        )

    now = datetime.now(timezone.utc)
    status_entry = {
        "status": new_status,
        "changed_at": now,
        "changed_by": actor_id,
        "reason": reason or f"Transitioned to {new_status}",
    }

    db.accounts.update_one(
        {"account_id": account_id},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {"status_history": status_entry},
        },
    )

    publish_event(
        event_type="AccountStatusChanged",
        aggregate_type="ACCOUNT",
        aggregate_id=account_id,
        tenant_id=account.get("tenant_id") or "global",
        payload={
            "account_id": account_id,
            "old_status": current_status,
            "new_status": new_status,
            "reason": reason,
            "changed_by": actor_id,
        },
        db=db,
    )

    return get_account_by_id(account_id, db=db)


authenticate_account = authenticate_account_credentials
create_ai_agent_api_key = create_service_account_api_key
verify_ai_agent_api_key = authenticate_api_key

"""One-time token and verification service for Meridian account lifecycle.

Supports:
- INVITE: 7-day single-use invitation tokens
- RESET: 1-hour single-use password reset tokens
- CLAIM_OTP: 10-minute 6-digit verification code with 5-attempt lockout
"""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple
from database.connection import get_db


class TokenError(ValueError):
    """Base class for token errors."""
    pass


class TokenInvalidError(TokenError):
    """Raised when a token does not exist or has already been used."""
    pass


class TokenExpiredError(TokenError):
    """Raised when a token has passed its expiration time."""
    pass


class TokenLockedError(TokenError):
    """Raised when an OTP has reached the maximum permitted verification attempts."""
    pass


def create_invite_token(
    account_id: str,
    tenant_id: str = "tenant_default",
    metadata: Optional[Dict[str, Any]] = None,
    expires_in_days: int = 7,
    db=None,
) -> Tuple[str, Dict[str, Any]]:
    """Generates a secure random 7-day single-use invite token and stores its SHA-256 hash."""
    if db is None:
        db = get_db()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expires_in_days)

    token_doc = {
        "token_hash": token_hash,
        "account_id": account_id,
        "purpose": "INVITE",
        "expires_at": expires_at,
        "used_at": None,
        "attempts": 0,
        "metadata": {
            **(metadata or {}),
            "tenant_id": tenant_id,
        },
        "created_at": now,
    }

    db.account_tokens.insert_one(token_doc)
    token_doc.pop("_id", None)
    return raw_token, token_doc


def create_reset_token(
    account_id: str,
    tenant_id: str = "tenant_default",
    metadata: Optional[Dict[str, Any]] = None,
    expires_in_hours: int = 1,
    db=None,
) -> Tuple[str, Dict[str, Any]]:
    """Generates a secure random 1-hour single-use password reset token and stores its SHA-256 hash."""
    if db is None:
        db = get_db()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=expires_in_hours)

    token_doc = {
        "token_hash": token_hash,
        "account_id": account_id,
        "purpose": "RESET",
        "expires_at": expires_at,
        "used_at": None,
        "attempts": 0,
        "metadata": {
            **(metadata or {}),
            "tenant_id": tenant_id,
        },
        "created_at": now,
    }

    db.account_tokens.insert_one(token_doc)
    token_doc.pop("_id", None)
    return raw_token, token_doc


def create_claim_otp(
    student_id: str,
    registration_no: str,
    institutional_email: str,
    tenant_id: str = "tenant_default",
    expires_in_minutes: int = 10,
    db=None,
) -> Tuple[str, str, Dict[str, Any]]:
    """Generates a 6-digit claim verification OTP and records a pending claim request."""
    if db is None:
        db = get_db()

    claim_id = f"clm_{uuid.uuid4().hex[:12]}"
    raw_otp = f"{secrets.randbelow(900000) + 100000}"
    token_hash = hashlib.sha256(f"{claim_id}:{raw_otp}".encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_in_minutes)

    token_doc = {
        "token_hash": token_hash,
        "account_id": f"claim:{claim_id}",
        "purpose": "CLAIM_OTP",
        "expires_at": expires_at,
        "used_at": None,
        "attempts": 0,
        "metadata": {
            "claim_id": claim_id,
            "student_id": student_id,
            "registration_no": registration_no,
            "institutional_email": institutional_email,
            "tenant_id": tenant_id,
        },
        "created_at": now,
    }
    db.account_tokens.insert_one(token_doc)
    token_doc.pop("_id", None)

    # Record in claim_requests collection
    claim_req = {
        "claim_id": claim_id,
        "tenant_id": tenant_id,
        "registration_no": registration_no,
        "email_submitted": institutional_email,
        "student_id": student_id,
        "status": "PENDING",
        "notes": "Claim OTP issued",
        "created_at": now,
        "resolved_at": None,
        "resolved_by": None,
    }
    db.claim_requests.insert_one(claim_req)

    return claim_id, raw_otp, token_doc


def verify_and_consume_token(raw_token: str, purpose: str, db=None) -> Dict[str, Any]:
    """Validates and consumes a single-use token (INVITE or RESET).

    Raises:
        TokenInvalidError: If token does not exist or has already been used.
        TokenExpiredError: If token has expired.
    """
    if db is None:
        db = get_db()

    token_hash = hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)

    token = db.account_tokens.find_one({
        "token_hash": token_hash,
        "purpose": purpose,
    })

    if not token or token.get("used_at") is not None:
        raise TokenInvalidError("Invalid or already used token.")

    expires_at = token.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            raise TokenExpiredError("Token has expired.")

    db.account_tokens.update_one(
        {"_id": token["_id"]},
        {"$set": {"used_at": now}},
    )
    token["used_at"] = now
    return token


def verify_and_consume_claim_otp(claim_id: str, raw_otp: str, db=None) -> Dict[str, Any]:
    """Validates and consumes a 6-digit claim OTP with attempt tracking and 5-attempt lockout.

    Raises:
        TokenInvalidError: If invalid claim_id or incorrect OTP code.
        TokenExpiredError: If OTP has passed its 10-minute validity.
        TokenLockedError: If 5 failed attempts have been exhausted.
    """
    if db is None:
        db = get_db()

    token = db.account_tokens.find_one({
        "purpose": "CLAIM_OTP",
        "metadata.claim_id": claim_id,
    })

    if not token or token.get("used_at") is not None:
        raise TokenInvalidError("Invalid claim verification session.")

    attempts = token.get("attempts", 0)
    if attempts >= 5:
        raise TokenLockedError("Too many failed attempts. This verification code is locked.")

    now = datetime.now(timezone.utc)
    expires_at = token.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            raise TokenExpiredError("Verification code has expired.")

    expected_hash = hashlib.sha256(f"{claim_id}:{raw_otp.strip()}".encode("utf-8")).hexdigest()
    if not hmac.compare_digest(expected_hash, token["token_hash"]):
        new_attempts = attempts + 1
        db.account_tokens.update_one(
            {"_id": token["_id"]},
            {"$inc": {"attempts": 1}},
        )
        if new_attempts >= 5:
            db.claim_requests.update_one(
                {"claim_id": claim_id},
                {"$set": {
                    "status": "REJECTED",
                    "notes": "Locked after 5 failed attempts",
                    "resolved_at": now,
                }},
            )
            raise TokenLockedError("Too many failed attempts. This verification code is locked.")
        raise TokenInvalidError(f"Incorrect verification code. {5 - new_attempts} attempts remaining.")

    # Success: consume token
    db.account_tokens.update_one(
        {"_id": token["_id"]},
        {"$set": {"used_at": now}},
    )
    db.claim_requests.update_one(
        {"claim_id": claim_id},
        {"$set": {
            "status": "APPROVED",
            "notes": "Verified via OTP",
            "resolved_at": now,
        }},
    )
    token["used_at"] = now
    return token

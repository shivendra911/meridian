"""Thread-safe and async-safe Tenant Context management using contextvars.
Enforces the primary security isolation boundary (ADR-C01-001).
"""

from contextvars import ContextVar
from typing import Optional

_CURRENT_TENANT_ID: ContextVar[Optional[str]] = ContextVar("current_tenant_id", default=None)
_CURRENT_ACTOR_ID: ContextVar[Optional[str]] = ContextVar("current_actor_id", default=None)


class TenantContextMissingError(RuntimeError):
    """Raised when an operation requires an active tenant context, but none is set."""
    pass


class TenantAccessDeniedError(PermissionError):
    """Raised when an operation attempts to access resources outside its tenant boundary."""
    pass


def set_current_tenant_id(tenant_id: Optional[str]) -> None:
    """Sets the active tenant ID for the current execution context."""
    _CURRENT_TENANT_ID.set(tenant_id)


def get_current_tenant_id(required: bool = True) -> Optional[str]:
    """Retrieves the active tenant ID from context.

    If required=True and no tenant ID is set, raises TenantContextMissingError.
    """
    tid = _CURRENT_TENANT_ID.get()
    if required and not tid:
        raise TenantContextMissingError(
            "Tenant context is required for this operation, but no tenant ID is bound to the current context."
        )
    return tid


def set_current_actor_id(actor_id: Optional[str]) -> None:
    """Sets the authenticated actor ID (user, system agent, etc.)."""
    _CURRENT_ACTOR_ID.set(actor_id)


def get_current_actor_id() -> str:
    """Retrieves the current actor ID, defaulting to 'system'."""
    return _CURRENT_ACTOR_ID.get() or "system"


class TenantContext:
    """Context manager for scoping operations to a specific tenant."""

    def __init__(self, tenant_id: str, actor_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.actor_id = actor_id
        self._prev_tenant = None
        self._prev_actor = None

    def __enter__(self):
        self._prev_tenant = _CURRENT_TENANT_ID.get()
        self._prev_actor = _CURRENT_ACTOR_ID.get()
        _CURRENT_TENANT_ID.set(self.tenant_id)
        if self.actor_id:
            _CURRENT_ACTOR_ID.set(self.actor_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        _CURRENT_TENANT_ID.set(self._prev_tenant)
        _CURRENT_ACTOR_ID.set(self._prev_actor)


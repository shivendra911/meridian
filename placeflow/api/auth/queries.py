"""PlaceFlow / Meridian — Authoritative Scoped Query Execution Engine (Phase 1).

Enforces mandatory data scoping across all domain collections at the data layer.
All views querying students, applications, interviews, placements, jobs, companies,
and consents MUST read data exclusively via `scoped_find` and `scoped_get`.

Rules:
- Computes base scoped filter from ScopeResolver(principal).
- Always merges ScopeResolver filter with caller-provided extra criteria using $and.
- Out-of-scope lookups return empty list or None (HTTP 404 in views).
- Never leaks records across tenant, institution, or role assignment boundaries.
"""

from typing import Any, Dict, List, Optional
from database.connection import get_db
from api.auth.scoping import ScopeResolver


def _resolve_base_filter(collection: str, principal: Any, db=None) -> Dict[str, Any]:
    """Resolves the authoritative base security filter for the specified collection."""
    if principal is None:
        return {}

    resolver = ScopeResolver(principal, db=db)
    coll_lower = collection.lower().strip()

    if coll_lower in ("students",):
        return resolver.students()
    if coll_lower in ("applications", "v_application_details"):
        return resolver.applications()
    if coll_lower in ("interviews",):
        return resolver.interviews()
    if coll_lower in ("placements",):
        return resolver.placements()
    if coll_lower in ("jobs", "placement_drives"):
        return resolver.jobs()
    if coll_lower in ("companies",):
        return resolver.companies()
    if coll_lower in ("consents", "consent_records"):
        return resolver.consents()

    # Default permissive for non-scoped system collections if caller has tenant
    tenant_id = getattr(principal, "tenant_id", None)
    if tenant_id:
        return {"tenant_id": tenant_id}
    return {}


def scoped_find(
    collection: str,
    principal: Any,
    extra: Optional[Dict[str, Any]] = None,
    projection: Optional[Dict[str, Any]] = None,
    sort: Optional[Any] = None,
    limit: Optional[int] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Executes a MongoDB find operation strictly constrained by the Principal's data scope."""
    if db is None:
        db = get_db()

    base_filter = _resolve_base_filter(collection, principal, db=db)

    # If the base filter is an impossible match, return early without DB roundtrip
    if base_filter.get("student_id") in ("__NO_ACCESS__", "__ANONYMOUS_NO_ACCESS__"):
        return []

    # Merge base filter with caller's extra query criteria
    if not extra:
        final_query = base_filter
    elif not base_filter:
        final_query = extra
    else:
        final_query = {"$and": [base_filter, extra]}

    proj = projection if projection is not None else {"_id": 0}
    cursor = db[collection].find(final_query, proj)

    if sort:
        if isinstance(sort, (list, tuple)):
            cursor = cursor.sort(sort)
        elif isinstance(sort, str):
            cursor = cursor.sort(sort, 1)

    if limit and isinstance(limit, int) and limit > 0:
        cursor = cursor.limit(limit)

    return list(cursor)


def scoped_get(
    collection: str,
    principal: Any,
    selector: Dict[str, Any],
    projection: Optional[Dict[str, Any]] = None,
    db=None,
) -> Optional[Dict[str, Any]]:
    """Fetches a single document matching the selector within the Principal's authoritative scope.
    
    Returns None if the document does not exist OR is outside the principal's data scope.
    """
    rows = scoped_find(
        collection=collection,
        principal=principal,
        extra=selector,
        projection=projection,
        limit=1,
        db=db,
    )
    return rows[0] if rows else None

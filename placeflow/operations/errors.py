from pymongo.errors import DuplicateKeyError, ServerSelectionTimeoutError, WriteError


class PlaceFlowError(Exception):
    """A business-rule violation. The message is safe to show to the user."""


class VacancyExhausted(PlaceFlowError):
    """Raised inside the placement transaction when no seat is left."""


def _find_rules(node):
    """Validators wrapped in $and nest the details one level deeper, so search recursively."""
    if isinstance(node, dict):
        if "schemaRulesNotSatisfied" in node:
            return node["schemaRulesNotSatisfied"]
        children = node.values()
    elif isinstance(node, list):
        children = node
    else:
        return None
    for child in children:
        found = _find_rules(child)
        if found:
            return found
    return None


def _validation_reason(exc):
    try:
        details = (exc.details or {}).get("errInfo", {}).get("details", {})
        parts = []
        for rule in _find_rules(details) or []:
            if "missingProperties" in rule:
                parts.append("missing " + ", ".join(rule["missingProperties"]))
            for prop in rule.get("propertiesNotSatisfied", []):
                info = prop["details"][0]
                parts.append(f'{prop["propertyName"]}: {info.get("operatorName")} rule failed '
                             f'(value {info.get("consideredValue")!r})')
            if rule.get("operatorName") == "additionalProperties":
                parts.append("unknown field(s): " + ", ".join(rule["additionalProperties"]))
        if not parts and "$expr" in str(details):
            parts.append("a cross-field rule failed (filled above vacancies, or interview ending before it starts)")
        return "; ".join(parts) or "document does not match the schema"
    except (KeyError, IndexError, TypeError, AttributeError):
        return "document does not match the schema"


def friendly(exc):
    """Translate any exception into a message a user can act on."""
    if isinstance(exc, (PlaceFlowError, ValueError)):
        return str(exc)
    if isinstance(exc, DuplicateKeyError):  # subclass of WriteError: check first
        key = (exc.details or {}).get("keyValue")
        return f"Record already exists: {key}" if key else "Record already exists (duplicate key)"
    if isinstance(exc, WriteError) and exc.code == 121:
        return "Validation failed: " + _validation_reason(exc)
    if isinstance(exc, ServerSelectionTimeoutError):
        return "Cannot reach MongoDB; check MONGODB_URI"
    return f"Unexpected error: {exc}"


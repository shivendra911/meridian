import os

os.environ["MONGODB_DB"] = "college_placement_test"  # hard assignment: never touch the real database
os.environ.setdefault("DJANGO_LOGIN_THROTTLE_RATE", "5000/minute")

import pytest  # noqa: E402

from setup_database import build  # noqa: E402


@pytest.fixture(autouse=True)
def ensure_debug_for_testing():
    """Ensure settings.DEBUG remains True so seed_demo_accounts can safely execute during test suites."""
    try:
        from django.conf import settings
        if settings.configured:
            settings.DEBUG = True
    except Exception:
        pass


@pytest.fixture()
def db():
    return build(reset=True)


import os

os.environ["MONGODB_DB"] = "college_placement_test"  # hard assignment: never touch the real database
os.environ.setdefault("DJANGO_LOGIN_THROTTLE_RATE", "5000/minute")

import pytest  # noqa: E402

from setup_database import build  # noqa: E402


@pytest.fixture()
def db():
    return build(reset=True)


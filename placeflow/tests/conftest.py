import os

os.environ["MONGODB_DB"] = "college_placement_test"  # hard assignment: never touch the real database

import pytest  # noqa: E402

from setup_database import build  # noqa: E402


@pytest.fixture()
def db():
    return build(reset=True)


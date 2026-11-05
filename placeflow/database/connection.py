import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

load_dotenv()


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/?replicaSet=rs0")
    client = MongoClient(uri, serverSelectionTimeoutMS=4000, tz_aware=True)
    try:
        client.admin.command("ping")
    except ServerSelectionTimeoutError as exc:
        raise SystemExit("Cannot reach MongoDB. Check MONGODB_URI and that mongod is running.") from exc
    return client


def get_db():
    return get_client()[os.getenv("MONGODB_DB", "college_placement_db")]


def supports_transactions() -> bool:
    """True only on a replica set (or Atlas). Transactions and change streams need it."""
    return "setName" in get_client().admin.command("hello")


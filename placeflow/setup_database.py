import argparse

from database import sample_data
from database.connection import get_client, get_db, supports_transactions
from database.validation import apply_indexes, apply_schemas, create_views
from operations.ids import sync_counters
from operations.integrity import consistency_issues


def build(reset=False, bulk=False):
    db = get_db()
    if reset or bulk:  # bulk data must never be mixed with the curated set
        get_client().drop_database(db.name)
    apply_schemas(db)
    apply_indexes(db)
    create_views(db)
    if bulk:
        from database import bulk_seed  # built in Phase 9
        bulk_seed.load(db)
    else:
        sample_data.seed(db)
    sync_counters(db)

    # In DEBUG / testing mode, always maintain seeded demo accounts and baseline roles
    try:
        from django.conf import settings
        if getattr(settings, "DEBUG", False):
            from scripts.seed_demo_accounts import seed_demo_accounts
            seed_demo_accounts(db=db)
    except Exception:
        pass

    return db


def main():
    parser = argparse.ArgumentParser(description="Create/seed the PlaceFlow database")
    parser.add_argument("--reset", action="store_true", help="drop the database first")
    parser.add_argument("--bulk", action="store_true", help="load the large dataset (implies --reset)")
    args = parser.parse_args()
    db = build(args.reset, args.bulk)
    print("Database:", db.name, "| transactions available:", supports_transactions())
    for name in sorted(db.list_collection_names()):
        print(f"  {name:24} {db[name].count_documents({})}")
    print("Consistency issues:", consistency_issues(db) or "none")


if __name__ == "__main__":
    main()


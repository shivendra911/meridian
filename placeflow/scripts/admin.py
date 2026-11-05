"""python scripts/admin.py backup | restore <backup-folder> | export"""
import csv
import json
import os
import pathlib
import shutil
import subprocess
import sys
from datetime import datetime

from bson import json_util
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/?replicaSet=rs0")
DB = os.getenv("MONGODB_DB", "college_placement_db")


def run(cmd):
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=True)


def backup():
    out = pathlib.Path("backups") / datetime.now().strftime("%Y%m%d_%H%M%S")
    out.mkdir(parents=True, exist_ok=True)
    if shutil.which("mongodump"):
        run(["mongodump", "--uri", URI, "--db", DB, "--out", str(out)])
    else:
        # Pure Python fallback when mongodump is not installed
        client = MongoClient(URI)
        db = client[DB]
        dump_dir = out / DB
        dump_dir.mkdir(parents=True, exist_ok=True)
        for col_name in db.list_collection_names():
            if col_name.startswith("system."):
                continue
            docs = list(db[col_name].find({}))
            with open(dump_dir / f"{col_name}.json", "w", encoding="utf-8") as f:
                f.write(json_util.dumps(docs))
    print("Backup written to", out)


def restore(folder):
    """Restore into <db>_restore and compare document counts with the original."""
    target_db = f"{DB}_restore"
    if shutil.which("mongorestore"):
        run(["mongorestore", "--uri", URI, "--nsInclude", f"{DB}.*", "--nsFrom", f"{DB}.*",
             "--nsTo", f"{target_db}.*", folder])
    else:
        # Pure Python fallback when mongorestore is not installed
        client = MongoClient(URI)
        client.drop_database(target_db)
        dest_db = client[target_db]
        folder_path = pathlib.Path(folder)
        subfolder = folder_path / DB if (folder_path / DB).exists() else folder_path
        for json_file in subfolder.glob("*.json"):
            col_name = json_file.stem
            with open(json_file, "r", encoding="utf-8") as f:
                docs = json_util.loads(f.read())
            if docs:
                dest_db[col_name].insert_many(docs)

    client = MongoClient(URI)
    for name in sorted(client[DB].list_collection_names()):
        if name.startswith("system."):
            continue
        original = client[DB][name].count_documents({})
        restored = client[target_db][name].count_documents({})
        print(f"{name:26} original={original:6} restored={restored:6} {'OK' if original == restored else 'MISMATCH'}")


def export():
    pathlib.Path("exports").mkdir(exist_ok=True)
    targets = {
        "branch_placement_stats": ["_id", "students", "placed", "placement_pct", "avg_package", "max_package", "median_package"],
        "placements": ["placement_id", "student_id", "company_id", "job_id", "package_lpa", "placement_date"],
    }
    client = MongoClient(URI)
    db = client[DB]

    if shutil.which("mongoexport"):
        for collection, fields in targets.items():
            field_str = ",".join(fields)
            run(["mongoexport", "--uri", URI, "--db", DB, "--collection", collection, "--type=csv",
                 f"--fields={field_str}", "--out", f"exports/{collection}.csv"])
    else:
        # Pure Python fallback when mongoexport is not installed
        for collection, fields in targets.items():
            out_file = pathlib.Path("exports") / f"{collection}.csv"
            docs = list(db[collection].find({}, {f: 1 for f in fields}))
            with open(out_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
                writer.writeheader()
                for doc in docs:
                    # Flatten/format if necessary
                    row = {k: doc.get(k, "") for k in fields}
                    writer.writerow(row)
            print(f"Exported {len(docs)} rows to exports/{collection}.csv")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "backup":
        backup()
    elif command == "restore" and len(sys.argv) > 2:
        restore(sys.argv[2])
    elif command == "export":
        export()
    else:
        print(__doc__)

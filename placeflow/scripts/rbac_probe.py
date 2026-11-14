#!/usr/bin/env python3
"""
Live RBAC probe for Meridian. Save as placeflow/scripts/rbac_probe.py.

Needs: Django running on :8000, `python setup_database.py` and `python scripts/seed_demo_accounts.py` already run
(demo password is `password123`). Exits 1 if any check fails, so it can gate a release.

    python scripts/rbac_probe.py [--base http://127.0.0.1:8000/api] [--origin http://127.0.0.1:5173]
"""
import argparse, os, re, sys
import requests

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:8000/api")
ap.add_argument("--origin", default="http://127.0.0.1:5173")
args = ap.parse_args()
B, ORIGIN = args.base, args.origin
URLS = os.path.join(os.path.dirname(__file__), "..", "api", "urls.py")

ROLES = ["student", "placement_rep", "faculty", "coordinator", "hod", "dean", "tpo_coordinator", "tpo_admin",
         "vice_chancellor", "admin", "superadmin", "auditor", "recruiter"]
SECRET_KEYS = ("password_hash", "password_salt", "token_hash", "raw_token")
fails, passes = [], 0


def check(name, ok, detail=""):
    global passes
    if ok:
        passes += 1
    else:
        fails.append(f"{name}  {detail}")
        print(f"FAIL  {name}  {detail}")


def login(u):
    s = requests.Session()
    s.get(B + "/auth/csrf/")
    s.headers.update({"X-CSRFToken": s.cookies.get("csrftoken", ""), "Referer": ORIGIN + "/"})
    r = s.post(B + "/auth/login/", json={"username": u, "password": "password123"})
    s.headers["X-CSRFToken"] = s.cookies.get("csrftoken", "")
    return s, r.status_code


def rows(r):
    try:
        d = r.json()
        return d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
    except Exception:
        return []


def ids(r):
    return {x.get("student_id") for x in rows(r) if isinstance(x, dict)}


S = {}
for u in ROLES:
    s, code = login(u)
    check(f"login {u}", code == 200, f"status {code}")
    S[u] = s

# 1. portals and landing
EXPECT = {"student": "student", "placement_rep": "student", "faculty": "faculty", "coordinator": "faculty",
          "hod": "hod", "dean": "hod", "tpo_coordinator": "tpo", "tpo_admin": "tpo",
          "vice_chancellor": "management", "admin": "admin", "superadmin": "admin",
          "auditor": "management", "recruiter": ""}
for u, want in EXPECT.items():
    me = S[u].get(B + "/auth/me/").json()
    me = me.get("me", me)
    got = me.get("default_portal") or ""
    check(f"default portal {u}", got == want, f"got '{got}' want '{want}'")
    if u == "recruiter":
        check("recruiter has no portals", not me.get("portals"), str(me.get("portals")))

# 2. data scope (matches the standard seed)
check("student cannot use /tpo/students/", S["student"].get(B + "/tpo/students/").status_code == 403)
check("student cannot read another student", S["student"].get(B + "/tpo/students/STU003/").status_code in (403, 404))
check("faculty sees mentees only", ids(S["faculty"].get(B + "/faculty/mentees/")) == {"STU001", "STU002"})
check("HOD (CSE) sees CSE only", ids(S["hod"].get(B + "/hod/students/")) == {"STU001", "STU002", "STU005", "STU008"})
check("TPO admin sees all students", len(ids(S["tpo_admin"].get(B + "/tpo/students/"))) >= 8)
check("student sees own applications only",
      all(a.get("student_id") == "STU001" for a in rows(S["student"].get(B + "/applications/"))))

# 3. writes
body = {"student_id": "STU998", "name": "Probe", "email": "p@univ.edu", "department": "CSE", "year": 3,
        "cgpa": 7.5, "backlogs": 0, "skills": ["Java"], "placement_status": "Unplaced"}
for u in ["student", "faculty", "hod", "recruiter", "auditor"]:
    check(f"{u} cannot create a student", S[u].post(B + "/tpo/students/", json=body).status_code == 403)

# 4. administrative routes must be closed to non-admins
ADMIN_ONLY = ("v4/iam/", "v4/institutional/", "v4/ai/", "v4/config/", "v4/tenants", "v4/institutions")
NON_ADMIN = ["student", "placement_rep", "faculty", "hod", "recruiter", "auditor"]
src = open(URLS, encoding="utf-8").read()
routes = sorted({p for p in re.findall(r"path\(\s*['\"]([^'\"<]*)['\"]", src) if p and "<" not in p})
for p in routes:
    if p.startswith(ADMIN_ONLY):
        for u in NON_ADMIN:
            r = S[u].get(B + "/" + p)
            check(f"{u} blocked from /{p}", r.status_code in (401, 403), f"status {r.status_code}")

# 5. recruiter scope: no institution-wide data
for p in ["interviews/", "placements/", "applications/", "students/", "renege-radar/"]:
    r = S["recruiter"].get(B + "/" + p)
    check(f"recruiter blocked from /{p}", r.status_code in (401, 403), f"status {r.status_code}")

# 6. secrets must never be serialised, for any role, on any route
for u in ROLES:
    for p in routes:
        try:
            t = S[u].get(B + "/" + p, timeout=10).text
        except Exception:
            continue
        for k in SECRET_KEYS:
            if f'"{k}"' in t:
                check(f"{u} /{p} leaks '{k}'", False)

print(f"\n{passes} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)

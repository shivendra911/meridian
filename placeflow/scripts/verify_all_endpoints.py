import sys
import json
import urllib.request
import urllib.error
from http.cookiejar import CookieJar

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

results = []

def record(category, method, url, status_code, expected_status, note=""):
    success = (status_code in expected_status) if isinstance(expected_status, list) else (status_code == expected_status)
    results.append({
        "category": category,
        "method": method,
        "url": url,
        "status_code": status_code,
        "expected": expected_status,
        "success": success,
        "note": note
    })
    mark = "✓" if success else "✗"
    print(f"[{mark}] {category:<20} {method:<5} {url:<45} -> {status_code} ({note})")

class Session:
    def __init__(self):
        self.cj = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))

    def request(self, method, url, data=None, headers=None, timeout=15):
        if headers is None:
            headers = {}
        headers["User-Agent"] = "MeridianVerification/1.0"
        
        # Add CSRF token from cookies if available
        for cookie in self.cj:
            if cookie.name == "csrftoken":
                headers["X-CSRFToken"] = cookie.value
                
        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8", errors="replace")
                return resp.status, body
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            return e.code, body
        except Exception as e:
            return 0, str(e)

def main():
    print("=" * 85)
    print("STARTING MERIDIAN ENDPOINT & PORTAL LIVE VERIFICATION")
    print("=" * 85)

    sess = Session()

    # 1. Frontend Checks
    for path, note in [
        ("/", "Vite Dev Root / Landing Page"),
        ("/login", "Login Page Shell"),
        ("/dev/cards", "Cards Design Gallery"),
        ("/privacy", "Legal: Privacy Policy"),
        ("/terms", "Legal: Terms of Service"),
        ("/contact", "Support Contact Page"),
    ]:
        st, body = sess.request("GET", f"{FRONTEND_URL}{path}")
        record("Frontend Shell", "GET", f"{FRONTEND_URL}{path}", st, [200], note)

    # 2. Public / Health
    st, body = sess.request("GET", f"{BASE_URL}/api/health/")
    record("System Health", "GET", "/api/health/", st, [200], body[:45])

    # 3. CSRF
    st, body = sess.request("GET", f"{BASE_URL}/api/auth/csrf/")
    record("Auth CSRF", "GET", "/api/auth/csrf/", st, [200], "CSRF Cookie Acquired")

    # 4. Auth Lifecycle Endpoints
    st, body = sess.request("POST", f"{BASE_URL}/api/auth/password/forgot/", {"email": "nobody@example.com"})
    record("Auth Lifecycle", "POST", "/api/auth/password/forgot/", st, [200], "Enumeration-safe 200")

    st, body = sess.request("POST", f"{BASE_URL}/api/auth/claim/start/", {"identifier": "nobody@univ.edu"})
    record("Auth Lifecycle", "POST", "/api/auth/claim/start/", st, [200], "Claim start handled")

    st, body = sess.request("POST", f"{BASE_URL}/api/auth/accept-invite/", {"token": "invalid_fake_token", "password": "NewPassword123!"})
    record("Auth Lifecycle", "POST", "/api/auth/accept-invite/", st, [400], "Invalid invite token rejected")

    # 5. Role Logins and Portal Endpoints
    ROLES = [
        ("student", "password123", "student", [
            ("/api/student/me/", [200], "Student Self Context"),
            ("/api/student/opportunities/", [200], "Eligible Job Drives"),
            ("/api/student/applications/", [200], "Student Application History"),
            ("/api/student/interviews/", [200], "Student Interviews Roster"),
            ("/api/student/offers/", [200], "Student Offers Roster"),
            ("/api/student/consents/", [200], "Student DPDP Consents"),
            ("/api/student/academics/", [200], "Student Academic Records"),
            ("/api/student/insights/readiness/", [200], "Placement Readiness Score"),
        ]),
        ("tpo_admin", "password123", "tpo", [
            ("/api/tpo/overview/", [200], "TPO Key Metrics Overview"),
            ("/api/tpo/jobs/", [200], "TPO Placement Drives/Jobs"),
            ("/api/tpo/students/", [200], "TPO Student Cohort Roster"),
            ("/api/tpo/companies/", [200], "TPO Company Directory"),
            ("/api/tpo/applications/", [200], "TPO Application Registry"),
            ("/api/tpo/interviews/", [200], "TPO Interview Slots"),
            ("/api/tpo/placements/", [200], "TPO Confirmed Placements"),
            ("/api/tpo/models/", [200], "TPO ML Models"),
        ]),
        ("faculty", "password123", "faculty", [
            ("/api/faculty/mentees/", [200], "Assigned Mentee Cohort"),
            ("/api/faculty/summary/", [200], "Department Mentorship Summary"),
        ]),
        ("hod", "password123", "hod", [
            ("/api/hod/students/", [200], "Department Student Cohort"),
            ("/api/hod/faculty/", [200], "Department Faculty Roster"),
            ("/api/hod/summary/", [200], "Department Executive Summary"),
        ]),
        ("vice_chancellor", "password123", "management", [
            ("/api/management/nirf/metrics/", [200], "NIRF Accreditation Analytics"),
            ("/api/management/fairness/audit/", [200], "Demographic Fairness Audit"),
            ("/api/management/agents/runs/", [200], "Autonomous Copilot Runs"),
            ("/api/management/reports/", [200], "Executive Aggregate Reports"),
        ]),
        ("admin", "password123", "admin", [
            ("/api/admin/tenants/", [200], "Platform Tenant Registry"),
            ("/api/admin/institutions/", [200], "Institutional Registry"),
            ("/api/admin/campuses/", [200], "Campus Registry"),
            ("/api/admin/hierarchy/", [200], "Organizational Hierarchy"),
            ("/api/admin/summary/", [200], "Administration Summary"),
            ("/api/admin/claims/", [200], "Pending Account Claims Queue"),
            ("/api/admin/iam/identities/", [200], "IAM Person Identities"),
            ("/api/admin/iam/accounts/", [200], "IAM User Accounts"),
            ("/api/admin/iam/roles/", [200], "IAM Roles Catalog"),
        ])
    ]

    for username, password, default_role, portal_endpoints in ROLES:
        user_sess = Session()
        # Prime CSRF
        user_sess.request("GET", f"{BASE_URL}/api/auth/csrf/")

        # Login
        st, body = user_sess.request("POST", f"{BASE_URL}/api/auth/login/", {"username": username, "password": password})
        record(f"Login ({username})", "POST", "/api/auth/login/", st, [200], f"Role: {default_role}")
        if st != 200:
            print(f"Failed login as {username}: {body[:100]}")
            continue

        try:
            login_data = json.loads(body).get("me", {})
            person_id = login_data.get("person_id")
        except:
            person_id = None

        # /api/auth/me/
        st, body = user_sess.request("GET", f"{BASE_URL}/api/auth/me/")
        record(f"Auth Me ({username})", "GET", "/api/auth/me/", st, [200], f"Identity verified")

        # /api/account/profile/
        st, body = user_sess.request("GET", f"{BASE_URL}/api/account/profile/")
        record(f"Account Profile", "GET", "/api/account/profile/", st, [200], f"Profile metadata accessible")

        # /api/account/sessions/
        st, body = user_sess.request("GET", f"{BASE_URL}/api/account/sessions/")
        try:
            s_count = len(json.loads(body).get("sessions", []))
        except:
            s_count = 0
        record(f"Account Sessions", "GET", "/api/account/sessions/", st, [200], f"Active sessions: {s_count}")

        # /api/account/notifications/
        st, body = user_sess.request("GET", f"{BASE_URL}/api/account/notifications/")
        try:
            unread = json.loads(body).get("unread_count")
        except:
            unread = 0
        record(f"Notifications", "GET", "/api/account/notifications/", st, [200], f"Unread count: {unread}")

        # /api/people/<id>/card/
        if person_id:
            st, body = user_sess.request("GET", f"{BASE_URL}/api/people/{person_id}/card/")
            record(f"Profile Card", "GET", f"/api/people/{person_id}/card/", st, [200], f"Card rendered for {person_id}")

        # Portal-specific endpoints
        for endpoint, expected, desc in portal_endpoints:
            st, body = user_sess.request("GET", f"{BASE_URL}{endpoint}")
            record(f"Portal ({username})", "GET", endpoint, st, expected, desc)

    # 6. RBAC Guard check: student forbidden from admin claims queue and tpo jobs
    guard_sess = Session()
    guard_sess.request("GET", f"{BASE_URL}/api/auth/csrf/")
    guard_sess.request("POST", f"{BASE_URL}/api/auth/login/", {"username": "student", "password": "password123"})

    st, _ = guard_sess.request("GET", f"{BASE_URL}/api/tpo/jobs/")
    record("RBAC Guard", "GET", "/api/tpo/jobs/ (as student)", st, [403], "Properly denied 403 Forbidden")

    st, _ = guard_sess.request("GET", f"{BASE_URL}/api/admin/claims/")
    record("RBAC Guard", "GET", "/api/admin/claims/ (as student)", st, [403], "Properly denied 403 Forbidden")

    # 7. Summary
    print("\n" + "=" * 85)
    total = len(results)
    passed = sum(1 for r in results if r["success"])
    failed = total - passed
    print(f"TOTAL ENDPOINTS TESTED: {total}")
    print(f"PASSED: {passed}")
    print(f"FAILED: {failed}")
    print("=" * 85)

    if failed > 0:
        print("FAILURES:")
        for r in results:
            if not r["success"]:
                print(f"  {r['category']} {r['method']} {r['url']} -> {r['status_code']} (expected {r['expected']})")
        sys.exit(1)
    else:
        print("ALL ENDPOINTS RETURNED EXPECTED STATUS CODES!")
        sys.exit(0)

if __name__ == "__main__":
    main()

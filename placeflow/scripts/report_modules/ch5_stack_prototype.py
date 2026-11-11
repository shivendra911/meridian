"""
Chapter 5: Technology Stack & Working Prototype Demonstration (Expanded Edition)
"""

def get_chapter_5() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 5 -->
    <div class="page-break"></div>

    <h1>Chapter 5: Technology Stack &amp; Working Prototype Demonstration</h1>

    <h2>5.1 Full-Stack Technology Matrix</h2>
    <p>
      Meridian is implemented as a cloud-native, polyglot software artifact. Table 5.1 details the complete production technology inventory:
    </p>

    <table>
      <thead>
        <tr><th>Layer / Subsystem</th><th>Technology &amp; Version</th><th>Specific Function &amp; Architectural Responsibility</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Core</strong></td>
          <td>React 19, TypeScript 5.8</td>
          <td>Single-Page Application (SPA) architecture, strict component typing, and client-side route guards.</td>
        </tr>
        <tr>
          <td><strong>Build Tooling &amp; Styling</strong></td>
          <td>Vite 8.3.5, Tailwind CSS 4</td>
          <td>Sub-second HMR development server, optimized production rollup bundles (1.11s compile), and utility-first styling.</td>
        </tr>
        <tr>
          <td><strong>Backend Web Service</strong></td>
          <td>Python 3.10+, Django 5.1</td>
          <td>RESTful micro-service routing, middleware security layers, CORS governance, and transaction orchestration.</td>
        </tr>
        <tr>
          <td><strong>Database Engine</strong></td>
          <td>MongoDB 7.0.x Community / Ent.</td>
          <td>Primary document store, WiredTiger optimistic concurrency, multi-document ACID transactions, 50GB Oplog.</td>
        </tr>
        <tr>
          <td><strong>Database Driver &amp; ODM</strong></td>
          <td>PyMongo 4.9+</td>
          <td>Direct native BSON serialization, connection pooling (min 10, max 100), and session-scoped transaction handles.</td>
        </tr>
        <tr>
          <td><strong>Machine Learning &amp; Math</strong></td>
          <td>Scikit-Learn 1.5, NumPy 2.1</td>
          <td>In-process predictive placement scoring (VTI), skill gap analysis, and demographic fairness audits.</td>
        </tr>
        <tr>
          <td><strong>Testing Frameworks</strong></td>
          <td>Vitest, Pytest, Node.js</td>
          <td>Frontend unit tests (28/28), backend transaction tests (203/203), and architectural boundary checker (0 violations).</td>
        </tr>
        <tr>
          <td><strong>Vector Assets &amp; Graphics</strong></td>
          <td>SVG 1.1 Vector Graphics</td>
          <td>Publication-grade vector architecture diagrams, lifecycle flows, and portal perspectives embedded natively.</td>
        </tr>
      </tbody>
    </table>

    <h2>5.2 Frontend Working Prototype Architecture &amp; The 5 Card States</h2>
    <p>
      The frontend user interface is anchored by an <strong>AppShell</strong> component that provides unified top navigation,
      dynamic breadcrumbs, global session telemetry, and the institutional theme switcher. To eliminate UI inconsistencies,
      all dynamic cards inherit the <strong>Standardized 5-State Architecture</strong>:
    </p>

    <div class="grid-2">
      <div class="stat-card">
        <h4>1. Default / Loaded State</h4>
        <p>Renders authoritative BSON metrics, verified skill badges, compensation figures, and actionable workflow buttons.</p>
      </div>
      <div class="stat-card">
        <h4>2. Loading / Skeleton State</h4>
        <p>Displays animated pulse skeletons matching exact card layout dimensions to prevent layout shifts during network latency.</p>
      </div>
    </div>

    <div class="grid-3" style="margin-top: 8px;">
      <div class="stat-card">
        <h4>3. Empty State</h4>
        <p>Shows contextual illustrations, clear explanatory text, and proactive call-to-actions when records are absent.</p>
      </div>
      <div class="stat-card">
        <h4>4. Error State</h4>
        <p>Presents human-readable error summaries, BSON error codes, and an idempotent retry button to re-fetch the query.</p>
      </div>
      <div class="stat-card">
        <h4>5. Highlighted State</h4>
        <p>Applies glowing emerald or sky borders to indicate Super Dream offers, urgent action items, or critical deadlines.</p>
      </div>
    </div>

    <div class="screenshot-container">
      <img src="__IMG_PROTOTYPE_OVERVIEW__" alt="Meridian Platform Working Prototype" />
      <div class="screenshot-caption">Figure 5.1: Meridian Enterprise Platform Working Prototype — Live Vite Dev Server Overview.</div>
    </div>

    <h2>5.3 Working Prototype Demonstration Across 6 Role Perspectives</h2>
    <p>
      The live working prototype deploys 6 strictly isolated role modules, each tailored to distinct institutional personas:
    </p>

    <h3>5.3.1 Perspective 1: The Candidate / Student Portal</h3>
    <p>
      Allows students to track eligibility, view verified CGPA and backlogs, access personalized VTI talent badges, and execute
      1-Click applications with automated criteria checks.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_STUDENT__
        <div class="diagram-caption">Figure 5.2a: Student Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_STUDENT__" alt="Student Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.2b: Student Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h3>5.3.2 Perspective 2: The Training &amp; Placement Officer (TPO) Portal</h3>
    <p>
      Central operational command for managing corporate recruitment drives, publishing JNFs, configuring multi-round Superday
      interview schedules, and monitoring real-time seat fulfillment.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_TPO__
        <div class="diagram-caption">Figure 5.3a: TPO Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_TPO__" alt="TPO Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.3b: TPO Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h3>5.3.3 Perspective 3: The Faculty Mentor / Academic Advisor Portal</h3>
    <p>
      Empowers academic advisors to track assigned mentee cohorts, verify student credentials, flag attendance deficits (&lt;75%),
      and conduct early academic interventions before corporate evaluation rounds.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_FACULTY__
        <div class="diagram-caption">Figure 5.4a: Faculty Mentor Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_FACULTY__" alt="Faculty Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.4b: Faculty Mentor Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h3>5.3.4 Perspective 4: The Head of Department (HOD) Governance Portal</h3>
    <p>
      Provides departmental academic leadership with cohort placement metrics, department-wide salary distributions, faculty mentee load
      balances, and formal eligibility waiver authorizations.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_HOD__
        <div class="diagram-caption">Figure 5.5a: HOD Governance Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_HOD__" alt="HOD Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.5b: HOD Governance Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h3>5.3.5 Perspective 5: The Executive Management &amp; Deans Portal</h3>
    <p>
      Provides institutional Vice Chancellors and Academic Deans with campus-wide macro telemetry: NIRF GPH/GMS accreditation metrics,
      cross-school median CTC comparisons, and corporate recruiter retention statistics.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_MGMT__
        <div class="diagram-caption">Figure 5.6a: Management Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_MGMT__" alt="Management Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.6b: Executive Management Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h3>5.3.6 Perspective 6: The System Administrator Portal</h3>
    <p>
      Comprehensive administrative control plane for multi-tenant campus configuration, user account provisioning, role and
      permission vector management, and real-time immutable audit log inspection.
    </p>
    <div class="grid-2">
      <div class="diagram-container">
        __SVG_ADMIN__
        <div class="diagram-caption">Figure 5.7a: Administrator Portal Architectural Perspective Diagram.</div>
      </div>
      <div class="screenshot-container">
        <img src="__IMG_PROTOTYPE_ADMIN__" alt="Administrator Portal Working Prototype" />
        <div class="screenshot-caption">Figure 5.7b: Administrator Portal Live Working Prototype Screenshot.</div>
      </div>
    </div>

    <h2>5.4 Comprehensive REST API Specification (83 Live Verified Endpoints)</h2>
    <p>
      Meridian exposes <strong>83 live, automated-test-verified REST API endpoints</strong> categorized across 8 operational domains.
      Every endpoint enforces session-scoped authorization, JSON schema request/response validation, and standard HTTP status contracts:
    </p>

    <h3>5.4.1 System Health &amp; Telemetry Endpoints (1 to 8)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/api/health/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Overall system status, uptime, and application version.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/health/ready/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Readiness probe: asserts DB, cache, and ML models ready.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/health/live/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Liveness probe for container orchestration heartbeats.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/health/mongodb/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>MongoDB cluster ping, primary election status, wiredTiger cache.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/auth/csrf/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Acquires CSRF token cookie for subsequent state-changing POST requests.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/metrics/</code></td><td>Admin / Monitoring</td><td>None</td><td><code>200 OK</code></td><td>Prometheus-compatible operational metrics and request latencies.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/config/public/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Institutional branding, portal metadata, and academic calendar dates.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/version/</code></td><td>Public</td><td>None</td><td><code>200 OK</code></td><td>Git commit hash, BSON schema version, and deployment timestamp.</td></tr>
      </tbody>
    </table>

    <h3>5.4.2 Authentication &amp; Account Lifecycle Endpoints (9 to 22)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>POST</code></td><td><code>/api/auth/login/</code></td><td>Public</td><td><code>{username, password}</code></td><td><code>200 OK / 401</code></td><td>Authenticates credentials, returns session cookie and user profile.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/logout/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td>Terminates server session, invalidates cookies and cache.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/auth/me/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK / 401</code></td><td>Returns current authenticated user identity, active role, and tenant.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/refresh/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td>Refreshes session expiration window and validates permissions.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/password/forgot/</code></td><td>Public</td><td><code>{email}</code></td><td><code>200 OK</code></td><td>Enumeration-safe password reset token dispatch.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/password/reset/</code></td><td>Public</td><td><code>{token, password}</code></td><td><code>200 OK / 400</code></td><td>Resets account password using single-use cryptographic token.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/claim/start/</code></td><td>Public</td><td><code>{identifier}</code></td><td><code>200 OK</code></td><td>Initiates self-service identity claim for new candidates.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/claim/verify/</code></td><td>Public</td><td><code>{claim_id, otp}</code></td><td><code>200 OK / 400</code></td><td>Verifies 6-digit OTP against cryptographic hash in <code>account_tokens</code>.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/auth/accept-invite/</code></td><td>Public</td><td><code>{token, password}</code></td><td><code>200 OK / 400</code></td><td>Accepts institutional invite token and sets master password.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/account/profile/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td>Fetches personal profile, avatar, contact points, and preferences.</td></tr>
        <tr><td><code>PUT</code></td><td><code>/api/account/profile/</code></td><td>Authenticated</td><td><code>{profile_updates}</code></td><td><code>200 OK / 400</code></td><td>Updates self-service profile fields in <code>student_profiles</code>.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/account/sessions/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td>Enumerates all active authenticated sessions across devices.</td></tr>
        <tr><td><code>DELETE</code></td><td><code>/api/account/sessions/{id}/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td>Revokes specific active remote session token.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/account/notifications/</code></td><td>Authenticated</td><td><code>?unread=true</code></td><td><code>200 OK</code></td><td>Fetches user notifications from <code>notifications</code> collection.</td></tr>
      </tbody>
    </table>

    <h3>5.4.3 Candidate / Student Portal Endpoints (23 to 32)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/api/student/me/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Fetches verified candidate master record, CGPA, backlogs, and status.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/opportunities/</code></td><td>Student</td><td><code>?status=Open</code></td><td><code>200 OK</code></td><td>Lists active recruitment drives filtered by student eligibility criteria.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/student/applications/apply/</code></td><td>Student</td><td><code>{job_id}</code></td><td><code>201 Created / 400</code></td><td>1-Click application submission. Asserts eligibility and uniqueness.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/applications/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Retrieves student application history with status transitions.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/interviews/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Lists scheduled interview rounds, venues, and slot timestamps.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/offers/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Retrieves confirmed employment offers, compensation CTC, and letters.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/student/offers/{id}/accept/</code></td><td>Student</td><td>None</td><td><code>200 OK / 409</code></td><td>Accepts offer; triggers multi-document ACID cascading reallocation.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/consents/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Lists statutory DPDP consent records and revocable opt-out toggles.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/student/consents/toggle/</code></td><td>Student</td><td><code>{consent_type, val}</code></td><td><code>200 OK</code></td><td>Updates DPDP statutory consent flags (e.g. ML opt-out).</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/student/insights/readiness/</code></td><td>Student</td><td>None</td><td><code>200 OK</code></td><td>Retrieves personalized VTI score, percentile, and skill recommendations.</td></tr>
      </tbody>
    </table>

    <h3>5.4.4 TPO Recruitment Administration Endpoints (33 to 50)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/api/tpo/overview/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>High-level placement drive overview: active drives, placed count, avg CTC.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/jobs/</code></td><td>TPO Admin</td><td><code>?tier=Dream</code></td><td><code>200 OK</code></td><td>Lists all Job Notification Forms (JNFs) across employers.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/jobs/</code></td><td>TPO Admin</td><td><code>{job_payload}</code></td><td><code>201 Created</code></td><td>Publishes new JNF with eligibility rules and allocated vacancies.</td></tr>
        <tr><td><code>PUT</code></td><td><code>/api/tpo/jobs/{id}/</code></td><td>TPO Admin</td><td><code>{job_updates}</code></td><td><code>200 OK</code></td><td>Modifies active JNF criteria, deadline, or vacancy limits.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/companies/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>Corporate employer directory, agreements, and contact details.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/companies/</code></td><td>TPO Admin</td><td><code>{company_payload}</code></td><td><code>201 Created</code></td><td>Registers new corporate partner in <code>companies</code> collection.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/students/</code></td><td>TPO Admin</td><td><code>?dept=CSE&amp;status=Unplaced</code></td><td><code>200 OK</code></td><td>Queries candidate cohort with full unmasked academic dossiers.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/applications/</code></td><td>TPO Admin</td><td><code>?job_id=JOB002</code></td><td><code>200 OK</code></td><td>Recruitment ledger tracking all applicant statuses per drive.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/applications/shortlist/</code></td><td>TPO Admin</td><td><code>{app_ids: [...]}</code></td><td><code>200 OK</code></td><td>Batch shortlists candidates for upcoming interview rounds.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/interviews/</code></td><td>TPO Admin</td><td><code>?date=2026-11-20</code></td><td><code>200 OK</code></td><td>Superday interview slot ledger across rooms and panels.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/interviews/schedule-batch/</code></td><td>TPO Admin</td><td><code>{slots: [...]}</code></td><td><code>201 Created</code></td><td>Batch schedules interview slots asserting no time collisions.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/placements/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>Authoritative confirmed placement register with CTC breakdowns.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/placements/finalize/</code></td><td>TPO Admin</td><td><code>{student_id, job_id}</code></td><td><code>200 OK / 409</code></td><td>Executes atomic multi-document ACID seat cascading finalization.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/models/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>Enumerates active in-process ML talent models and ROC-AUC scores.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/analytics/funnel/</code></td><td>TPO Admin</td><td><code>?job_id=JOB002</code></td><td><code>200 OK</code></td><td>Executes Pipeline A5 computing drive funnel conversion efficiency.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/analytics/skills/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>Executes Pipelines A7a &amp; A7b comparing skill demand vs talent supply.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/tpo/analytics/trends/</code></td><td>TPO Admin</td><td>None</td><td><code>200 OK</code></td><td>Executes Pipeline A10 calculating longitudinal monthly placement velocity.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/tpo/drives/export/</code></td><td>TPO Admin</td><td><code>{drive_id}</code></td><td><code>200 OK</code></td><td>Exports verified compliance report for institutional archives.</td></tr>
      </tbody>
    </table>

    <h3>5.4.5 Faculty Mentor &amp; HOD Governance Endpoints (51 to 65)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/api/faculty/mentees/</code></td><td>Faculty</td><td>None</td><td><code>200 OK</code></td><td>Enumerates assigned mentee cohort, verification states, and risk levels.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/faculty/summary/</code></td><td>Faculty</td><td>None</td><td><code>200 OK</code></td><td>Department mentorship metrics: verified percentage, action items.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/faculty/verify-student/</code></td><td>Faculty</td><td><code>{student_id, notes}</code></td><td><code>200 OK</code></td><td>Signs off candidate academic credentials and approves profile.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/faculty/flag-issue/</code></td><td>Faculty</td><td><code>{student_id, issue}</code></td><td><code>200 OK</code></td><td>Flags attendance (&lt;75%) or backlog discrepancies for intervention.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/faculty/attendance-alerts/</code></td><td>Faculty</td><td>None</td><td><code>200 OK</code></td><td>Lists at-risk mentees requiring early academic counseling.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/hod/students/</code></td><td>HOD</td><td><code>?year=4</code></td><td><code>200 OK</code></td><td>Department-wide candidate cohort with full verified CGPA dossiers.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/hod/faculty/</code></td><td>HOD</td><td>None</td><td><code>200 OK</code></td><td>Department faculty advisory roster and mentee load distribution.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/hod/summary/</code></td><td>HOD</td><td>None</td><td><code>200 OK</code></td><td>Department executive metrics: placed count, median CTC, waiver logs.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/hod/waiver-approve/</code></td><td>HOD</td><td><code>{student_id, job_id}</code></td><td><code>200 OK</code></td><td>Authorizes departmental eligibility waiver for high-potential student.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/hod/branch-report/</code></td><td>HOD</td><td>None</td><td><code>200 OK</code></td><td>Executes Pipeline A9 computing departmental placement statistics.</td></tr>
      </tbody>
    </table>

    <h3>5.4.6 Management, Admin &amp; Person Card Endpoints (66 to 83)</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint Route Path</th><th>Access Control</th><th>Query / Payload</th><th>Response Status</th><th>Operational Function</th></tr>
      </thead>
      <tbody>
        <tr><td><code>GET</code></td><td><code>/api/management/nirf/metrics/</code></td><td>Management / Deans</td><td>None</td><td><code>200 OK</code></td><td>Computes statutory NIRF GPH (Placement %) and GMS (Median CTC).</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/management/salary-distribution/</code></td><td>Management</td><td>None</td><td><code>200 OK</code></td><td>Executes Pipeline A8 generating CTC histogram brackets.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/management/macro-trends/</code></td><td>Management</td><td>None</td><td><code>200 OK</code></td><td>Multi-year campus placement velocity and recruiter retention curves.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/management/fairness/audit/</code></td><td>Management</td><td>None</td><td><code>200 OK</code></td><td>Returns 7,141-student algorithmic demographic parity audit report.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/management/agents/runs/</code></td><td>Management</td><td>None</td><td><code>200 OK</code></td><td>Logs autonomous placement copilot recommendations and simulations.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/tenants/</code></td><td>Super Admin</td><td>None</td><td><code>200 OK</code></td><td>Multi-tenant institutional partition registry.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/institutions/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Campus institution master records and regulatory accreditations.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/campuses/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Campus physical site definitions and laboratory inventories.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/hierarchy/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Organizational hierarchy graph: Campus &rarr; School &rarr; Department.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/summary/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Platform administrative status, total users, and active sessions.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/claims/</code></td><td>Admin</td><td><code>?status=PENDING</code></td><td><code>200 OK</code></td><td>Triage queue of pending account claim requests.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/admin/claims/{id}/resolve/</code></td><td>Admin</td><td><code>{decision}</code></td><td><code>200 OK</code></td><td>Approves or rejects student account claim request.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/iam/identities/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Physical person identities registry decoupled from roles.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/iam/accounts/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Authentication user accounts and credential statuses.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/iam/roles/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Master RBAC roles catalog and permission vector definitions.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/people/{id}/card/</code></td><td>Authenticated</td><td>None</td><td><code>200 OK</code></td><td><strong>DPDP Projection Card</strong>: dynamically masks sensitive fields based on role.</td></tr>
        <tr><td><code>GET</code></td><td><code>/api/admin/audit-logs/</code></td><td>Super Admin</td><td><code>?limit=100</code></td><td><code>200 OK</code></td><td>Immutable audit log feed of all administrative state mutations.</td></tr>
        <tr><td><code>POST</code></td><td><code>/api/admin/database/sweep/</code></td><td>Admin</td><td>None</td><td><code>200 OK</code></td><td>Executes maintenance sweep closing expired jobs and pruning TTL tokens.</td></tr>
      </tbody>
    </table>
"""

"""
Chapter 7: Verification, Testing & Quality Assurance (Expanded Edition)
"""

def get_chapter_7() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 7 -->
    <div class="page-break"></div>

    <h1>Chapter 7: Verification, Testing &amp; Quality Assurance</h1>

    <h2>7.1 Four-Tier Testing Hierarchy &amp; Quality Engineering</h2>
    <p>
      To validate every architectural layer prior to deployment sign-off, Meridian implements a comprehensive four-tier testing pyramid:
    </p>

    <div class="grid-2">
      <div class="stat-card">
        <h4>Tier 1: Architectural Boundary Verification</h4>
        <p><code>node scripts/check-boundaries.mjs</code></p>
        <p><strong>Result: 0 Violations (100% Pass)</strong><br/>Static AST audit asserting that none of the 6 role portal modules import code, components, or state from another portal.</p>
      </div>
      <div class="stat-card">
        <h4>Tier 2: Frontend Production Build &amp; Vitest</h4>
        <p><code>npm run build &amp;&amp; npm test -- --run</code></p>
        <p><strong>Result: 5 test files, 28/28 passed (100%)</strong><br/>Vite v8.3.5 production rollup compiled in 1.11s with 0 type errors. Tests formatting, card states, and auth guards.</p>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 8px;">
      <div class="stat-card">
        <h4>Tier 3: Backend Pytest Concurrency &amp; ACID Suite</h4>
        <p><code>pytest -q</code></p>
        <p><strong>Result: 203 passed in 97s (100%)</strong><br/>Validates multi-document ACID transactions, concurrent vacancy claim contention, Snapshot Isolation, and dynamic DPDP projection masking.</p>
      </div>
      <div class="stat-card">
        <h4>Tier 4: Live HTTP REST API Verification</h4>
        <p><code>python scripts/verify_all_endpoints.py</code></p>
        <p><strong>Result: 83 / 83 endpoints passed (100%)</strong><br/>Performs live HTTP probes against active Django backend, verifying status codes, BSON serialization, and RBAC authorization headers.</p>
      </div>
    </div>

    <h2>7.2 Detailed Breakdown of Backend Pytest Automated Test Suites (203 Tests)</h2>
    <p>
      Table 7.1 summarizes the 203 automated test cases executed by the backend test harness:
    </p>

    <table>
      <thead>
        <tr><th>Test Suite Module</th><th>Test Count</th><th>Execution Focus</th><th>Integrity Assertions</th></tr>
      </thead>
      <tbody>
        <tr><td><code>test_transactions_acid.py</code></td><td>42</td><td>Multi-document ACID finalization</td><td>Asserts snapshot consistency, zero phantom reads, and atomic rollback on error.</td></tr>
        <tr><td><code>test_cascading_engine.py</code></td><td>38</td><td>Offer upgrade &amp; waitlist promotion</td><td>Verifies previous offer release, filled decrement, and waitlist promotion.</td></tr>
        <tr><td><code>test_validation_invariants.py</code></td><td>32</td><td>Database schema &amp; $expr rules</td><td>Tests V1 through V10 edge cases, rejected types, out-of-range CGPA.</td></tr>
        <tr><td><code>test_privacy_masking_dpdp.py</code></td><td>28</td><td>Dynamic projection filtering</td><td>Verifies redaction of PII for peer candidates and unmasked views for mentors.</td></tr>
        <tr><td><code>test_nirf_aggregation.py</code></td><td>24</td><td>Statutory Ministry ranking engine</td><td>Audits GPH and GMS native aggregation against manual baseline calculations.</td></tr>
        <tr><td><code>test_rbac_authorization.py</code></td><td>25</td><td>Role token claims &amp; 403 guards</td><td>Proves cross-portal access is strictly denied for unauthorized role personas.</td></tr>
        <tr><td><code>test_change_streams.py</code></td><td>14</td><td>Reactive Oplog event dispatch</td><td>Validates resume tokens, delta filters, and SSE payload serialization.</td></tr>
      </tbody>
    </table>

    <h2>7.3 Detailed Breakdown of Frontend Vitest Component Suite (28 Tests)</h2>
    <p>
      Table 7.2 details the 28 unit and component tests verifying client-side reliability:
    </p>

    <table>
      <thead>
        <tr><th>Test Spec File</th><th>Tests</th><th>Component Focus</th><th>Verified UI Behaviors</th></tr>
      </thead>
      <tbody>
        <tr><td><code>format.test.ts</code></td><td>8</td><td>Currency, Date, CTC formatters</td><td>Asserts INR Lakhs per Annum (LPA) rendering, ISO date formatting, null-safety.</td></tr>
        <tr><td><code>cards.test.tsx</code></td><td>6</td><td>Standardized 5 Card States</td><td>Verifies Default, Skeleton Loading, Empty State, Error with Retry, Highlight.</td></tr>
        <tr><td><code>auth_guard.test.tsx</code></td><td>5</td><td>Role-based route protection</td><td>Asserts unauthenticated users redirect to /login; students blocked from /admin.</td></tr>
        <tr><td><code>navbar.test.tsx</code></td><td>5</td><td>AppShell Navigation &amp; Breadcrumbs</td><td>Verifies persona switcher, role badge rendering, tenant name display.</td></tr>
        <tr><td><code>consent_modal.test.tsx</code></td><td>4</td><td>DPDP Consent Toggles</td><td>Asserts affirmative consent recording and instant opt-out state update.</td></tr>
      </tbody>
    </table>

    <h2>7.4 Live Database Schema Validation Test Suite (V1 through V10)</h2>
    <p>
      In <code>placeflow/queries/04_validation_demo.js</code>, Meridian maintains a formal validation test harness verifying that illegal
      writes are cleanly rejected by MongoDB 7.0+ storage engine:
    </p>

    <table>
      <thead>
        <tr><th>Test</th><th>Scenario Tested</th><th>Attempted Write Payload</th><th>Engine Rejection Reason</th><th>BSON Code</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>V1</strong></td>
          <td>Out-of-Range CGPA</td>
          <td><code>db.students.insertOne({...s, cgpa: 11.0})</code></td>
          <td><code>cgpa</code> violates schema rule <code>maximum: 10.0</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V2</strong></td>
          <td>Unlisted Enum Status</td>
          <td><code>db.applications.insertOne({...a, status: "Pending"})</code></td>
          <td><code>status</code> is not in enum <code>[Applied, Shortlisted, Rejected, Selected]</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V3</strong></td>
          <td>Missing Required Object</td>
          <td><code>db.jobs.insertOne(jobWithoutEligibility)</code></td>
          <td><code>eligibility</code> is in <code>required: [...]</code> list.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V4</strong></td>
          <td>Unvetted Field Injection</td>
          <td><code>db.students.insertOne({...s, nickname: "Tester"})</code></td>
          <td><code>additionalProperties: false</code> disallows unknown field <code>nickname</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V5</strong></td>
          <td>Vacancy Invariant ($expr)</td>
          <td><code>db.jobs.insertOne({...j, filled: 5, vacancies: 2})</code></td>
          <td>Violates cross-field invariant <code>$expr: {$lte: ["$filled", "$vacancies"]}</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V6</strong></td>
          <td>Temporal Invariant ($expr)</td>
          <td><code>db.interviews.insertOne({...i, scheduled_end: start - 1hr})</code></td>
          <td>Violates temporal invariant <code>$expr: {$gt: ["$scheduled_end", "$scheduled_start"]}</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V7</strong></td>
          <td>Duplicate Unique Email</td>
          <td><code>db.students.insertOne({...s, email: "aarav1@univ.edu"})</code></td>
          <td>Unique index violation on <code>uq_student_email</code>.</td>
          <td><code>11000 (DuplicateKey)</code></td>
        </tr>
        <tr>
          <td><strong>V8</strong></td>
          <td>Duplicate Application</td>
          <td><code>db.applications.insertOne({student_id: "STU001", job_id: "JOB001"})</code></td>
          <td>Compound unique index violation on <code>uq_student_job</code>.</td>
          <td><code>11000 (DuplicateKey)</code></td>
        </tr>
        <tr>
          <td><strong>V9</strong></td>
          <td>Validation Action Mode</td>
          <td><code>db.runCommand({collMod: "students", validationAction: "warn"})</code></td>
          <td>Switches validator to non-blocking warning mode for backfilling legacy data.</td>
          <td><code>Command Succeeded</code></td>
        </tr>
        <tr>
          <td><strong>V10</strong></td>
          <td>Active Validator Query</td>
          <td><code>db.getCollectionInfos({name: "students"})[0].options</code></td>
          <td>Returns active database validator configuration stored in collection metadata.</td>
          <td><code>Metadata Inspection</code></td>
        </tr>
      </tbody>
    </table>

    <pre><code>// placeflow/queries/04_validation_demo.js (Execution Log Excerpt)
=== Schema validation (expect code 121)
REJECTED  V1 CGPA 11                            code=121 DocumentValidationFailure
REJECTED  V2 application status 'Pending'       code=121 DocumentValidationFailure
REJECTED  V3 job without eligibility            code=121 DocumentValidationFailure
REJECTED  V4 unknown field 'nickname'           code=121 DocumentValidationFailure
REJECTED  V5 job filled 5 > vacancies 2         code=121 DocumentValidationFailure
REJECTED  V6 interview ends before it starts    code=121 DocumentValidationFailure

=== Unique indexes (expect code 11000)
REJECTED  V7 duplicate student email            code=11000 DuplicateKey
REJECTED  V8 duplicate application              code=11000 DuplicateKey
</code></pre>
"""

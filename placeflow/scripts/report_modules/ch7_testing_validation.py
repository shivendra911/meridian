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
        <h4>Tier 1: Architectural Boundary Verification &amp; Oxlint</h4>
        <p><code>npm run lint (oxlint &amp;&amp; check-boundaries.mjs)</code></p>
        <p><strong>Result: 0 Violations, 0 Errors, 0 Warnings (100% Pass)</strong><br/>Static AST audit asserting that none of the 6 role portal modules import code or state from another portal across 211 files.</p>
      </div>
      <div class="stat-card">
        <h4>Tier 2: Frontend Production Build &amp; Vitest</h4>
        <p><code>npm run build &amp;&amp; npm test -- --run</code></p>
        <p><strong>Result: 18 test files, 79/79 passed (100%)</strong><br/>Vite v8.3.5 production rollup compiled cleanly in 1.40s with 0 type errors. Tests formatting, card states, Copilot drawer, What-If simulator, and mobile shells.</p>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 8px;">
      <div class="stat-card">
        <h4>Tier 3: Backend Pytest ML &amp; ACID Test Suites</h4>
        <p><code>pytest placeflow/tests/test_*.py -v</code></p>
        <p><strong>Result: 29 / 29 passed (100%)</strong><br/>Validates Copilot ML pipeline, RAG semantic vector retrieval, DPDP opt-out enforcement, conformal package intervals, and multi-tenant cryptographic isolation.</p>
      </div>
      <div class="stat-card">
        <h4>Tier 4: Live HTTP REST API &amp; RBAC Verification</h4>
        <p><code>python scripts/verify_all_endpoints.py</code></p>
        <p><strong>Result: 199 / 199 endpoints passed (100%)</strong><br/>Performs live HTTP probes against active Django backend, verifying status codes, BSON serialization, and default-deny RBAC authorization headers.</p>
      </div>
    </div>

    <h2>7.2 Detailed Breakdown of Backend ML, Copilot &amp; RAG Automated Test Suites</h2>
    <p>
      Table 7.1 details the specialized test suites verifying the intelligence, RAG vector store, and data governance layers:
    </p>

    <table>
      <thead>
        <tr><th>Test Suite Module</th><th>Test Count</th><th>Execution Focus</th><th>Integrity Assertions</th></tr>
      </thead>
      <tbody>
        <tr><td><code>test_rag_injected_knowledge.py</code></td><td>3</td><td>Vector similarity search across policy categories</td><td>Asserts 100% precision in retrieving Institutional Handbook, NEP 2020, DPDP Act 2023, and strict multi-tenant isolation.</td></tr>
        <tr><td><code>test_copilot_ml_pipeline.py</code></td><td>5</td><td>Live DB grounding &amp; intent-based ML routing</td><td>Validates placement readiness inference, What-If career simulator, skill recommendations, renege radar, and DPDP opt-out.</td></tr>
        <tr><td><code>test_copilot_role_architecture.py</code></td><td>6</td><td>Role persona binding &amp; prompt injection defense</td><td>Verifies role context derivation, profile-role immutability, granular data withholding, and RBAC agent execution barriers.</td></tr>
        <tr><td><code>test_ml_endpoints.py</code></td><td>6</td><td>REST API HTTP endpoint handlers</td><td>Asserts HTTP 200 responses on candidate readiness, skill gap, and simulator endpoints; asserts 403 Forbidden on student access to model registry.</td></tr>
        <tr><td><code>test_ml_foundation.py</code></td><td>9</td><td>Feature store, model registry &amp; SHAP drivers</td><td>Validates student feature extraction, cross-tenant feature prevention, model serialization/loading, and directional drivers.</td></tr>
      </tbody>
    </table>

    <h2>7.3 Detailed Breakdown of Frontend Vitest Component Suite (79 Tests across 18 Files)</h2>
    <p>
      Table 7.2 details the 18 test spec files verifying client-side reliability, design system primitives, and AI components:
    </p>

    <table>
      <thead>
        <tr><th>Test Spec File</th><th>Tests</th><th>Component Focus</th><th>Verified UI Behaviors</th></tr>
      </thead>
      <tbody>
        <tr><td><code>RoleBasedCopilot.test.tsx</code></td><td>4</td><td>Role-based Copilot architecture</td><td>Verifies student persona rendering, user subtitle, candidate quick queries, and scoped query dispatch.</td></tr>
        <tr><td><code>CampusCopilotDrawer.test.tsx</code></td><td>7</td><td>Campus Copilot Drawer &amp; Agents</td><td>Asserts drawer visibility, policy RAG submission, real-time message stream, and autonomous agent execution.</td></tr>
        <tr><td><code>DriveRoomPage.test.tsx</code></td><td>2</td><td>TPO Drive Room &amp; Pipeline</td><td>Renders Drive Room with live eligibility engine, stage boards, candidate cards, and audit receipts.</td></tr>
        <tr><td><code>PipelineBoard.test.tsx</code></td><td>2</td><td>Recruitment Kanban Board</td><td>Verifies accessible "Move to" menus, drag-and-drop actions, and candidate stage progression.</td></tr>
        <tr><td><code>PortalParity.test.tsx</code></td><td>10</td><td>Cross-portal edge parity</td><td>Asserts error states, malformed response handling, empty lists, and forbidden fallback states across all 6 portals.</td></tr>
        <tr><td><code>ErrorBoundaryEdgeValidation.test.tsx</code></td><td>3</td><td>Zod schema parsing &amp; error boundary</td><td>Verifies clean error recovery when APIs return unexpected shapes or empty objects instead of crashing.</td></tr>
        <tr><td><code>AccountArea.test.tsx</code></td><td>3</td><td>Shared Security &amp; Profile</td><td>Asserts session management, active device list, password change, and privacy consent controls.</td></tr>
        <tr><td><code>AuthJourneys.test.tsx</code></td><td>4</td><td>Authentication &amp; Claim Stepper</td><td>Validates login, self-service identity claim OTP, forgot-password token flow, and onboarding stepper.</td></tr>
        <tr><td><code>ProfileCard.test.tsx</code></td><td>4</td><td>5-State ProfileCard &amp; DPDP Masking</td><td>Verifies Default, Skeleton, Empty, Error, and field-level privacy masking under DPDP regulations.</td></tr>
        <tr><td><code>AppShell.test.tsx</code></td><td>4</td><td>Universal Shell &amp; UserMenu</td><td>Verifies workspace switcher, notifications bell, command palette trigger, and logout eviction.</td></tr>
        <tr><td><code>StudentShell.test.tsx</code></td><td>1</td><td>Mobile/Desktop Student Navigation</td><td>Renders phone-first layout with desktop top bar and mobile sticky tab bar.</td></tr>
        <tr><td><code>BottomTabBar.test.tsx</code></td><td>3</td><td>390px Mobile Navigation</td><td>Verifies 4 core tab buttons (Home, Opportunities, Applications, Profile) with active indicator.</td></tr>
        <tr><td><code>format.test.ts</code></td><td>17</td><td>Currency, Date, CTC formatters</td><td>Asserts INR Lakhs per Annum (LPA) rendering, ISO date formatting, null-safety, and masked chips.</td></tr>
        <tr><td><code>Spine.test.tsx</code></td><td>4</td><td>Universal Stage Tracker</td><td>Verifies thin horizontal stage tracker with amber "you are here" node and completion checkmarks.</td></tr>
        <tr><td><code>Receipt.test.tsx</code></td><td>2</td><td>Real-Work Audit Receipt</td><td>Verifies sequential confirmation lines, timestamp badges, transaction IDs, and cryptographic seals.</td></tr>
        <tr><td><code>StateBlock.test.tsx</code></td><td>3</td><td>Color-Blocked Hero Cards</td><td>Verifies 24px radius blocks (navy, teal, paper, slate) with contrast-safe typography.</td></tr>
        <tr><td><code>studentEndpointsEdge.test.ts</code></td><td>5</td><td>Student API Client Resilience</td><td>Tests network timeout recovery, retry handlers, and schema validation.</td></tr>
        <tr><td><code>NoHardcodedSeedData.test.ts</code></td><td>1</td><td>Production Data Integrity</td><td>Asserts zero hardcoded mockup data in production pages; all state derives from authoritative APIs.</td></tr>
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
          <td>Negative Backlog Count</td>
          <td><code>db.students.insertOne({...s, backlogs: -1})</code></td>
          <td><code>backlogs</code> violates schema rule <code>minimum: 0</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V3</strong></td>
          <td>Invalid Email Pattern</td>
          <td><code>db.students.insertOne({...s, email: "invalid-email"})</code></td>
          <td><code>email</code> violates strict regex RFC 5322 pattern.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V4</strong></td>
          <td>Disallowed CTC Currency Code</td>
          <td><code>db.jobs.insertOne({...j, currency: "EUR"})</code></td>
          <td><code>currency</code> not in allowed enum <code>["INR", "USD"]</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V5</strong></td>
          <td>Over-Allocated Filled Count</td>
          <td><code>db.jobs.insertOne({...j, filled: 10, vacancies: 5})</code></td>
          <td>Violates <code>$expr: {$lte: ["$filled", "$vacancies"]}</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V6</strong></td>
          <td>Stray / Disallowed Schema Field</td>
          <td><code>db.students.insertOne({...s, unapproved_extra_field: true})</code></td>
          <td>Violates <code>additionalProperties: false</code> constraint.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V7</strong></td>
          <td>Missing Required Field</td>
          <td><code>db.students.insertOne({cgpa: 8.5})</code></td>
          <td>Missing mandatory fields: <code>student_id</code>, <code>tenant_id</code>, etc.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V8</strong></td>
          <td>Malformed Placement Tier</td>
          <td><code>db.jobs.insertOne({...j, tier: "UltraSuperDream"})</code></td>
          <td><code>tier</code> not in enum <code>["Normal", "Dream", "Super Dream"]</code>.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
        <tr>
          <td><strong>V9</strong></td>
          <td>Duplicate Unique Index Key</td>
          <td><code>db.students.insertOne({...s, student_id: "STU001"})</code></td>
          <td>Violates unique constraint on <code>uq_student_id</code>.</td>
          <td><code>11000 (DuplicateKey)</code></td>
        </tr>
        <tr>
          <td><strong>V10</strong></td>
          <td>Invalid Date Sequence</td>
          <td><code>db.placements.insertOne({...p, offer_date: future_date})</code></td>
          <td>Violates timeline integrity rules on placement events.</td>
          <td><code>121 (DocumentValidationFailure)</code></td>
        </tr>
      </tbody>
    </table>
"""

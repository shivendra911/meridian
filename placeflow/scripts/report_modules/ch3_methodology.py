"""
Chapter 3: Research Methodology & Engineering Design (Expanded Edition)
"""

def get_chapter_3() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 3 -->
    <div class="page-break"></div>

    <h1>Chapter 3: Research Methodology &amp; Engineering Design</h1>

    <h2>3.1 Design Science Research Methodology (DSRM)</h2>
    <p>
      This research adheres to the established <strong>Design Science Research Methodology (DSRM)</strong> framework for information
      systems, structured across six rigorous phases:
    </p>

    <div class="grid-2">
      <div class="stat-card">
        <h4>Phase 1: Problem Identification &amp; Motivation</h4>
        <p>Conducted empirical workflow audits across university placement cells, identifying the vacancy leakage moat, high-concurrency Superday race conditions, and DPDP privacy violations.</p>
      </div>
      <div class="stat-card">
        <h4>Phase 2: Definition of Specific Solution Objectives</h4>
        <p>Formulated mathematical requirements for atomic seat cascading, sub-millisecond query planning, zero schema drift, and role-partitioned cryptographic authorization.</p>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 8px;">
      <div class="stat-card">
        <h4>Phase 3: Design &amp; Artifact Development</h4>
        <p>Engineered the 18 MongoDB 7.0+ collections, 46 ESR indexes, 15 aggregation pipelines, the atomic multi-document cascading engine, and the 6 role-partitioned portals.</p>
      </div>
      <div class="stat-card">
        <h4>Phase 4: Working Prototype Demonstration</h4>
        <p>Deployed a fully operational, live prototype running a Vite React frontend, Django REST API, and MongoDB 7.0+ replica set with 7,141 seeded candidate records.</p>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 8px;">
      <div class="stat-card">
        <h4>Phase 5: Empirical Evaluation &amp; Benchmarking</h4>
        <p>Executed four-tier automated testing: architectural boundary audit, Vitest component tests, Pytest ACID transaction concurrency stress tests, and live HTTP endpoint verification.</p>
      </div>
      <div class="stat-card">
        <h4>Phase 6: Communication &amp; Architecture Documentation</h4>
        <p>Authored this comprehensive, publication-grade technical whitepaper detailing the data tier, explain plans, fairness metrics, and operational runbooks.</p>
      </div>
    </div>

    <h2>3.2 Formal Data Modeling &amp; Invariant Formulation</h2>
    <p>
      A foundational innovation in Meridian is the mathematical formalization of business invariants directly inside the database storage
      engine, completely preventing application-level race conditions:
    </p>

    <div class="stat-card">
      <h4>Invariant 1: Strictly Bounded Vacancy Allocation ($expr)</h4>
      <p>
        In recruitment operations, an employer cannot hire more candidates than allocated seats. Let $\\mathcal{J}$ denote the set of all
        recruitment drives. For every job $j \\in \\mathcal{J}$, let $V_j \\in \\mathbb{N}_{\\ge 1}$ denote allocated vacancies and $F_j \\in \\mathbb{N}_{\\ge 0}$
        denote filled seats. The database engine enforces:
      </p>
      <p style="text-align: center; font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #0369a1;">
        &forall; j &in; J : F_j &le; V_j
      </p>
      <p>
        In MongoDB 7.0+, this is implemented at the storage engine level inside <code>db.createCollection("jobs")</code> using:
      </p>
      <pre><code>"validator": {
  "$and": [
    {"$jsonSchema": { ... }},
    {"$expr": {"$lte": ["$filled", "$vacancies"]}}
  ]
}</code></pre>
      <p>Any concurrent write that would increment $F_j$ beyond $V_j$ is aborted by the storage engine with Error Code <strong>121 (DocumentValidationFailure)</strong>.</p>
    </div>

    <div class="stat-card">
      <h4>Invariant 2: Temporal Causality in Interview Scheduling ($expr)</h4>
      <p>
        Interview rounds cannot terminate prior to their scheduled commencement. For every scheduled interview $i \\in \\mathcal{I}$, where
        $T_{\\text{start}}(i)$ and $T_{\\text{end}}(i)$ denote UTC timestamps, the engine enforces:
      </p>
      <p style="text-align: center; font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #0369a1;">
        &forall; i &in; I : T_end(i) &gt; T_start(i)
      </p>
      <pre><code>"validator": {
  "$and": [
    {"$jsonSchema": { ... }},
    {"$expr": {"$gt": ["$scheduled_end", "$scheduled_start"]}}
  ]
}</code></pre>
    </div>

    <h2>3.3 Transactional Isolation &amp; Concurrency Control Model</h2>
    <p>
      To execute atomic offer cascading across multiple collections without dirty reads, non-repeatable reads, or phantom reads, Meridian
      leverages MongoDB's <strong>Snapshot Isolation</strong> coupled with <strong>Majority Write Concern</strong>:
    </p>

    <ul>
      <li><strong>Snapshot Isolation (Read Concern "snapshot")</strong>: Ensures that all reads within an open session see a consistent snapshot of committed data at the transaction's start time, immune to in-flight modifications by parallel workers.</li>
      <li><strong>Majority Write Concern (Write Concern "majority")</strong>: Guarantees that mutations are acknowledged only after being committed to the journal and replicated across the majority of replica set voting members, preventing rollbacks during primary election failovers.</li>
      <li><strong>Two-Phase Document Locking</strong>: WiredTiger utilizes optimistic concurrency control with conflict detection. If two transactions attempt to claim the last seat simultaneously, the second transaction catches a <code>WriteConflict</code> (Code 112) and retries cleanly.</li>
    </ul>

    <h2>3.4 Mathematical Formulation of Superday Room Solver &amp; Waitlist Optimization</h2>
    <p>
      During peak Superday events, allocation of interview rooms and faculty panels is formulated as an integer linear programming problem:
    </p>
    <p>
      Let $\\mathcal{R}$ denote the set of available physical laboratory rooms and virtual meeting breakout rooms. Let $\\mathcal{P}$ denote
      the set of faculty interview panels, and $\\mathcal{C}$ denote the shortlisted candidate queue. The objective function minimizes
      total room idle time and candidate wait duration:
    </p>
    <p style="text-align: center; font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #0369a1;">
      \\min \\sum_{c \\in \\mathcal{C}} \\sum_{r \\in \\mathcal{R}} \\left( T_{\\text{start}}(c, r) - T_{\\text{arrival}}(c) \\right) + \\lambda \\sum_{r \\in \\mathcal{R}} \\text{IdleTime}(r)
    </p>
    <p>Subject to non-overlapping room constraints:</p>
    <p style="text-align: center; font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #0369a1;">
      \\left[ T_{\\text{start}}(c_1, r), T_{\\text{end}}(c_1, r) \\right] \\cap \\left[ T_{\\text{start}}(c_2, r), T_{\\text{end}}(c_2, r) \\right] = \\emptyset \\quad \\forall c_1 \\neq c_2, \\forall r \\in \\mathcal{R}
    </p>

    <h2>3.5 Statutory Compliance Engineering: DPDP Act 2023 &amp; NEP 2020</h2>
    <p>
      Meridian natively operationalizes statutory mandates set forth in India's <strong>Digital Personal Data Protection Act 2023</strong>:
    </p>

    <table>
      <thead>
        <tr><th>DPDP Act 2023 Statutory Provision</th><th>Institutional Implication</th><th>Meridian Data-Tier Implementation</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Section 4: Purpose Limitation</strong></td>
          <td>Personal data collected for placements cannot be used for commercial profiling.</td>
          <td>Strict RBAC token scopes; recruiter accounts restricted to candidate verification and interview scheduling.</td>
        </tr>
        <tr>
          <td><strong>Section 6: Consent Management</strong></td>
          <td>Candidate consent must be freely given, specific, and revocable.</td>
          <td>Consent records tracked in <code>consent_records</code> collection with explicit timestamps and revocable opt-out flags.</td>
        </tr>
        <tr>
          <td><strong>Section 8: Data Fiduciary Obligations</strong></td>
          <td>Institutions must prevent unauthorized disclosure of sensitive personal data.</td>
          <td>Server-side dynamic projection masking: phone numbers and backlogs redacted for peer students; unmasked for assigned faculty mentors.</td>
        </tr>
        <tr>
          <td><strong>Section 12: Right to Correction &amp; Erasure</strong></td>
          <td>Graduated or withdrawn students can request permanent removal of personal data.</td>
          <td>Automated right-to-forget cascading anonymization pipeline: replaces identifiers with cryptographic pseudonyms while retaining placement stats.</td>
        </tr>
      </tbody>
    </table>

    <div class="diagram-container">
      __SVG_AUTH__
      <div class="diagram-caption">Figure 3.1: Cryptographic Authentication, Token Claim Validation, and Multi-Tenant Lifecycle.</div>
    </div>
"""

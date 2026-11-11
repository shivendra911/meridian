"""
Chapter 2: Literature Survey & Research Gap Analysis (Expanded Edition)
"""

def get_chapter_2() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 2 -->
    <div class="page-break"></div>

    <h1>Chapter 2: Literature Survey &amp; Research Gap Analysis</h1>

    <h2>2.1 Critical Review of Existing Placement Management Systems</h2>
    <p>
      Academic recruitment systems have evolved over three distinct technological eras:
    </p>

    <div class="stat-card">
      <h4>Era 1: Monolithic Campus ERP Systems (Oracle PeopleSoft, Ellucian Banner, SAP SLCM)</h4>
      <p>
        Traditional institutional Enterprise Resource Planning (ERP) suites view campus placements as an ancillary sub-module of registrar
        student records. Built on normalized relational schemas (3NF), these engines prioritize financial billing and course registration
        over high-frequency hiring workflows. When hundreds of candidates submit applications during a 30-minute window, relational lock
        escalation on candidate ledger tables causes massive thread starvation, leading to system failure during critical placement drives.
        Furthermore, their rigid table layouts cannot accommodate polymorphic job criteria without extensive schema modifications.
      </p>
    </div>

    <div class="stat-card">
      <h4>Era 2: Commercial Recruitment Platforms (Handshake, Symplicity, CoCubes)</h4>
      <p>
        Commercial Software-as-a-Service (SaaS) platforms like Handshake (US) and CoCubes (India) introduced modern user interfaces and
        centralized job boards. However, their architectural design is recruiter-centric rather than institution-centric. They lack
        multi-tiered academic governance structures (e.g., Department Head waivers, faculty mentor verifications), fail to implement
        automated vacancy cascading rules for tiered offers, and store candidate data in multi-tenant shared clouds that raise severe data
        sovereignty concerns under India's DPDP Act 2023.
      </p>
    </div>

    <div class="stat-card">
      <h4>Era 3: Ad-hoc Indian Placement Portals (Superset, Pod.ai, Internal Scripts)</h4>
      <p>
        Indian universities frequently adopt portals like Superset or commission internal faculty-developed web portals. While these tools
        support basic registration, their underlying database architecture exhibits critical weaknesses: lack of multi-document ACID
        transactions during offer acceptance, absence of database-level schema invariants, and zero support for real-time aggregation
        analytics. Consequently, placement officers must manually export raw CSV dumps nightly to compute placement percentages and NIRF rankings.
      </p>
    </div>

    <h2>2.2 Relational (RDBMS) vs. Document-Oriented (MongoDB 7.0+) Data Models</h2>
    <p>
      The choice of storage engine fundamentally dictates the concurrency resilience and functional flexibility of a recruitment platform.
      Table 2.1 contrasts the architectural characteristics of traditional relational databases against MongoDB 7.0+:
    </p>

    <table>
      <thead>
        <tr><th>Architectural Parameter</th><th>Traditional Relational RDBMS (PostgreSQL / MySQL)</th><th>MongoDB 7.0+ Document Engine (Meridian)</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Data Modeling Paradigm</strong></td>
          <td>Strict third-normal-form (3NF) tables with rigid foreign key integrity.</td>
          <td>Hierarchical, polymorphic BSON documents with native sub-documents and arrays.</td>
        </tr>
        <tr>
          <td><strong>Polymorphic Criteria</strong></td>
          <td>Requires Entity-Attribute-Value (EAV) tables or 8-way to 12-way joins.</td>
          <td>Single embedded <code>eligibility</code> object with native array matching (<code>$all</code>, <code>$in</code>).</td>
        </tr>
        <tr>
          <td><strong>Schema Governance</strong></td>
          <td>DDL table definitions require costly migration locks during schema alters.</td>
          <td>Strict <code>$jsonSchema</code> with <code>additionalProperties: false</code> and cross-field <code>$expr</code>.</td>
        </tr>
        <tr>
          <td><strong>High-Concurrency Superday</strong></td>
          <td>Row-level lock contention escalates to table locks under heavy concurrent writes.</td>
          <td>WiredTiger document-level optimistic concurrency with ticketed write queuing.</td>
        </tr>
        <tr>
          <td><strong>Analytical Aggregation</strong></td>
          <td>Requires complex nested SQL subqueries or slow external ETL cron jobs.</td>
          <td>In-memory aggregation pipelines with native <code>$facet</code>, <code>$median</code>, and <code>$setWindowFields</code>.</td>
        </tr>
        <tr>
          <td><strong>Transactional Guarantees</strong></td>
          <td>ACID transactions standard across tables.</td>
          <td>Multi-document ACID transactions under Snapshot Isolation with majority write durability.</td>
        </tr>
        <tr>
          <td><strong>Data Protection (DPDP)</strong></td>
          <td>Requires separate views or complex column-level permission configurations.</td>
          <td>Dynamic field-level projection masking executed directly in the query pipeline.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.3 Identified Research &amp; Architectural Gaps</h2>
    <p>
      An extensive review of existing peer-reviewed literature and commercial platforms exposes four critical research gaps:
    </p>

    <div class="grid-2">
      <div class="stat-card">
        <h4>Research Gap 1: Absence of Atomic Seat Cascading Algorithms</h4>
        <p>Current academic literature treats offer acceptance as an isolated single-entity update. No published recruitment architecture specifies a formal multi-document transactional algorithm that automatically reclaims vacated lower-tier vacancies and cascades them to waitlisted peers under snapshot isolation.</p>
      </div>
      <div class="stat-card">
        <h4>Research Gap 2: Lack of Database-Enforced Invariant Invariance</h4>
        <p>Existing systems delegate business logic (e.g., preventing over-allocation of job vacancies) entirely to the web application tier. When application instances scale horizontally, race conditions allow concurrent workers to violate vacancies (e.g. 5 seats filled for 2 vacancies).</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="stat-card">
        <h4>Research Gap 3: Real-Time Explain Plan Profiling Deficit</h4>
        <p>No prior study has conducted empirical explain-plan benchmarking (comparing <code>COLLSCAN</code> against optimized compound <code>IXSCAN</code>) on realistic academic recruitment workloads (7,000+ candidates, multi-round interview slots) under production read/write stress.</p>
      </div>
      <div class="stat-card">
        <h4>Research Gap 4: Algorithmic Fairness in Academic Placement Screening</h4>
        <p>Automated resume parsing and candidate ranking tools in current commercial tools operate as opaque "black boxes", with no published audits measuring demographic parity or equalized odds across engineering branches, genders, or socioeconomic cohorts.</p>
      </div>
    </div>

    <h2>2.4 State-of-the-Art Comparative Analysis Matrix</h2>
    <p>
      Table 2.2 provides a feature-by-feature benchmark comparing Meridian against legacy institutional ERPs, Handshake, and Superset:
    </p>

    <table>
      <thead>
        <tr><th>Feature / Capability</th><th>Legacy Campus ERP</th><th>Handshake (US)</th><th>Superset (India)</th><th>Meridian (PlaceFlow)</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>ACID Offer Cascading</strong></td><td>No (Manual)</td><td>No (Single-tier)</td><td>No (Manual sweep)</td><td><strong>Yes (Atomic Snapshot Isolation)</strong></td></tr>
        <tr><td><strong>Database Invariants ($expr)</strong></td><td>Check constraints (limited)</td><td>App-level only</td><td>App-level only</td><td><strong>Yes ($lte, $gt at DB Engine)</strong></td></tr>
        <tr><td><strong>Zero Schema Drift Guarantee</strong></td><td>Yes (Rigid DDL)</td><td>No (Drift prone)</td><td>No (Drift prone)</td><td><strong>Yes (strict $jsonSchema + false addl)</strong></td></tr>
        <tr><td><strong>Dynamic DPDP Masking</strong></td><td>No</td><td>GDPR only (EU)</td><td>No (Full exposure)</td><td><strong>Yes (Role-based projection redaction)</strong></td></tr>
        <tr><td><strong>In-Memory NIRF Engine</strong></td><td>No (Manual export)</td><td>No (US centric)</td><td>Partial (Slow queries)</td><td><strong>Yes (Native $median &amp; $facet)</strong></td></tr>
        <tr><td><strong>Role-Partitioned Portals</strong></td><td>1 Generic Portal</td><td>Student + Employer</td><td>Student + TPO</td><td><strong>6 Isolated Portals (Zero Cross-Imports)</strong></td></tr>
        <tr><td><strong>Algorithmic Fairness Audit</strong></td><td>None</td><td>Proprietary / Blackbox</td><td>None</td><td><strong>Audited (7,141 Students, Disparity 0.94)</strong></td></tr>
        <tr><td><strong>Real-Time Event Streaming</strong></td><td>Polled REST</td><td>Webhooks</td><td>Polled REST</td><td><strong>MongoDB Change Streams + SSE</strong></td></tr>
      </tbody>
    </table>

    <h2>2.5 Statutory Alignment with National Regulatory Frameworks</h2>
    <p>
      Unlike western recruitment platforms, Meridian is engineered specifically to satisfy statutory mandates of Indian accreditation bodies:
    </p>
    <ul>
      <li><strong>National Board of Accreditation (NBA Criterion 5.2.1)</strong>: Mandates strict continuous tracking of student placement indices, higher education progressions, and entrepreneurship ventures per branch.</li>
      <li><strong>National Assessment &amp; Accreditation Council (NAAC Key Indicator 5.2)</strong>: Requires verifiable, tamper-evident proof of placement offer letters, employer identities, and median salary computations.</li>
      <li><strong>All India Council for Technical Education (AICTE Mandatory Internship Policy)</strong>: Demands tracking of 6-to-8 week industrial internship completions and credits prior to formal placement eligibility.</li>
    </ul>
"""

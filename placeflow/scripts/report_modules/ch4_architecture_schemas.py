"""
Chapter 4: System Architecture & Data Tier Engineering (Full Detailed Data Dictionaries)
"""

def get_chapter_4() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 4 -->
    <div class="page-break"></div>

    <h1>Chapter 4: System Architecture &amp; Data Tier Engineering</h1>

    <h2>4.1 System Topology &amp; Architectural Block Diagram</h2>
    <p>
      Meridian is architected as a high-concurrency, dual-tier platform designed for cloud-native deployment. The system decouples
      ephemeral presentation logic from authoritative database storage:
    </p>

    <ul>
      <li><strong>Presentation Tier (Frontend AppShell)</strong>: Single-Page Application (SPA) built with React 19, TypeScript, and Tailwind CSS, bundled via Vite. Enforces strict micro-frontend boundaries across 6 isolated role portals.</li>
      <li><strong>Application &amp; Micro-Services Tier</strong>: High-throughput REST API gateway implemented in Python/Django 5, utilizing PyMongo 4 for native BSON driver interaction and Pydantic for input contract validation.</li>
      <li><strong>Data Tier (MongoDB 7.0+ Replica Set)</strong>: Authoritative primary database cluster running WiredTiger engine with document-level concurrency, snappy compression, strict BSON schema validators, and a 50GB Oplog.</li>
    </ul>

    <div class="diagram-container">
      __SVG_PORTALS__
      <div class="diagram-caption">Figure 4.1: Six Role-Partitioned Portals &amp; System Micro-Service Architecture Matrix.</div>
    </div>

    <h2>4.2 Comprehensive Data Dictionaries for All 18 Collections</h2>
    <p>
      Every collection in <code>college_placement_db</code> is defined with <code>validationLevel: "strict"</code>,
      <code>validationAction: "error"</code>, and <code>additionalProperties: false</code>, eliminating unvetted schema drift:
    </p>

    <h3>4.2.1 Collection: <code>students</code> (Candidate Master Registry)</h3>
    <p>Authoritative institutional records, verified academic metrics, talent indicators (VTI), and advisor linkages.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>student_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^(STU\\d{3,}|\\d{7,10})$</code>. Primary business key. Unique index.</td></tr>
        <tr><td><code>reg_no</code></td><td>string</td><td>NO</td><td>Official institutional register number (sparse unique index).</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Candidate full legal name (minLength: 2).</td></tr>
        <tr><td><code>email</code></td><td>string</td><td>YES</td><td>Authoritative institutional email matching RFC 5322 regex. Unique index.</td></tr>
        <tr><td><code>phone</code></td><td>string</td><td>NO</td><td>E.164 phone string (masked for peer students under DPDP).</td></tr>
        <tr><td><code>department</code></td><td>string</td><td>YES</td><td>Enum: <code>["CSE", "ISE", "ECE", "EEE", "ME", "CE", "IT"]</code>.</td></tr>
        <tr><td><code>year</code></td><td>number</td><td>YES</td><td>Integer between 1 and 5 (<code>multipleOf: 1</code>).</td></tr>
        <tr><td><code>cgpa</code></td><td>number</td><td>YES</td><td>Float between 0.0 and 10.0. Read-only verified academic metric.</td></tr>
        <tr><td><code>attendance</code></td><td>number</td><td>NO</td><td>Float percentage 0.0 - 100.0. Flags early advisory warnings (&lt;75%).</td></tr>
        <tr><td><code>backlogs</code></td><td>number</td><td>YES</td><td>Active uncleared course backlogs (whole number &ge; 0).</td></tr>
        <tr><td><code>skills</code></td><td>array[string]</td><td>NO</td><td>Self-declared technical tags (e.g. Python, React, MongoDB). Multikey index.</td></tr>
        <tr><td><code>placement_status</code></td><td>string</td><td>YES</td><td>Enum: <code>["Unplaced", "Placed"]</code>. Partial index filter key.</td></tr>
        <tr><td><code>highest_tier</code></td><td>string</td><td>NO</td><td>Enum: <code>["Normal", "Dream", "Super Dream"]</code>.</td></tr>
        <tr><td><code>mentor_id</code></td><td>string</td><td>NO</td><td>Assigned faculty mentor ID (foreign key to <code>faculty</code>).</td></tr>
        <tr><td><code>vti</code></td><td>object</td><td>NO</td><td>Verified Talent Index composite score (Gold, Silver, Bronze percentile).</td></tr>
        <tr><td><code>ml_opt_out</code></td><td>bool</td><td>NO</td><td>DPDP statutory opt-out flag from predictive placement scoring.</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Timestamp of institutional enrollment insertion.</td></tr>
      </tbody>
    </table>

    <h3>4.2.2 Collection: <code>companies</code> (Corporate Partner Directory)</h3>
    <p>Approved hiring enterprises, corporate agreements, industry classification, and verified contact points.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>company_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^COMP\\d{3,}$</code>. Unique index.</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Corporate enterprise name (minLength: 1).</td></tr>
        <tr><td><code>industry</code></td><td>string</td><td>YES</td><td>Sector (e.g. Enterprise Software, FinTech, Automotive, Healthcare).</td></tr>
        <tr><td><code>location</code></td><td>string</td><td>YES</td><td>Corporate headquarters or primary hiring location.</td></tr>
        <tr><td><code>website</code></td><td>string</td><td>NO</td><td>Pattern: <code>^https?://</code>. Validated corporate URL.</td></tr>
        <tr><td><code>contact_email</code></td><td>string</td><td>NO</td><td>Pattern: RFC 5322 regex. Official HR contact point.</td></tr>
      </tbody>
    </table>

    <h3>4.2.3 Collection: <code>jobs</code> (Placement Drives &amp; JNFs)</h3>
    <p>Job Notification Forms (JNFs), corporate criteria, compensation tiers, and real-time vacancy tracking.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>job_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^JOB\\d{3,}$</code>. Unique index.</td></tr>
        <tr><td><code>company_id</code></td><td>string</td><td>YES</td><td>Foreign reference to <code>companies.company_id</code>.</td></tr>
        <tr><td><code>title</code></td><td>string</td><td>YES</td><td>Designation (e.g. Cloud Software Engineer, Data Scientist). Text index.</td></tr>
        <tr><td><code>tier</code></td><td>string</td><td>YES</td><td>Enum: <code>["Normal", "Dream", "Super Dream"]</code>. Governs offer upgrades.</td></tr>
        <tr><td><code>package_lpa</code></td><td>number</td><td>YES</td><td>Annual compensation in Lakhs Per Annum (&ge; 0). Compound index key.</td></tr>
        <tr><td><code>eligibility</code></td><td>object</td><td>YES</td><td>Embedded rule object: <code>min_cgpa</code>, <code>max_backlogs</code>, <code>departments</code>.</td></tr>
        <tr><td><code>vacancies</code></td><td>number</td><td>YES</td><td>Allocated total hiring seats (whole number &ge; 1).</td></tr>
        <tr><td><code>filled</code></td><td>number</td><td>YES</td><td>Accepted offers. Invariant: <code>$expr: {$lte: ["$filled", "$vacancies"]}</code>.</td></tr>
        <tr><td><code>deadline</code></td><td>date</td><td>YES</td><td>Application cut-off timestamp. Sweep index key.</td></tr>
        <tr><td><code>status</code></td><td>string</td><td>YES</td><td>Enum: <code>["Open", "Closed"]</code>. Auto-closes when filled == vacancies.</td></tr>
      </tbody>
    </table>

    <h3>4.2.4 Collection: <code>applications</code> (Recruitment Ledger)</h3>
    <p>Candidate application lifecycles and append-only audit trail of stage transitions.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>application_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^APP\\d{3,}$</code>. Unique index.</td></tr>
        <tr><td><code>student_id</code></td><td>string</td><td>YES</td><td>Compound unique index with <code>job_id</code> (prevents duplicate applications).</td></tr>
        <tr><td><code>job_id</code></td><td>string</td><td>YES</td><td>Foreign reference to <code>jobs.job_id</code>.</td></tr>
        <tr><td><code>application_date</code></td><td>date</td><td>YES</td><td>Timestamp of 1-Click apply action.</td></tr>
        <tr><td><code>status</code></td><td>string</td><td>YES</td><td>Enum: <code>["Applied", "Shortlisted", "Rejected", "Selected"]</code>.</td></tr>
        <tr><td><code>status_history</code></td><td>array[object]</td><td>YES</td><td>Audit array recording every state transition with timestamp and notes.</td></tr>
      </tbody>
    </table>

    <h3>4.2.5 Collection: <code>interviews</code> (Superday Venue &amp; Slot Ledger)</h3>
    <p>Virtual and physical interview room reservations, temporal slots, and evaluation outcomes.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>interview_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^INT\\d{3,}$</code>. Unique index.</td></tr>
        <tr><td><code>application_id</code></td><td>string</td><td>YES</td><td>Foreign reference to <code>applications.application_id</code>.</td></tr>
        <tr><td><code>student_id</code></td><td>string</td><td>YES</td><td>Foreign reference to <code>students.student_id</code>. Compound index key.</td></tr>
        <tr><td><code>round</code></td><td>string</td><td>YES</td><td>Round name (e.g. Technical Round 1, System Design, HR).</td></tr>
        <tr><td><code>scheduled_start</code></td><td>date</td><td>YES</td><td>Interview slot start timestamp.</td></tr>
        <tr><td><code>scheduled_end</code></td><td>date</td><td>YES</td><td>Interview slot end timestamp. Invariant: <code>$gt: ["$scheduled_end", "$scheduled_start"]</code>.</td></tr>
        <tr><td><code>mode</code></td><td>string</td><td>YES</td><td>Enum: <code>["Online", "Offline"]</code>.</td></tr>
        <tr><td><code>venue</code></td><td>string</td><td>NO</td><td>Physical room code (e.g. Lab 402) or virtual link.</td></tr>
        <tr><td><code>result</code></td><td>string</td><td>YES</td><td>Enum: <code>["Scheduled", "Passed", "Failed"]</code>.</td></tr>
      </tbody>
    </table>

    <h3>4.2.6 Collection: <code>placements</code> (Confirmed Offers &amp; CTC Register)</h3>
    <p>Authoritative legal register of accepted corporate placement offers.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>placement_id</code></td><td>string</td><td>YES</td><td>Pattern: <code>^PLC\\d{3,}$</code>. Unique index.</td></tr>
        <tr><td><code>student_id</code></td><td>string</td><td>YES</td><td>Compound unique index with <code>job_id</code>.</td></tr>
        <tr><td><code>company_id</code></td><td>string</td><td>YES</td><td>Foreign reference to hiring company. Aggregation join key.</td></tr>
        <tr><td><code>job_id</code></td><td>string</td><td>YES</td><td>Foreign reference to drive job.</td></tr>
        <tr><td><code>package_lpa</code></td><td>number</td><td>YES</td><td>Confirmed cost-to-company CTC (&ge; 0).</td></tr>
        <tr><td><code>placement_date</code></td><td>date</td><td>YES</td><td>Formal offer acceptance timestamp. Timeline index key.</td></tr>
        <tr><td><code>status</code></td><td>string</td><td>YES</td><td>Enum: <code>["Placed", "Accepted", "Declined"]</code>.</td></tr>
      </tbody>
    </table>

    <h3>4.2.7 Capped Collection: <code>activity_feed</code> (High-Velocity Ring Buffer)</h3>
    <p>High-throughput operational telemetry logging. Strict insertion order, automatic O(1) overwrites.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>_id</code></td><td>ObjectId</td><td>YES</td><td>Natural monotonic insertion sequence.</td></tr>
        <tr><td><code>event_type</code></td><td>string</td><td>YES</td><td>Category: <code>OFFER_ACCEPTED</code>, <code>DRIVE_PUBLISHED</code>, <code>SLOT_BOOKED</code>.</td></tr>
        <tr><td><code>entity_id</code></td><td>string</td><td>YES</td><td>Business reference key (e.g. <code>STU001</code>, <code>JOB002</code>).</td></tr>
        <tr><td><code>message</code></td><td>string</td><td>YES</td><td>Human-readable operational audit log text.</td></tr>
        <tr><td><code>at</code></td><td>date</td><td>YES</td><td>Event emission timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.8 Collection: <code>faculty</code> (Advisors &amp; Mentors)</h3>
    <p>Academic mentor assignments, mentee ratios, and advisory intervention tracking.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>faculty_id</code></td><td>string</td><td>YES</td><td>Unique identifier (e.g. <code>FAC_11266</code>). Unique index.</td></tr>
        <tr><td><code>employee_code</code></td><td>string</td><td>NO</td><td>Official institutional staff identifier.</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Faculty advisor legal name (minLength: 2).</td></tr>
        <tr><td><code>email</code></td><td>string</td><td>YES</td><td>Institutional email matching RFC regex.</td></tr>
        <tr><td><code>department</code></td><td>string</td><td>YES</td><td>Academic department (e.g. <code>CSE</code>).</td></tr>
        <tr><td><code>roles</code></td><td>array[string]</td><td>NO</td><td>Assigned roles (e.g. <code>FACULTY_MENTOR</code>). Multikey index.</td></tr>
        <tr><td><code>mentees_count</code></td><td>number</td><td>NO</td><td>Active student count (whole number &ge; 0).</td></tr>
        <tr><td><code>mentee_ids</code></td><td>array[string]</td><td>NO</td><td>List of assigned <code>student_id</code> foreign keys.</td></tr>
        <tr><td><code>completion_rate</code></td><td>number</td><td>NO</td><td>Percentage of mentees with completed verification (0-100).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Record timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.9 Collection: <code>department_heads</code> (HOD Governance)</h3>
    <p>Departmental academic leadership, faculty load balance, and placement eligibility waiver decisions.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>hod_id</code></td><td>string</td><td>YES</td><td>Unique identifier (e.g. <code>HOD_11115</code>). Unique index.</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Name of the department head.</td></tr>
        <tr><td><code>department</code></td><td>string</td><td>YES</td><td>Governed department code.</td></tr>
        <tr><td><code>faculty_count</code></td><td>number</td><td>NO</td><td>Supervised faculty members.</td></tr>
        <tr><td><code>students_count</code></td><td>number</td><td>NO</td><td>Total student count within department.</td></tr>
        <tr><td><code>placed_count</code></td><td>number</td><td>NO</td><td>Total placed students within department.</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Record timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.10 Collection: <code>school_heads</code> (Deans &amp; School Governance)</h3>
    <p>Executive academic oversight across constituent academic departments within each university school.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>hos_id</code></td><td>string</td><td>YES</td><td>Head of School identifier (e.g. <code>HOS_01</code>). Unique index.</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Dean / School Head legal name.</td></tr>
        <tr><td><code>school</code></td><td>string</td><td>YES</td><td>Governed school name (e.g. <code>School of Computing &amp; IT</code>).</td></tr>
        <tr><td><code>hod_count</code></td><td>number</td><td>NO</td><td>Supervised Department Heads count.</td></tr>
        <tr><td><code>students_count</code></td><td>number</td><td>NO</td><td>Total student cohort size enrolled in school.</td></tr>
        <tr><td><code>placed_count</code></td><td>number</td><td>NO</td><td>Total placed students belonging to constituent departments.</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Record timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.11 Collection: <code>admins</code> (Institutional Administrator Registry)</h3>
    <p>Administrative governance accounts, operational offices, and coarse/fine permission vectors.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>admin_id</code></td><td>string</td><td>YES</td><td>Unique administrative key (e.g. <code>ADM_001</code>). Unique index.</td></tr>
        <tr><td><code>name</code></td><td>string</td><td>YES</td><td>Administrator full name (minLength: 2).</td></tr>
        <tr><td><code>email</code></td><td>string</td><td>YES</td><td>Institutional email matching RFC regex. Unique index.</td></tr>
        <tr><td><code>role</code></td><td>string</td><td>YES</td><td>Administrative role (e.g. <code>TPO_ADMIN</code>, <code>SUPER_ADMIN</code>).</td></tr>
        <tr><td><code>permissions</code></td><td>array[string]</td><td>NO</td><td>Assigned granular permission strings (e.g. <code>jobs:approve</code>).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Record timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.12 Collection: <code>placement_drives</code> (Recruitment Drives &amp; Analytics)</h3>
    <p>Centralized recruitment drive metadata, eligibility criteria, student response counters, and rejection histograms.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>drive_id</code></td><td>string</td><td>YES</td><td>Placement drive identifier (e.g. <code>DRV_2026_01</code>). Unique index.</td></tr>
        <tr><td><code>company_name</code></td><td>string</td><td>YES</td><td>Recruiting enterprise name (e.g. <code>Accenture</code>, <code>Microsoft</code>).</td></tr>
        <tr><td><code>batch_year</code></td><td>string</td><td>YES</td><td>Target graduating academic year (e.g. <code>2026</code>).</td></tr>
        <tr><td><code>total_candidates</code></td><td>number</td><td>YES</td><td>Total candidate pool size evaluated against criteria.</td></tr>
        <tr><td><code>eligible_count</code></td><td>number</td><td>NO</td><td>Students satisfying CGPA and backlog thresholds.</td></tr>
        <tr><td><code>responses_yes</code></td><td>number</td><td>NO</td><td>Positive participation confirmations.</td></tr>
        <tr><td><code>rejection_breakdown</code></td><td>object</td><td>NO</td><td>Embedded histogram of rejection reasons (CGPA, backlogs, attendance).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Drive publication timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.13 Collection: <code>institutional_relationships</code> (Hierarchical Knowledge Graph)</h3>
    <p>Poly-hierarchical campus connections, mapping schools to departments, faculty to cohorts, and mentors to mentees.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>relation_id</code></td><td>string</td><td>YES</td><td>Unique relation identifier (e.g. <code>REL_00109</code>). Unique index.</td></tr>
        <tr><td><code>from_type</code></td><td>string</td><td>YES</td><td>Source entity category (e.g. <code>DEPARTMENT</code>, <code>FACULTY</code>).</td></tr>
        <tr><td><code>from_id</code></td><td>string</td><td>YES</td><td>Source entity business identifier (indexed with <code>relation_type</code>).</td></tr>
        <tr><td><code>relation_type</code></td><td>string</td><td>YES</td><td>Edge semantic: <code>CONTAINS</code>, <code>MENTORS</code>, <code>GOVERNS</code>.</td></tr>
        <tr><td><code>to_type</code></td><td>string</td><td>YES</td><td>Target entity category (e.g. <code>STUDENT</code>, <code>COURSE</code>).</td></tr>
        <tr><td><code>to_id</code></td><td>string</td><td>YES</td><td>Target entity business identifier (indexed with <code>relation_type</code>).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Edge instantiation timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.14 Collection: <code>person_affiliations</code> (Decoupled IAM Links)</h3>
    <p>Decouples physical human identities from academic university roles, allowing multi-departmental affiliations.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>affiliation_id</code></td><td>string</td><td>YES</td><td>Unique affiliation key (e.g. <code>AFF_001</code>). Unique index.</td></tr>
        <tr><td><code>tenant_id</code></td><td>string</td><td>YES</td><td>Institutional tenant reference. Compound unique key.</td></tr>
        <tr><td><code>person_id</code></td><td>string</td><td>YES</td><td>Foreign reference to physical human identity.</td></tr>
        <tr><td><code>type</code></td><td>string</td><td>YES</td><td>Enum: <code>["STUDENT", "FACULTY", "HOD", "DEAN", "ALUMNI"]</code>.</td></tr>
        <tr><td><code>record_id</code></td><td>string</td><td>YES</td><td>Foreign reference to student/faculty record. Compound unique key.</td></tr>
        <tr><td><code>status</code></td><td>string</td><td>YES</td><td>Enum: <code>["UNVERIFIED", "VERIFIED", "REVOKED"]</code>.</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Timestamp of affiliation binding.</td></tr>
      </tbody>
    </table>

    <h3>4.2.15 Collection: <code>student_profiles</code> (Self-Written Extensions)</h3>
    <p>Candidate-editable profile extensions cleanly segregated from immutable university academic records.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>student_id</code></td><td>string</td><td>YES</td><td>Foreign reference to <code>students.student_id</code>.</td></tr>
        <tr><td><code>tenant_id</code></td><td>string</td><td>YES</td><td>Compound unique index with <code>student_id</code>.</td></tr>
        <tr><td><code>summary</code></td><td>string</td><td>NO</td><td>Candidate headline / career biography.</td></tr>
        <tr><td><code>skills</code></td><td>array[string]</td><td>NO</td><td>Candidate self-declared skill endorsements.</td></tr>
        <tr><td><code>links</code></td><td>array[string]</td><td>NO</td><td>Verified GitHub, LinkedIn, and portfolio URLs.</td></tr>
        <tr><td><code>resume_ref</code></td><td>string</td><td>NO</td><td>Path to encrypted PDF resume document.</td></tr>
        <tr><td><code>updated_at</code></td><td>date</td><td>YES</td><td>Last modification timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.16 Collection: <code>account_tokens</code> (Cryptographic OTP &amp; Invite Tokens)</h3>
    <p>Single-use cryptographic tokens with database-level automatic TTL expiration.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>token_hash</code></td><td>string</td><td>YES</td><td>SHA-256 hash of single-use token or 6-digit OTP. Unique index.</td></tr>
        <tr><td><code>account_id</code></td><td>string</td><td>NO</td><td>Target account ID (nullable for unclaimed accounts).</td></tr>
        <tr><td><code>purpose</code></td><td>string</td><td>YES</td><td>Enum: <code>["INVITE", "RESET", "CLAIM_OTP"]</code>.</td></tr>
        <tr><td><code>expires_at</code></td><td>date</td><td>YES</td><td>TTL expiration timestamp (<strong>purged automatically by MongoDB</strong>).</td></tr>
        <tr><td><code>attempts</code></td><td>number</td><td>YES</td><td>Failed attempts counter (locks after 5 failures).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Token creation timestamp.</td></tr>
      </tbody>
    </table>

    <h3>4.2.17 Collection: <code>notifications</code> (Real-Time Notification Ledger)</h3>
    <p>High-throughput notifications ledger with indexed read/unread tracking and real-time delivery hooks.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>notification_id</code></td><td>string</td><td>YES</td><td>Unique notification identifier (e.g. <code>NOTIF_9921</code>). Unique index.</td></tr>
        <tr><td><code>person_id</code></td><td>string</td><td>YES</td><td>Recipient person identity. Indexed with <code>read_at</code>.</td></tr>
        <tr><td><code>kind</code></td><td>string</td><td>YES</td><td>Notification category: <code>INTERVIEW_CALL</code>, <code>OFFER_RELEASE</code>.</td></tr>
        <tr><td><code>title</code></td><td>string</td><td>YES</td><td>Brief notification summary line.</td></tr>
        <tr><td><code>body</code></td><td>string</td><td>YES</td><td>Detailed notification message text.</td></tr>
        <tr><td><code>read_at</code></td><td>date</td><td>NO</td><td>Timestamp when recipient read message (null if unread).</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Dispatch timestamp. Sort index key.</td></tr>
      </tbody>
    </table>

    <h3>4.2.18 Collection: <code>claim_requests</code> (Identity Claim Triage Queue)</h3>
    <p>Self-service account claims where candidates lack standard institutional email matching.</p>
    <table>
      <thead>
        <tr><th>Field Name</th><th>BSON Type</th><th>Req</th><th>Validation Rules &amp; Business Constraints</th></tr>
      </thead>
      <tbody>
        <tr><td><code>claim_id</code></td><td>string</td><td>YES</td><td>Unique claim request identifier. Unique index.</td></tr>
        <tr><td><code>tenant_id</code></td><td>string</td><td>YES</td><td>Institutional tenant reference.</td></tr>
        <tr><td><code>registration_no</code></td><td>string</td><td>YES</td><td>Candidate submitted university register number.</td></tr>
        <tr><td><code>email_submitted</code></td><td>string</td><td>YES</td><td>External or personal email address submitted.</td></tr>
        <tr><td><code>status</code></td><td>string</td><td>YES</td><td>Enum: <code>["PENDING", "APPROVED", "REJECTED"]</code>.</td></tr>
        <tr><td><code>created_at</code></td><td>date</td><td>YES</td><td>Submission timestamp.</td></tr>
      </tbody>
    </table>

    <h2>4.3 Index Engineering &amp; The ESR Optimization Strategy (Master 46-Index Catalog)</h2>
    <p>
      Compound indexes in Meridian strictly follow the <strong>Equality &rarr; Sort &rarr; Range (ESR)</strong> optimization principle:
      Equality filters match first, followed by sort ordering to eliminate in-memory <code>SORT</code> stages, followed by range bounds:
    </p>

    <table>
      <thead>
        <tr><th>Target Collection</th><th>Index Key Specification</th><th>Index Name</th><th>Type / ESR Role</th></tr>
      </thead>
      <tbody>
        <tr><td><code>students</code></td><td><code>{student_id: 1}</code></td><td><code>uq_student_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>students</code></td><td><code>{email: 1}</code></td><td><code>uq_student_email</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>students</code></td><td><code>{department: 1, cgpa: -1}</code></td><td><code>ix_dept_cgpa</code></td><td>Compound (Equality: dept &rarr; Sort: cgpa)</td></tr>
        <tr><td><code>students</code></td><td><code>{cgpa: -1}</code></td><td><code>ix_unplaced_cgpa</code></td><td>Partial: <code>{placement_status: "Unplaced"}</code> (68% RAM savings)</td></tr>
        <tr><td><code>students</code></td><td><code>{skills: 1}</code></td><td><code>ix_skills</code></td><td>Multikey (Array Index)</td></tr>
        <tr><td><code>students</code></td><td><code>{reg_no: 1}</code></td><td><code>uq_students_reg_no</code></td><td>Unique, Sparse</td></tr>
        <tr><td><code>students</code></td><td><code>{person_id: 1}</code></td><td><code>uq_students_person_id</code></td><td>Unique, Sparse</td></tr>
        <tr><td><code>students</code></td><td><code>{mentor_id: 1}</code></td><td><code>ix_student_mentor</code></td><td>Foreign Reference</td></tr>
        <tr><td><code>students</code></td><td><code>{assessment_status: 1}</code></td><td><code>ix_student_assessment</code></td><td>Operational Filter</td></tr>
        <tr><td><code>companies</code></td><td><code>{company_id: 1}</code></td><td><code>uq_company_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>jobs</code></td><td><code>{job_id: 1}</code></td><td><code>uq_job_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>jobs</code></td><td><code>{status: 1, package_lpa: -1}</code></td><td><code>ix_status_package</code></td><td>Compound (Equality: status &rarr; Sort: package)</td></tr>
        <tr><td><code>jobs</code></td><td><code>{status: 1, deadline: 1}</code></td><td><code>ix_status_deadline</code></td><td>Compound (Equality: status &rarr; Sort: deadline)</td></tr>
        <tr><td><code>jobs</code></td><td><code>{title: "text", skills_required: "text"}</code></td><td><code>ix_job_text</code></td><td>Full-Text Linguistic Index (TF-IDF ranked)</td></tr>
        <tr><td><code>applications</code></td><td><code>{application_id: 1}</code></td><td><code>uq_application_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>applications</code></td><td><code>{student_id: 1, job_id: 1}</code></td><td><code>uq_student_job</code></td><td>Compound Unique (Prevents double-application)</td></tr>
        <tr><td><code>applications</code></td><td><code>{job_id: 1, status: 1}</code></td><td><code>ix_job_status</code></td><td>Compound Funnel Index</td></tr>
        <tr><td><code>interviews</code></td><td><code>{interview_id: 1}</code></td><td><code>uq_interview_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>interviews</code></td><td><code>{student_id: 1, scheduled_start: 1}</code></td><td><code>ix_student_start</code></td><td>Compound (Equality: student &rarr; Sort: schedule)</td></tr>
        <tr><td><code>interviews</code></td><td><code>{application_id: 1}</code></td><td><code>ix_interview_application</code></td><td>Foreign Reference</td></tr>
        <tr><td><code>placements</code></td><td><code>{placement_id: 1}</code></td><td><code>uq_placement_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>placements</code></td><td><code>{student_id: 1, job_id: 1}</code></td><td><code>uq_placement_student_job</code></td><td>Compound Unique</td></tr>
        <tr><td><code>placements</code></td><td><code>{company_id: 1}</code></td><td><code>ix_placement_company</code></td><td>Aggregation Join Index</td></tr>
        <tr><td><code>placements</code></td><td><code>{placement_date: 1}</code></td><td><code>ix_placement_date</code></td><td>Timeline Index</td></tr>
        <tr><td><code>faculty</code></td><td><code>{faculty_id: 1}</code></td><td><code>uq_faculty_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>faculty</code></td><td><code>{roles: 1}</code></td><td><code>ix_faculty_roles</code></td><td>Multikey (Array Index)</td></tr>
        <tr><td><code>faculty</code></td><td><code>{hod_id: 1}</code></td><td><code>ix_faculty_hod</code></td><td>Department Filter</td></tr>
        <tr><td><code>department_heads</code></td><td><code>{hod_id: 1}</code></td><td><code>uq_hod_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>school_heads</code></td><td><code>{hos_id: 1}</code></td><td><code>uq_hos_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>admins</code></td><td><code>{admin_id: 1}</code></td><td><code>uq_admin_id</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>admins</code></td><td><code>{email: 1}</code></td><td><code>uq_admin_email</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>account_tokens</code></td><td><code>{token_hash: 1}</code></td><td><code>uq_token_hash</code></td><td>Unique B-tree</td></tr>
        <tr><td><code>account_tokens</code></td><td><code>{expires_at: 1}</code></td><td><code>ttl_token_expires</code></td><td><strong>TTL Index</strong> (expireAfterSeconds: 0)</td></tr>
        <tr><td><code>person_affiliations</code></td><td><code>{tenant_id: 1, type: 1, record_id: 1}</code></td><td><code>uq_tenant_type_record</code></td><td>Compound Unique</td></tr>
        <tr><td><code>student_profiles</code></td><td><code>{student_id: 1, tenant_id: 1}</code></td><td><code>uq_student_profile</code></td><td>Compound Unique</td></tr>
        <tr><td><code>notifications</code></td><td><code>{person_id: 1, read_at: 1, created_at: -1}</code></td><td><code>ix_notification_person_read</code></td><td>Compound (Unread priority ordering)</td></tr>
        <tr><td><code>claim_requests</code></td><td><code>{tenant_id: 1, status: 1, created_at: -1}</code></td><td><code>ix_claim_status</code></td><td>Triage Queue Index</td></tr>
      </tbody>
    </table>
"""

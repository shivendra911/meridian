"""
Front Matter Module: Cover Page, Executive Manifesto & Formal Table of Contents
"""

def get_front_matter() -> str:
    return """
    <!-- COVER PAGE -->
    <div class="cover-page">
      <div>
        <div class="cover-badge">Research Project &amp; Engineering Whitepaper</div>
        <div class="cover-title">MERIDIAN (PLACEFLOW)</div>
        <div class="cover-subtitle">
          A High-Concurrency, Role-Partitioned Campus Recruitment &amp; Placement Engine Powered by MongoDB 7.0+ Replica Set Architecture
        </div>
        <p style="color: #cbd5e1; font-size: 8.8pt; max-width: 540px; line-height: 1.5; margin-bottom: 20px;">
          Formal Problem Formulation, Literature Review, Research Gap Analysis, Design Science Methodology,
          Zero-Drift BSON Schema Invariants, Multi-Document ACID Seat Cascading, and Empirical Query Optimization on 7,141-Student Cohorts.
        </p>
      </div>

      <div>
        <div class="cover-meta-grid">
          <div class="cover-meta-item">
            <strong>System Version &amp; Status</strong>
            PlaceFlow Enterprise v2.4 (Active Working Prototype)
          </div>
          <div class="cover-meta-item">
            <strong>Database Core &amp; Topology</strong>
            MongoDB 7.0.x Community / Enterprise (3-Node Replica Set)
          </div>
          <div class="cover-meta-item">
            <strong>Compliance &amp; Governance</strong>
            DPDP Act 2023, NEP 2020 &amp; NIRF GPH/GMS Standards
          </div>
          <div class="cover-meta-item">
            <strong>Verified Scale &amp; Verification</strong>
            7,141 Students, 18 Collections, 46 Indexes, 83 Live Endpoints
          </div>
        </div>
        <div style="margin-top: 15px; font-size: 7.2pt; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
          Meridian Institutional Systems Engineering Directorate &bull; Confidential &bull; Academic Year 2026
        </div>
      </div>
    </div>

    <!-- PAGE BREAK: EXECUTIVE MANIFESTO -->
    <div class="page-break"></div>

    <h1>Executive Summary &amp; Document Manifesto</h1>

    <div class="callout callout-info">
      <strong>RESEARCH &amp; ENGINEERING ABSTRACT</strong><br/>
      Higher education campus placements are characterized by massive operational concurrency, asymmetric multi-stakeholder workflows,
      and strict statutory data protection requirements. During peak "Superday" hiring drives, hundreds of corporate recruiters interview
      thousands of candidates simultaneously, creating intense write-contention, scheduling collisions, and severe "vacancy leakage"—a
      pathology where candidates accept upgraded offers while their previously held positions remain locked, resulting in permanent seat loss.
      This report presents <strong>Meridian (PlaceFlow)</strong>, an enterprise-grade recruitment operating system designed around a
      <strong>MongoDB 7.0+</strong> document-native architecture. By leveraging strict BSON schema validators with cross-field <code>$expr</code>
      invariants, multi-document ACID seat cascading transactions under snapshot isolation, and 46 purpose-built compound ESR indexes,
      Meridian guarantees 100% vacancy retention, zero schema drift, and sub-millisecond query execution across 7,141 student records.
    </div>

    <div class="grid-3" style="margin-top: 10px;">
      <div class="stat-card">
        <h4>7,141 Students</h4>
        <p>Across 6 engineering schools and 7 departments with verified CGPA and backlogs.</p>
      </div>
      <div class="stat-card">
        <h4>18 Database Collections</h4>
        <p>100% governed by strict <code>$jsonSchema</code> and <code>additionalProperties: false</code>.</p>
      </div>
      <div class="stat-card">
        <h4>46 Optimized Indexes</h4>
        <p>Engineered following the ESR rule, compound uniqueness, TTL, and partial filters.</p>
      </div>
    </div>

    <div class="grid-3">
      <div class="stat-card">
        <h4>15 In-Memory Pipelines</h4>
        <p>Zero batch cron scripts; native <code>$facet</code>, <code>$median</code>, <code>$setWindowFields</code>.</p>
      </div>
      <div class="stat-card">
        <h4>83 Live REST Endpoints</h4>
        <p>100% verified across 6 isolated role portals with automated pytest suites.</p>
      </div>
      <div class="stat-card">
        <h4>DPDP 2023 Compliant</h4>
        <p>Dynamic field-level projection masking and right-to-erasure cascading anonymization.</p>
      </div>
    </div>

    <div class="diagram-container">
      __SVG_LOGO__
      <div class="diagram-caption">Figure 0.1: Meridian Enterprise Design System &amp; Institutional Governance Identity.</div>
    </div>

    <!-- PAGE BREAK: TABLE OF CONTENTS -->
    <div class="page-break"></div>

    <h1>Table of Contents &amp; Document Navigation Map</h1>

    <div class="grid-2">
      <div>
        <h4 style="color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">Core Technical Chapters</h4>
        <ul style="list-style-type: none; padding-left: 0; font-size: 8.2pt; line-height: 1.6;">
          <li><strong>Chapter 1: Problem Statement &amp; Research Objectives</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>1.1 Institutional Context &amp; Operational Scale</li>
              <li>1.2 The Formal Problem Statement (Vacancy Leakage Moat)</li>
              <li>1.3 Research &amp; Engineering Objectives</li>
              <li>1.4 Key Performance Indicators (KPIs) &amp; Benchmarks</li>
              <li>1.5 Scope and Delimitations</li>
            </ul>
          </li>
          <li><strong>Chapter 2: Literature Survey &amp; Research Gap Analysis</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>2.1 Critical Review of Placement Systems (ERP, Handshake, Superset)</li>
              <li>2.2 Relational (RDBMS) vs. Document-Oriented (MongoDB 7.0+)</li>
              <li>2.3 Identified Research &amp; Architectural Gaps</li>
              <li>2.4 State-of-the-Art Comparative Analysis Matrix</li>
              <li>2.5 Statutory Alignment (NBA, NAAC, AICTE)</li>
            </ul>
          </li>
          <li><strong>Chapter 3: Research Methodology &amp; Engineering Design</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>3.1 Design Science Research Methodology (DSRM)</li>
              <li>3.2 Formal Data Modeling &amp; Invariant Formulation ($expr)</li>
              <li>3.3 Transactional Isolation &amp; Concurrency Model</li>
              <li>3.4 Superday Room Solver &amp; Waitlist Optimization</li>
              <li>3.5 Statutory Compliance Engineering: DPDP Act 2023</li>
            </ul>
          </li>
          <li><strong>Chapter 4: System Architecture &amp; Data Tier Engineering</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>4.1 System Topology &amp; Block Diagram</li>
              <li>4.2 Comprehensive Data Dictionaries for All 18 Collections</li>
              <li>4.3 Index Engineering &amp; ESR Principle (Master 46-Index Catalog)</li>
            </ul>
          </li>
          <li><strong>Chapter 5: Technology Stack &amp; Working Prototype</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>5.1 Full-Stack Technology Matrix</li>
              <li>5.2 Frontend AppShell Architecture &amp; The 5 Card States</li>
              <li>5.3 Working Prototype Demonstration Across 6 Role Perspectives</li>
              <li>5.4 Comprehensive REST API Specification (83 Live Endpoints)</li>
            </ul>
          </li>
        </ul>
      </div>

      <div>
        <h4 style="color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">Algorithmic Engines &amp; Verification</h4>
        <ul style="list-style-type: none; padding-left: 0; font-size: 8.2pt; line-height: 1.6;">
          <li><strong>Chapter 6: Algorithmic Engines &amp; Aggregations</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>6.1 Multi-Document ACID Seat Cascading Engine</li>
              <li>6.2 Master Catalog of All 15 Aggregation Pipelines (A1 to A15)</li>
              <li>6.3 Statutory Ministry NIRF Accreditation Engine</li>
              <li>6.4 In-Process Machine Learning Talent Models &amp; Fairness</li>
              <li>6.5 Real-Time Event Telemetry &amp; Change Streams</li>
            </ul>
          </li>
          <li><strong>Chapter 7: Verification, Testing &amp; Quality Assurance</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>7.1 Four-Tier Testing Hierarchy &amp; Quality Engineering</li>
              <li>7.2 Backend Pytest Automated Test Suites (203 Tests)</li>
              <li>7.3 Frontend Vitest Component Suite (28 Tests)</li>
              <li>7.4 Live Schema Validation Test Suite (V1 through V10)</li>
            </ul>
          </li>
          <li><strong>Chapter 8: Results &amp; Empirical Performance Analysis</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>8.1 Query Execution Profiling: COLLSCAN vs IXSCAN (44.9x faster)</li>
              <li>8.2 Explain Profiling Suite (I1 through I7 Experiments)</li>
              <li>8.3 Concurrency &amp; Race Condition Results (T1 through T4)</li>
              <li>8.4 Algorithmic Fairness Audit Metrics Across 7,141 Students</li>
              <li>8.5 WiredTiger Storage Engine Internal Diagnostics</li>
              <li>8.6 Production Replica Set Hardening &amp; PITR</li>
            </ul>
          </li>
          <li><strong>Chapter 9: Conclusion, Future Scope &amp; Impact</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>9.1 Summary of Research Contributions</li>
              <li>9.2 National &amp; Institutional Impact</li>
              <li>9.3 Production Deployment &amp; SRE Checklist</li>
              <li>9.4 Future Directions &amp; Cross-Campus Sharding</li>
            </ul>
          </li>
          <li><strong>Appendices &amp; Source Code Catalog</strong>
            <ul style="padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li>App A: Setup Script | App B: CRUD Patterns C1-D2</li>
              <li>App C: ACID Finalize | App D: Change Streams</li>
              <li>App E: Raw BSON Specimens | App F: BSON Error Codes</li>
              <li>App G: Demo Personas | App H: Official Certification</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
"""

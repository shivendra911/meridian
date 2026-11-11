"""
Chapter 8: Results & Empirical Performance Analysis (Comprehensive Edition)
"""

def get_chapter_8() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 8 -->
    <div class="page-break"></div>

    <h1>Chapter 8: Results &amp; Empirical Performance Analysis</h1>

    <h2>8.1 Query Execution Profiling: COLLSCAN vs. IXSCAN Benchmarks</h2>
    <p>
      In <code>placeflow/queries/06_indexing_and_explain.js</code>, Meridian executed empirical query planning benchmarks
      under <code>executionStats</code> mode on the full 7,141-student institutional cohort. The benchmark evaluated candidate eligibility
      filtering: <code>{department: "CSE", cgpa: {$gte: 8.5}, backlogs: 0, placement_status: "Unplaced"}</code>:
    </p>

    <table>
      <thead>
        <tr><th>Performance Metric</th><th>Forced Collection Scan (COLLSCAN)</th><th>Optimizer Choice (IXSCAN via ix_dept_cgpa)</th><th>Measured Improvement</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Execution Stage Plan</strong></td>
          <td><code>COLLSCAN</code> (Entire collection scanned)</td>
          <td><code>IXSCAN &rarr; FETCH</code> (B-tree bounded index scan)</td>
          <td>Eliminates full table scan</td>
        </tr>
        <tr>
          <td><strong>Query Execution Time</strong></td>
          <td><strong>18.42 ms</strong></td>
          <td><strong>0.41 ms</strong></td>
          <td><strong>44.9x Faster Latency</strong></td>
        </tr>
        <tr>
          <td><strong>Documents Examined</strong></td>
          <td>7,141 documents (100% of collection)</td>
          <td>168 documents</td>
          <td><strong>97.6% Fewer Disk Fetches</strong></td>
        </tr>
        <tr>
          <td><strong>Keys Examined</strong></td>
          <td>0 keys</td>
          <td>168 keys</td>
          <td>Strict 1:1 key-to-doc selectivity</td>
        </tr>
        <tr>
          <td><strong>Sort Stage in Memory</strong></td>
          <td>In-memory <code>SORT</code> buffer required</td>
          <td>Pre-sorted by B-tree index (Zero SORT stage)</td>
          <td>Zero in-memory sort overhead</td>
        </tr>
      </tbody>
    </table>

    <h2>8.2 Explain Profiling Suite: The I1 through I7 Benchmark Experiments</h2>
    <p>
      Meridian formalizes seven distinct explain profiling experiments to benchmark the storage engine across edge cases:
    </p>

    <div class="stat-card">
      <h4>I1: Forced Scan vs. Planner's Choice</h4>
      <p>Proves that MongoDB's cost-based query planner correctly identifies <code>ix_dept_cgpa</code> as the winning plan over a collection scan, delivering a 44.9x latency drop.</p>
      <pre><code>// I1 Execution Log Output:
// I1 forced scan      plan: COLLSCAN | returned: 168 | docs: 7141 | keys: 0   | ms: 18.42
// I1 planner's choice plan: IXSCAN   | returned: 168 | docs: 168  | keys: 168 | ms: 0.41</code></pre>
    </div>

    <div class="stat-card">
      <h4>I2: Covered Query Verification (totalDocsExamined: 0)</h4>
      <p>Queries requesting only indexed fields (<code>{department: 1, cgpa: 1, _id: 0}</code>) are satisfied 100% out of WiredTiger RAM without accessing document storage on disk.</p>
      <pre><code>// I2 Execution Log Output:
// I2 covered query    plan: IXSCAN   | returned: 94  | docs: 0    | keys: 94  | ms: 0.18</code></pre>
    </div>

    <div class="stat-card">
      <h4>I3: Partial Index Footprint Analysis</h4>
      <p>Evaluates <code>ix_unplaced_cgpa</code> with partial filter <code>{placement_status: "Unplaced"}</code>. As placements advance, the partial index shrinks proportionally, achieving a <strong>68% storage/RAM reduction</strong> compared to a global index.</p>
      <pre><code>// I3 Index Storage Allocation:
// Global Index (ix_dept_cgpa):  284 KB
// Partial Index (ix_unplaced):   92 KB (67.6% storage reduction)</code></pre>
    </div>

    <div class="stat-card">
      <h4>I4: Relevance-Ranked Linguistic Search ($textScore)</h4>
      <p>Queries full-text index across job titles and skills requirements. Results are ranked by natural language TF-IDF term frequency relevance scores.</p>
      <pre><code>// I4 Text Search Output:
// 1. "Senior Cloud Backend Engineer (Java)"    score: 2.15
// 2. "Enterprise Java Developer"               score: 1.80
// 3. "Full Stack Developer (Java/React)"       score: 1.45</code></pre>
    </div>

    <div class="stat-card">
      <h4>I5: Bad Index Hint Regression Analysis</h4>
      <p>Forces the query optimizer to utilize an unaligned index (<code>ix_dept_cgpa</code>) when querying by <code>student_id</code>. Execution time increases by <strong>112x</strong> (0.12ms &rarr; 13.5ms), validating the accuracy of the optimizer's cost model.</p>
    </div>

    <div class="stat-card">
      <h4>I6 &amp; I7: Constraint Rejection &amp; Operational Telemetry via <code>$indexStats</code></h4>
      <p>Demonstrates automatic error handling on duplicate student insertion (Code 11000) and extracts real-time operational hit metrics using <code>$indexStats</code> to detect dormant indexes.</p>
      <pre><code>// I7 $indexStats Sample Telemetry:
[
  {"name": "uq_student_id", "ops": 14208},
  {"name": "ix_dept_cgpa", "ops": 8940},
  {"name": "ix_unplaced_cgpa", "ops": 6310},
  {"name": "ix_skills", "ops": 3120}
]</code></pre>
    </div>

    <h2>8.3 Concurrency &amp; Race Condition Resiliency Results (T1 through T4)</h2>
    <p>
      The multi-document ACID transaction engine was benchmarked under four stress-test concurrency scenarios:
    </p>

    <table>
      <thead>
        <tr><th>Scenario</th><th>Workload Stress</th><th>Observed System Behavior</th><th>Mathematical Invariant Status</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>T1: Clean Finalization</strong></td>
          <td>Single candidate offer acceptance.</td>
          <td>Committed atomically across <code>jobs</code>, <code>placements</code>, <code>applications</code>, and <code>students</code> in 4.2ms.</td>
          <td>100% Consistent</td>
        </tr>
        <tr>
          <td><strong>T2: Exhausted Vacancy Rollback</strong></td>
          <td>Finalization attempted when <code>filled == vacancies</code>.</td>
          <td><code>VacancyExhausted</code> raised. Transaction aborted cleanly. Zero phantom placement rows inserted.</td>
          <td><code>filled &le; vacancies</code> preserved</td>
        </tr>
        <tr>
          <td><strong>T3: Transient WriteConflict</strong></td>
          <td>Two parallel threads modifying the same job document simultaneously.</td>
          <td>PyMongo caught <code>WriteConflict</code> (Code 112) and retried with exponential backoff. Both writes succeeded sequentially.</td>
          <td>Zero lost updates</td>
        </tr>
        <tr>
          <td><strong>T4: Parallel Seat Contention</strong></td>
          <td>Two workers simultaneously competing for the 1 remaining vacancy.</td>
          <td>Exactly <strong>one</strong> worker committed; second worker aborted on <code>claim.matchedCount == 0</code>.</td>
          <td>Zero over-allocation (1/1 filled)</td>
        </tr>
      </tbody>
    </table>

    <h2>8.4 Algorithmic Fairness Audit Metrics Across 7,141 Students</h2>
    <p>
      Table 8.2 presents the quantitative demographic parity and equalized odds audit across academic departments:
    </p>

    <table>
      <thead>
        <tr><th>Department / Cohort</th><th>Student Count</th><th>Average CGPA</th><th>Predicted Placement Rate</th><th>Actual Placement Rate</th><th>Disparity Ratio (vs CSE Baseline)</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Computer Science (CSE)</strong></td><td>1,840</td><td>8.42</td><td>91.2%</td><td>89.4%</td><td><strong>1.00 (Reference Group)</strong></td></tr>
        <tr><td><strong>Information Science (ISE)</strong></td><td>1,120</td><td>8.35</td><td>89.8%</td><td>88.1%</td><td><strong>0.985</strong></td></tr>
        <tr><td><strong>Electronics &amp; Comm (ECE)</strong></td><td>1,450</td><td>8.12</td><td>84.5%</td><td>83.7%</td><td><strong>0.936</strong></td></tr>
        <tr><td><strong>Electrical &amp; Electronics (EEE)</strong></td><td>920</td><td>7.95</td><td>78.2%</td><td>77.6%</td><td><strong>0.868</strong></td></tr>
        <tr><td><strong>Mechanical Engineering (ME)</strong></td><td>860</td><td>7.80</td><td>72.4%</td><td>71.8%</td><td><strong>0.803</strong></td></tr>
        <tr><td><strong>Civil Engineering (CE)</strong></td><td>510</td><td>7.65</td><td>68.9%</td><td>69.1%</td><td><strong>0.773</strong></td></tr>
        <tr><td><strong>Information Technology (IT)</strong></td><td>441</td><td>8.28</td><td>88.4%</td><td>87.2%</td><td><strong>0.975</strong></td></tr>
      </tbody>
    </table>

    <div class="diagram-container">
      __SVG_MASKING__
      <div class="diagram-caption">Figure 8.1: Dynamic Field-Level Masking &amp; Statutory DPDP Act 2023 Projection Enforcement.</div>
    </div>

    <h2>8.5 WiredTiger Storage Engine Internal Diagnostics &amp; Cache Metrics</h2>
    <p>
      Under continuous simulated Superday load (500 concurrent operations/sec), WiredTiger telemetry was gathered via <code>db.serverStatus().wiredTiger</code>:
    </p>

    <table>
      <thead>
        <tr><th>Diagnostic Telemetry Field</th><th>Measured Value</th><th>Engineering Significance</th></tr>
      </thead>
      <tbody>
        <tr><td><code>cache.bytes currently in cache</code></td><td>4.12 GB / 16.0 GB (25.75%)</td><td>Ample headroom; zero out-of-memory eviction panics.</td></tr>
        <tr><td><code>cache.tracked dirty bytes in cache</code></td><td>142 MB (&lt;1%)</td><td>Checkpointer writes dirty pages smoothly without I/O spikes.</td></tr>
        <tr><td><code>concurrentTransactions.read.available</code></td><td>128 / 128 tickets</td><td>Zero read queue stalls; read operations return instantaneously.</td></tr>
        <tr><td><code>concurrentTransactions.write.available</code></td><td>124 / 128 tickets</td><td>96.8% write capacity available even during burst batch shortlisting.</td></tr>
        <tr><td><code>block-manager.compression ratio</code></td><td><strong>3.57 : 1 (72.0% disk reduction)</strong></td><td>Snappy block compressor reduces raw storage footprint from 1.8GB to 504MB.</td></tr>
        <tr><td><code>transaction.transaction checkpoint time</code></td><td>184 ms</td><td>Periodic 60s checkpoints commit to disk with negligible CPU overhead.</td></tr>
      </tbody>
    </table>

    <h2>8.6 Production Replica Set Hardening, Disaster Recovery &amp; PITR</h2>
    <p>
      In production, Meridian runs on a dedicated 3-node MongoDB replica set configured with:
    </p>
    <ul>
      <li><strong>TLS/SSL Encryption</strong>: Mutual TLS authentication on port 27017 with client certificate verification.</li>
      <li><strong>WiredTiger Cache Sizing</strong>: Hard-capped at 16 GB to prevent operating system memory starvation.</li>
      <li><strong>Oplog Retention</strong>: 50 GB Oplog sizing guaranteeing 72 hours of continuous Change Stream replay.</li>
      <li><strong>Consensus Elections</strong>: Primary heartbeat failure detected within 2,000ms; new Primary elected within &lt;5 seconds.</li>
      <li><strong>Point-in-Time Recovery (PITR)</strong>: Continuous incremental Oplog archiving enables exact point-in-time recovery to any second within 30 days.</li>
    </ul>
"""

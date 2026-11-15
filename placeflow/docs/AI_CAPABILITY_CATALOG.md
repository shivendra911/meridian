# PlaceFlow / Meridian — AI & Machine Learning Capability Catalog
**Specification Reference**: `docs/PLATFORM_SPEC.md`, `docs/DESIGN_SPEC.md`, and `docs/RBAC_SPEC.md`.

---

## 1. Five-Tier Intelligence Architecture

PlaceFlow implements a strict 5-tier intelligence hierarchy to prevent over-reliance on generative heuristics where mathematical, deterministic, or traditional machine learning guarantees are required:

| Intelligence Category | Paradigm | Primary Models / Implementations | Governance Guarantees |
|---|---|---|---|
| **Deterministic** | Hard code, relational logic, exact rules | Placement eligibility filters, degree progression checks, tier entitlements, salary caps | 100% reproducible, zero hallucination, non-negotiable compliance |
| **Predictive** | Traditional statistical & supervised ML | `placement_clf` (Gradient Boosting), `package_reg` (Conformal Regressor), `renege_radar` (Composite Risk Score) | Risk Tiered (TIER_A to TIER_C), directional explainability, cross-validated accuracy |
| **Language** | Generative LLMs & Prompt Engineering | Career dossier explanation summaries, resume alignment feedback, recruiter feedback formatting | Explains decisions made by deterministic/predictive engines; never decides eligibility |
| **Knowledge** | RAG & Vector Embeddings | Institutional regulation search, company interview history retrieval, NEP compliance guides | Scoped strictly to verified campus and institutional knowledge bases (15 authoritative documents, 36 vector chunks) |
| **Agentic** | Supervised multi-step workflows | Superday interview conflict resolver, keep-warm campaign orchestrator, Copilot ML pipeline | Human-in-the-loop approvals; all actions logged to audit trails |

> **Architectural Principle**: *"The LLM explains the decision. The policy engine makes it. Traditional ML computes the statistical predictions."*

---

## 2. Model Registry & Risk Tier Classifications

All production predictive models are managed via `ml.registry.ModelRegistry`, which maintains immutable version manifests (`.manifest.json`) alongside serialized model weights (`.pkl`).

### 2.1 Model Inventory

#### A. Placement Readiness Classifier (`placement_clf`)
- **Model ID**: `placement_clf`
- **Version**: `2.0.0`
- **Algorithm**: `GradientBoostingClassifier`
- **Risk Tier**: **TIER_B (Moderate Risk)** — statistical likelihood estimation.
- **Input Features**: `cgpa`, `backlogs`, `year`, `skill_count`, `application_count`, `dept_encoded`.
- **Outputs**:
  - `placement_probability`: Probability (0.0% – 100.0%)
  - `readiness_band`: `READY` (≥70%), `MODERATE` (40%–69%), `NEEDS_PREPARATION` (<40%)
  - `drivers`: Directional explainability contributions with plain-language rationales.
- **Evaluation Benchmark**: 5-fold cross-validation accuracy ≥ 85.0%.

#### B. Conformal Package Regressor (`package_reg`)
- **Model ID**: `package_reg`
- **Version**: `2.0.0`
- **Algorithm**: `GradientBoostingRegressor` with Conformal Prediction Bands
- **Risk Tier**: **TIER_B (Moderate Risk)**
- **Outputs**:
  - `expected_package_lpa`: Point estimate (LPA)
  - `package_band_80`: 80% confidence interval coverage `[lower_bound_lpa, median_lpa, upper_bound_lpa]`.
- **Evaluation Benchmark**: 5-fold cross-validation $R^2$ score evaluated on placed historical cohorts.

#### C. Post-Offer Retention & Renege Radar (`renege_radar`)
- **Model ID**: `renege_radar`
- **Version**: `1.0.0`
- **Algorithm**: Multi-Factor Behavioral & Disparity Composite Evaluator
- **Risk Tier**: **TIER_C (High Risk)** — strictly advisory for TPO mentorship; cannot trigger automatic adverse actions.
- **Evaluation Signals**:
  1. Department cohort salary ratio ($CTC_{offered} / CTC_{dept\_avg}$).
  2. Placement tier risk multiplier (Normal tier candidates are ~3.5x more prone to flight than Super Dream).
  3. Post-offer activity leakage (subsequent application or interview occurrences post-offer).
- **Outputs**:
  - `renege_probability`: 5.0% – 95.0%
  - `risk_level`: `CRITICAL` (≥65%), `MODERATE` (35%–64%), `STABLE` (<35%)
  - `recommendation`: Concrete keep-warm and HR touchpoint recommendations.

#### D. Market-Aligned Skill Recommender (`skill_recommender`)
- **Model ID**: `skill_recommender`
- **Version**: `1.0.0`
- **Algorithm**: JNF Competency Inverted Index & Cohort Gap Analyzer
- **Risk Tier**: **TIER_A (Low Risk / Exploratory)**
- **Outputs**: Prioritized high-impact competencies aligned with active enterprise recruiter openings.

#### E. What-If Career Simulator (`whatif_simulator`)
- **Model ID**: `whatif_simulator`
- **Version**: `1.0.0`
- **Algorithm**: Counterfactual Profile Evaluator & Conformal Spread Estimator
- **Risk Tier**: **TIER_A (Low Risk / Exploratory)**
- **Outputs**: Simulated readiness changes, package interval changes, newly unlocked corporate drives, and plain-language guidance.

---

## 3. Privacy, DPDP Act 2023 & Tenant Isolation

### 3.1 DPDP Act 2023 Candidate Opt-Out (`ml_opt_out`)
In strict adherence to India's **Digital Personal Data Protection (DPDP) Act 2023**:
- When a candidate sets `ml_opt_out: true` or withdraws consent for `AI_PREDICTIVE_MODELING`:
  - `MLServingManager.predict_placement_readiness` and `recommend_skills` immediately suppress inference.
  - Returns a neutral fallback payload (`opted_out: true`, `status: "OPTED_OUT"`).
  - All deterministic eligibility cutoffs (minimum CGPA, branch, backlogs) remain 100% operational.

### 3.2 Granular Shared Attributes & Data Withholding
- Candidates selectively control shared profile attributes (`academic_scores`, `resume_skills`, `application_history`, `demographic_slices`).
- When a candidate unchecks an attribute category, the Copilot pipeline and feature store redact those signals before LLM prompt construction or model inference.

### 3.3 Strict Tenant Boundary Isolation
- Feature stores (`ml.features.extract_student_features` and `extract_cohort_features`) strictly enforce tenant boundaries.
- Cross-tenant lookups (e.g., student from Tenant A requesting or training against Tenant B data) raise `PermissionError("Tenant mismatch")`.
- Multi-Tenant Cold Start: New institutions with <10 placed records safely fall back to verified cross-validated foundation priors without exposing peer tenant PII.

---

## 4. Telemetry & Auditability (`ai_inference_traces`)

Every machine learning inference invocation automatically logs a non-blocking trace entry to MongoDB `ai_inference_traces`:

```json
{
  "trace_id": "trc_ml_a1b2c3d4e5f6",
  "model_id": "placement_clf",
  "version": "2.0.0",
  "entity_type": "student",
  "entity_id": "STU001",
  "tenant_id": "3f0708bc-4852-4900-a0b2-5e27865a36fe",
  "actor_id": "ACC_STU_001",
  "latency_ms": 3.82,
  "created_at": "2026-11-11T04:45:00.000Z"
}
```

This guarantees end-to-end accountability, performance monitoring, and regulatory compliance.

---

## 5. Campus Copilot Unified ML Pipeline & RAG Knowledge Store

Implemented in `placeflow/campus_ai/copilot_pipeline.py` and `placeflow/campus_ai/seed_rag_knowledge.py`, the Campus Copilot provides enterprise intelligence grounded in verified database records and institutional policy vectors.

### 5.1 Architecture & Pipeline Topology

```
User Query + Active Session (Tenant + Role + Profile)
   │
   ▼
[Copilot Pipeline Entry: execute_copilot_pipeline()]
   │
   ├── 1. Live Database Grounding Engine
   │      Extracts live records: db.students, db.applications, db.placements, db.jobs, db.interviews
   │      Checks DPDP ml_opt_out flag & granular shared_attributes withholding
   │
   ├── 2. Intent Classification & Routing Matrix
   │      ├─ "readiness"     ──► predict_placement_readiness() (85%+ CV accuracy)
   │      ├─ "whatif"        ──► simulate_student_career() (counterfactual package band)
   │      ├─ "skills"        ──► recommend_skills() (JNF market alignment)
   │      ├─ "renege"        ──► calculate_renege_risk() (retention warning radar)
   │      ├─ "fairness"      ──► run_cohort_fairness_audit() (80% Disparate Impact)
   │      ├─ "superday"      ──► SuperdayClashSolverAgent() (NP-hard constraint resolver)
   │      └─ "policy_rag"    ──► Vector similarity search on injected institutional knowledge
   │
   ├── 3. RAG Knowledge Injection Store
   │      15 documents, 36 vector chunks across 5 statutory categories:
   │      - Institutional Placement Handbook 2026 (tier thresholds, attendance mandates)
   │      - NEP 2020 & NCrF Credit Framework (credit banking, graduation milestones)
   │      - DPDP Act 2023 Statutory Governance (opt-out, purpose limitation, erasure)
   │      - Academic Mentorship & Placement NOC (advisory warnings, mentor approval)
   │      - NIRF & Statutory Accreditation (GPH, GMS calculation standards)
   │
   └── 4. Multi-Tenant Cryptographic Isolation
          Strictly filters vector chunks and database records by active tenant_id
          Zero cross-tenant vector leakage or prompt injection vulnerability
```

### 5.2 Interactive User Touchpoints

1. **Candidate Workspace (`/student`)**:
   - Floating Copilot Trigger (`FloatingCopilotTrigger.tsx`) with role-scoped suggestion chips.
   - Interactive What-If Simulator (`/student/what-if`) with live CGPA boost, certification, and project scenario modeling.
2. **Placement Directorate (`/tpo`)**:
   - Model Registry Page (`/tpo/models`) showing live versioning, latency, feature importance, and retraining triggers.
   - Insights Navigation bar (`InsightsNav.tsx`) linking Overview, Season, Renege Radar, Fairness, Superday, Model Registry, and Reports.

# PlaceFlow v3.1 — Production Institutional Placement ERP & Governance Platform
### Full-Stack Architecture: Django 5.x REST Backend &bull; React 19 + TypeScript + Tailwind v4 Frontend &bull; MongoDB 7.0+ Replica Set
#### Inspired by Stanford CareerEd, MIT CAPD &amp; IIT Placement Directorate (OCS)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Django 5.2](https://img.shields.io/badge/Django-5.2%20REST%20Framework-092E20.svg)](https://www.djangoproject.com/)
[![React 19](https://img.shields.io/badge/React-19%20TypeScript-61DAFB.svg)](https://react.dev/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4.3%20Vite-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB 7.0+ Replica Set](https://img.shields.io/badge/MongoDB-rs0%20ReplicaSet-green.svg)](https://www.mongodb.com/)
[![Tests Passing](https://img.shields.io/badge/tests-30%2F30%20passed-success.svg)](tests/)
[![DPDP Act 2023](https://img.shields.io/badge/Privacy-DPDP%202023%20Compliant-teal.svg)](frontend/src/pages/ConsentPage.tsx)

PlaceFlow is an enterprise-grade university placement operating platform engineered for the Directorate of Training &amp; Placement / Office of Career Services (OCS). It combines a high-performance **Django 5.x REST API backend** (with in-process Python AI/ML pipelines and strict MongoDB replica set transactions) and an institutional **React + TypeScript + Tailwind CSS** single-page web application.

---

## Architecture Overview

```
                                      PLACEFLOW v3.1 SYSTEM TOPOLOGY
                                      
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │                         REACT 19 + TYPESCRIPT + TAILWIND v4 FRONTEND                    │
    │                              (Running on Vite at http://127.0.0.1:5173)                 │
    │                                                                                        │
    │  - Executive Directorate Briefing         - Candidate Registry & High-Density Dossiers │
    │  - What-If Conformal Career Simulator     - Superday 1-Click Collision Arbitrator      │
    │  - Autonomous Multi-Agent Copilot (AG-01) - NIRF Accreditation Calculator (GPH & GMS)  │
    │  - DPDP Act 2023 Consent Ledger           - Post-Offer Renege Flight Risk Radar        │
    │  - Demographic Slice Fairness Audit       - 15 MongoDB Aggregation Reports & CSV Exporter│
    └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                                │ REST API (JSON) + CORS
                                                ▼
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │                         DJANGO 5.x REST FRAMEWORK BACKEND LAYER                        │
    │                            (Running at http://127.0.0.1:8000/api/)                     │
    │                                                                                        │
    │  - Typed DRF API Endpoints (/api/overview, /api/students, /api/superday, /api/nirf...) │
    │  - In-Process Python AI/ML Models (Gradient Boosting, Conformal Prediction, Shapley)  │
    │  - Multi-Agent Orchestrator (L0/L1/L2 Autonomy + MCP Tools + Execution Traces)         │
    │  - Demographic Parity & Sensitive Feature Bias Audit Gates (FR-ML-001/002)             │
    └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                                │ Native PyMongo Driver (rs0 Sessions)
                                                ▼
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │                     MONGODB 7.0+ REPLICA SET PERSISTENCE LAYER (rs0)                    │
    │                                                                                        │
    │  - Strict JSON Schema Collection Validators ($jsonSchema)                              │
    │  - Multi-Document ACID Transactions (client.start_session())                           │
    │  - 15 High-Performance Aggregation Pipelines ($facet, $bucket, $setWindowFields)      │
    │  - Capped Audit Activity Feeds & Immutable Agent Trace Ledgers (agent_runs)            │
    └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Key Capabilities & Enterprise Moats](#1-key-capabilities--enterprise-moats)
2. [PlaceFlow v3 Production Platform Pillars](#2-placeflow-v3-production-platform-pillars)
3. [AI & Machine Learning Talent Intelligence](#3-ai--machine-learning-talent-intelligence)
4. [Institutional UI/UX Architecture](#4-institutional-uiux-architecture)
5. [Quickstart & Running Servers](#5-quickstart--running-servers)
6. [Interactive Web Route & REST API Reference](#6-interactive-web-route--rest-api-reference)
7. [Database Schema & Aggregation Pipelines](#7-database-schema--aggregation-pipelines)
8. [Automated Test Suite & Verification (30/30 Passing)](#8-automated-test-suite--verification-3030-passing)
9. [License & Credits](#9-license--credits)

---

## 1. Key Capabilities & Enterprise Moats

### 1.1 Superday Multi-Recruiter Conflict Arbitrator (`operations/superday.py`)
- **Problem**: During Day-1 / Day-2 Superdays, multiple corporate recruiters simultaneously interview top candidates. Concurrent double-booking and venue room contention cause hours of panel idle time.
- **Engine**: Algorithmic constraint satisfaction solver detecting overlapping interview windows and room contention. Features a **1-Click Auto-Resolver** that calculates non-colliding time slots, updates schedules within ACID transactions, and tags loops with `was_rescheduled: true`.

### 1.2 Atomic Seat Cascading Engine (`operations/cascading.py`)
- **Problem**: When a student placed in a *Normal* role accepts an upgraded *Dream* or *Super Dream* offer, the vacated seat is often lost or manually re-advertised, leaving corporate partners unfilled.
- **Engine**: Atomic cascading transactions. When a higher-tier offer is finalized, the engine atomistically:
  1. Revokes the previous lower-tier placement.
  2. Increments the former employer's available vacancy count.
  3. Scans for top-ranked shortlisted candidate runners-up and automatically cascades the newly-freed seat to them.
  4. Records immutable audit events in `activity_feed`. All or nothing via `client.start_session()`.

### 1.3 Post-Offer Renege & Retention Radar (`ml/renege_predictor.py`)
- **Problem**: Universities suffer a 25%–35% campus offer drop-off crisis where placed candidates ghost employers between offer letter issuance and joining day.
- **Engine**: Multi-factor early warning telemetry evaluating:
  - **Salary Disparity Ratio**: Candidate package vs. department peer cohort average.
  - **Post-Offer Application Leakage**: Applications or interview loops initiated *after* an active offer.
  - **Offer Lag**: Days between acceptance and projected joining.
  - Assigns dynamic flight bands (`LOW`, `MODERATE`, `CRITICAL`) and generates prescriptive retention intervention protocols.

### 1.4 Verified Talent Index (VTI Authenticity Engine) (`operations/authenticity.py`)
- **Problem**: Recruiter distrust stemming from inflated candidate resumes, unverified GitHub claims, and phantom course certificates.
- **Engine**: Composite trust algorithm scoring candidates across Verified CGPA, Backlog Integrity, Tier Ceiling, and Skills Inventory:
  - `VTI >= 90`: **Gold Honors Verified** (Institutional Top Tier)
  - `VTI 75–89`: **Silver Verified** (Fully Audited)
  - `VTI < 75`: **Bronze Standard** (Self-Reported)

---

## 2. PlaceFlow v3 Production Platform Pillars

### 2.1 Autonomous Agent Copilot Hub (`operations/agents.py`, `operations/agent_tools.py`)
- **Graded Autonomy Levels**:
  - **AG-01 (Student Career Assistant)**: Autonomy level **L0 Advisory**. Zero side-effects; assists students with eligible drives, schedule lookup, and policy explanation.
  - **AG-02 (TPO Operational Copilot)**: Autonomy level **L1 Drafting**. Triage queues, collision alerts, and administrative report selection for human placement coordinator sign-off.
  - **AG-10 (Scheduling Agent)**: Autonomy level **L2 Approval**. Proposes clash-free Superday schedules requiring human confirmation.
- **MCP Tool Registry**: Typed platform tools (`get_my_eligible_drives`, `explain_eligibility`, `get_my_schedule`, `run_report`, `list_pending_tasks`, `detect_clashes`, `search_policy`). Agents invoke typed tools with parameter validation rather than querying raw database collections.
- **Prompt Injection Defense**: Untrusted user text is quarantined as literal data.
- **Immutable Execution Trace Ledger**: Every plan step, tool invocation payload, and synthesized output is permanently recorded in `agent_runs`.

### 2.2 NIRF Graduation Outcome Calculator (`operations/nirf.py`)
- **Official Accreditation Formulas**:
  - **GPH Score (Max 40)**: \(40 \times \frac{N_p + N_{hs}}{N}\), measuring placement and verified higher studies progression.
  - **GMS Score (Max 40)**: \(40 \times \min(1.0, \frac{\text{Median CTC}}{\text{Benchmark CTC}})\), evaluating graduate median compensation.
  - **Total GO Score (Max 80)**: Combined accreditation metric.
- **Recruiter Salary Dispersion**: Company-wise minimum, median, and maximum package breakdown.
- **Small-Cell Privacy Suppression**: Candidate counts under 5 are masked as `<5` to protect student anonymity (Section 8.1 privacy requirement).

### 2.3 DPDP Purpose-Based Consent Ledger (`operations/consent.py`)
- **Notice `2026.1-DPDP` Compliance**: Explicit purpose specification (`DATA_SHARING_RECRUITERS`, `ML_CAREER_RECOMMENDATION`, `TRANSCRIPT_VERIFICATION`, `ALUMNI_COMMUNICATION`).
- **Granular Actions**: Grant and withdraw consent per purpose.
- **Machine Learning Opt-Out**: Immediate ML prediction silencing when consent is withdrawn.
- **Immutable Cryptographic Audit Trail**: Hashed verification logs with withdrawal date tracking.

### 2.4 What-If Conformal Career Simulator (`operations/whatif.py`)
- **Actionable Counterfactual Exploration**: Students simulate hypothetically raising CGPA, clearing backlogs, or acquiring high-demand skills (`AWS`, `Docker`, `Kubernetes`, `PyTorch`).
- **Conformal Uncertainty Bands (ML-07)**: Rather than point estimates, outputs an **80% conformal prediction package interval** (\([\text{lower}, \text{upper}]\) LPA) calibrated to 80% empirical coverage.
- **Transparent Attribution**: Shows exact delta increases in eligible corporate drives and potential tier unlocks (*Normal* \(\rightarrow\) *Dream* \(\rightarrow\) *Super Dream*).

---

## 3. AI & Machine Learning Talent Intelligence

PlaceFlow implements India AI Governance and Responsible ML principles:
1. **Advisory Only**: No model decides who is shortlisted or placed. Models rank and explain; human coordinators act.
2. **Deterministic Rules First**: Eligibility and tiers are auditable code rules. ML is used strictly for non-linear advisory ranking.
3. **No Sensitive Proxy Features (FR-ML-002)**: Gender, caste, religion, disability, and hometown are **strictly prohibited** from feature matrices.
4. **Demographic Parity Auditing (FR-ML-001)**: Validates that selection rates across protected slices stay within acceptable thresholds (Disparate Impact Ratio \(\ge 0.80\)).

---

## 4. Institutional UI/UX Architecture

The frontend is crafted around the **Ivy & IIT Institutional Design Standard**:
- **Palette**: Oxford Deep Navy (`#0B1B3D`), Academic Cardinal Crimson (`#8C1515`), Slate Canvas (`#F8FAFC`), and Gold Honors (`#D97706`).
- **Typography**: Inter for crisp numerical tables, Playfair/Cinzel serif for institutional crests and headers, JetBrains Mono for candidate roll numbers and tokens.
- **Component Density**: High-density registrar tables with sticky headers, color-coded status badges, and interactive drilldowns.

---

## 5. Quickstart & Running Servers

### Prerequisites
- Python 3.10+
- Node.js 20+ & npm
- MongoDB 7.0+ running with replica set `rs0` on `localhost:27017`

### 1. Database Initialization
```powershell
cd placeflow
.venv\Scripts\python -m database.setup_db
.venv\Scripts\python -m database.seed_data
```

### 2. Launch Django Backend Server
```powershell
cd placeflow
.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```
*Django REST API starts on `http://127.0.0.1:8000/api/`*

### 3. Launch React Frontend Server
```powershell
cd placeflow\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*React Institutional Application starts on `http://127.0.0.1:5173/`*

---

## 6. Interactive Web Route & REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/overview/` | `GET` | Executive Directorate KPIs, branch placement velocity, tier breakdown |
| `/api/students/` | `GET`, `POST` | Candidate registry with department filtering and roll number search |
| `/api/students/<id>/` | `GET` | High-density candidate dossier with VTI breakdown and eligible drives |
| `/api/whatif/simulate/` | `POST` | What-If simulation with 80% conformal package prediction bands |
| `/api/recruitment/companies/` | `GET` | Corporate hiring partners registry |
| `/api/recruitment/jobs/` | `GET` | Job Notification Forms (JNFs) and tier vacancies |
| `/api/recruitment/applications/` | `GET` | Unified application ledger |
| `/api/recruitment/placements/` | `GET` | Official placement register |
| `/api/recruitment/place-student/` | `POST` | Atomic cascading placement transaction |
| `/api/superday/conflicts/` | `GET` | Collision matrix for overlapping interviews and rooms |
| `/api/superday/resolve/` | `POST` | 1-Click ACID Superday collision resolver |
| `/api/agents/chat/` | `POST` | AG-01, AG-02, AG-10 autonomous multi-agent copilot execution |
| `/api/agents/runs/` | `GET` | Immutable agent execution trace audit ledger |
| `/api/nirf/` | `GET` | NIRF Graduation Outcome accreditation formulas & privacy-masked salary dispersion |
| `/api/consent/<id>/` | `GET` | Student DPDP Act 2023 purpose consent records |
| `/api/consent/record/` | `POST` | Explicit consent grant action |
| `/api/consent/withdraw/` | `POST` | Explicit consent withdrawal action |
| `/api/fairness/audit/` | `GET` | Demographic slice parity & prohibited feature bias audit |
| `/api/renege/radar/` | `GET` | Post-offer flight risk telemetry & retention intervention radar |
| `/api/reports/` | `GET` | 15 MongoDB aggregation reports |
| `/api/reports/<id>/csv/` | `GET` | Official registrar CSV download for any report |

---

## 7. Database Schema & Aggregation Pipelines

PlaceFlow runs against MongoDB 7.0+ `college_placement_db` with 11 core collections protected by strict `$jsonSchema` validators:
1. `students`: Roll numbers, verified CGPA, backlogs, skills, placement status, highest tier.
2. `companies`: Tier ratings, hiring contact details, recruitment history.
3. `jobs`: JNF title, tier, package LPA, vacancies, filled counter, eligibility rules.
4. `applications`: Candidate-job linkage, round progress, application status.
5. `interviews`: Scheduled slots, panel venue, clash detection flags.
6. `placements`: Accepted offer ledger, joining status.
7. `activity_feed`: Capped collection for high-throughput real-time audit event logging.
8. `agent_runs`: Immutable multi-agent reasoning plans, MCP tool calls, and outputs.
9. `consent_records`: DPDP purpose-based explicit consent ledger.
10. `nirf_snapshots`: Yearly snapshot archives for NIRF ranking audits.
11. `system.js`: Server-side database routines.

---

## 8. Automated Test Suite & Verification (30/30 Passing)

Run the full pytest suite:
```powershell
cd placeflow
.venv\Scripts\pytest -v
```

### Complete Test Results:
```text
tests/test_business_rules.py::test_validator_rejects_bad_cgpa PASSED     [  3%]
tests/test_business_rules.py::test_duplicate_application_is_blocked PASSED [  6%]
tests/test_business_rules.py::test_ineligible_cgpa_names_the_reason PASSED [ 10%]
tests/test_business_rules.py::test_tier_policy PASSED                    [ 13%]
tests/test_business_rules.py::test_interview_clash PASSED                [ 16%]
tests/test_business_rules.py::test_delete_student_with_applications_is_blocked PASSED [ 20%]
tests/test_business_rules.py::test_finalize_changes_everything_together PASSED [ 23%]
tests/test_business_rules.py::test_full_job_rolls_back PASSED            [ 26%]
tests/test_business_rules.py::test_concurrent_last_seat PASSED           [ 30%]
tests/test_business_rules.py::test_audit_finds_orphans_because_mongodb_has_no_foreign_keys PASSED [ 33%]
tests/test_django_api.py::test_django_overview_api PASSED                [ 36%]
tests/test_django_api.py::test_django_students_api PASSED                [ 40%]
tests/test_django_api.py::test_django_superday_api PASSED                [ 43%]
tests/test_django_api.py::test_django_nirf_api PASSED                    [ 46%]
tests/test_django_api.py::test_django_whatif_api PASSED                  [ 50%]
tests/test_django_api.py::test_django_agent_chat_api PASSED              [ 53%]
tests/test_django_api.py::test_django_consent_lifecycle_api PASSED       [ 56%]
tests/test_django_api.py::test_django_fairness_api PASSED                [ 60%]
tests/test_django_api.py::test_django_renege_radar_api PASSED            [ 63%]
tests/test_enterprise_moats.py::test_superday_conflict_detection_and_resolution PASSED [ 66%]
tests/test_enterprise_moats.py::test_atomic_placement_with_cascading PASSED [ 70%]
tests/test_enterprise_moats.py::test_talent_authenticity_vti PASSED      [ 73%]
tests/test_enterprise_moats.py::test_renege_risk_calculation PASSED      [ 76%]
tests/test_v3_platform.py::test_sensitive_features_audit PASSED          [ 80%]
tests/test_v3_platform.py::test_cohort_fairness_audit PASSED             [ 83%]
tests/test_v3_platform.py::test_mcp_agent_tools_execution PASSED         [ 86%]
tests/test_v3_platform.py::test_agent_runtime_trace_and_quarantine PASSED [ 90%]
tests/test_v3_platform.py::test_whatif_simulator_and_conformal_bands PASSED [ 93%]
tests/test_v3_platform.py::test_dpdp_consent_lifecycle_and_opt_out PASSED [ 96%]
tests/test_v3_platform.py::test_nirf_graduation_outcome_calculator PASSED [100%]

============================= 30 passed in 27.86s =============================
```

---

## 9. License & Credits

- **Engineering Directorate**: Office of Career Services / Training &amp; Placement Directorate.
- **Governance**: Aligned with the Digital Personal Data Protection (DPDP) Act 2023 and Ministry of Education NIRF Ranking Framework.
- **Open Standards**: Model Context Protocol (MCP) tool schema definitions.

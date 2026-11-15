# Meridian — The Institutional Academic & Career Operating System

<div align="center">

<img src="placeflow/frontend/public/meridian.svg" alt="Meridian Logo" width="84" height="84" />

### Role-Partitioned Workspaces &bull; In-Process Talent ML &bull; MongoDB 7.0+ Replica Set Transactions &bull; Default-Deny Server-Side RBAC

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2%20REST-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0%2B%20Replica%20Set-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Backend Pytest](https://img.shields.io/badge/Pytest-29%2F29%20Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![Frontend Vitest](https://img.shields.io/badge/Vitest-79%2F79%20Passed-blueviolet?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Live Endpoints](https://img.shields.io/badge/Endpoints-199%2F199%20Verified-emerald?style=for-the-badge)](http://127.0.0.1:8000/api/health/)
[![DPDP Act 2023](https://img.shields.io/badge/Privacy-DPDP%202023%20Compliant-0D9488?style=for-the-badge)](placeflow/frontend/src/public/PrivacyPolicyPage.tsx)

</div>

---

## 📑 Table of Contents

- [🎬 Live Platform Demo](#-live-platform-demo)
- [🏛️ Platform Architecture](#️-platform-architecture)
- [🚀 Key Highlights & Architectural Moats](#-key-highlights--architectural-moats)
  - [1. Six Purpose-Built Role Workspaces](#1-six-purpose-built-role-workspaces)
  - [2. Design-System Cards with 5 Deterministic States](#2-design-system-cards-with-5-deterministic-states)
  - [3. Server-Side Default-Deny RBAC & Account Lifecycle](#3-server-side-default-deny-rbac--account-lifecycle)
  - [4. Operational Business Moats: Superday Solver & Seat Cascading](#4-operational-business-moats-superday-solver--seat-cascading)
- [📋 Comprehensive REST API Reference (83+ Endpoints)](#-comprehensive-rest-api-reference-83-endpoints)
- [🔑 Seeded Demo Credentials (DEBUG Mode)](#-seeded-demo-credentials-debug-mode)
- [🛠️ Verification Commands](#️-verification-commands)

---

## 🎬 Live Platform Demo

<p align="center">
  <img src="docs/assets/meridian-demo.gif" width="920" alt="Meridian Enterprise Live Platform Walkthrough" style="max-width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 16px 36px -12px rgba(15, 23, 42, 0.15);" />
</p>
<p align="center">
  <sub><b>Figure 1:</b> Live Platform Walkthrough — Public Landing &rarr; TPO Command Center &amp; Superday Conflict Arbitrator &rarr; Student Career Cockpit &amp; 1-Click Apply &rarr; Executive Management Fairness Audit.</sub>
</p>

---

## 🏛️ Platform Architecture

```mermaid
flowchart TD
    subgraph UI["Meridian Frontend (React 19 + TypeScript + Tailwind CSS v4 @ :5173)"]
        Public["Public Landing Page (/) & Legal (/privacy, /terms)"]
        AuthJourneys["Auth & Self-Service (/login, /claim, /onboarding, /accept-invite)"]
        
        subgraph AppShell["Centralized AppShell (Sidebar + TopBar + UserMenu)"]
            Student["/student/* (Candidate Command Center, Academics & Drives)"]
            TPO["/tpo/* (Placement Operations, Superday Arbitrator, Companies)"]
            Faculty["/faculty/* (Mentee Cohorts, Reviews & Advising)"]
            HOD["/hod/* (Department Benchmarks, Faculty & Student Roster)"]
            Mgmt["/management/* (NIRF Outcomes, Demographic Fairness Audit)"]
            Admin["/admin/* (IAM, Claims Queue, Hierarchy & Tenants)"]
        end
        
        Account["Cross-Portal Account Area (/account/*)"]
        DevCards["Design-System Gallery (/dev/cards)"]
    end

    subgraph API["Authoritative Backend API (Django 5.2 REST Framework @ :8000)"]
        RBAC["Default-Deny Authorization & Downward Scope Evaluation"]
        AuditLog["Immutable Audit Activity Ledger"]
        
        subgraph Domains["CAMP Core Domains"]
            CAMP01["CAMP-01: Multi-Tenancy, Hierarchy & Topology"]
            CAMP02["CAMP-02: IAM, Account Lifecycle & Token State"]
            CAMP03["CAMP-03: NEP 2020 Academic Progression & Ledger"]
        end
        
        subgraph Intelligence["Talent Intelligence & Constraint Engines"]
            SuperdayEngine["Superday Multi-Room Conflict Arbitrator"]
            CascadingEngine["Atomic Seat Cascading Engine"]
            FairnessEngine["Demographic Slice Parity Evaluator (80% Rule)"]
            MLPredictor["Placement Likelihood & Conformal Package Band"]
        end
    end

    subgraph Persistence["Persistence Layer (MongoDB 7.0+ Replica Set rs0)"]
        Mongo[("MongoDB 7.0+ rs0\n- Strict $jsonSchema Validation\n- Multi-Document ACID Transactions")]
    end

    UI -->|HTTPS JSON + HTTP-Only Session Cookies| API
    API --> Mongo
```

---

## 🚀 Key Highlights & Architectural Moats

### 1. Six Purpose-Built Role Workspaces

<p align="center">
  <img src="docs/assets/endpoint-portals-matrix.svg" width="920" alt="Meridian Namespaced Role Portals & Authorized API Topology" style="max-width: 100%; border-radius: 12px; border: 1px solid #cbd5e1;" />
</p>
<p align="center">
  <sub><b>Figure 2:</b> Architecture of the 6 role-partitioned workspaces, showing key endpoints, permissions, and architectural boundaries.</sub>
</p>

No shared "chameleon" pages. Meridian enforces clean architectural boundaries:
- 🎓 **Student Portal**: Real-time course registrations, prerequisite gap analyzers, one-click drive applications, interview rounds, and DPDP consent controls.
- 🏢 **TPO Directorate**: 6-step Placement Drive creation wizard, real-time candidate estimators, corporate partner CRM, and 1-click Superday conflict arbitration.
- 🧑‍🏫 **Faculty Advisory**: Assigned mentee roster, attendance tracking, CIE score monitoring, and academic intervention notes.
- 🏛️ **HOD Department Leadership**: Department placement rates, student cohort tracking, faculty load allocations, and academic progression reviews.
- 📊 **Executive Management**: Official NIRF accreditation metrics (GPH/GMS calculation), campus-wide demographic fairness audit, and autonomous copilot execution logs.
- 🛡️ **Institutional Admin**: Tenant and campus hierarchy configuration, IAM identities, user accounts, and manual account claims resolution queue.

#### Perspective Deep-Dive Walkthrough:

<details open>
<summary><b>1. 🎓 The Student Perspective (/student)</b> — <i>Candidate Career Cockpit &amp; Matched Drives</i></summary>
<br/>

<table align="center" width="100%">
  <tr>
    <th width="72%" align="center">🖥️ Desktop Candidate Command Center (1440px)</th>
    <th width="28%" align="center">📱 Mobile Phone (390px)</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="docs/screenshots/1440/student_home.png" width="620" alt="Student Desktop Home" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td align="center" valign="top">
      <img src="docs/screenshots/390/student_home.png" width="220" alt="Student Mobile Home" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
</table>

<table align="center" width="100%">
  <tr>
    <th width="50%" align="center">🎯 Matched Opportunities &amp; 1-Click Apply</th>
    <th width="50%" align="center">🛡️ DPDP Act 2023 Verified Profile</th>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/1440/student_opportunities_list.png" width="440" alt="Opportunities List" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td align="center">
      <img src="docs/screenshots/1440/student_profile_verified.png" width="440" alt="Verified Student Profile" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/demo-student.gif" width="720" alt="Student Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.1:</b> Candidate 1-Click Application Workflow &bull; DPDP Consent Verification &bull; Automated Stage Progression.</sub>
</p>

- **"What Needs Me Now" Hub**: Prioritized action triage (pending DPDP consents, scheduled interview slots).
- **NEP 2020 Progression**: 138/160 credits earned, real-time CIE scores, and degree exit milestones.
- **Matched Drives**: Algorithmic gating by CGPA &amp; backlogs with **1-Click Apply**.
- **Interactive What-If Simulator**: Real-time counterfactual CGPA boosts, certification unlocks, and simulated package bands (`/student/what-if`).
- **Endpoints**: `GET /api/student/me/`, `GET /api/student/opportunities/`, `POST .../apply/`, `GET .../academics/`, `POST /api/student/insights/whatif/`.
</details>

<details>
<summary><b>2. 🏢 The TPO Placement Directorate (/tpo)</b> — <i>Placement Operations &amp; Superday Clash Solver</i></summary>
<br/>

<table align="center" width="100%">
  <tr>
    <th width="72%" align="center">🖥️ Directorate Command Center &amp; Season Overview (1440px)</th>
    <th width="28%" align="center">📱 Mobile Operations (390px)</th>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="docs/screenshots/1440/tpo_home.png" width="620" alt="TPO Desktop Home" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td align="center" valign="top">
      <img src="docs/screenshots/390/tpo_home.png" width="220" alt="TPO Mobile Home" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
</table>

<table align="center" width="100%">
  <tr>
    <th width="50%" align="center">📋 Recruitment Drives &amp; Setup Wizard</th>
    <th width="50%" align="center">👤 Candidate Dossier &amp; Verified Talent Index</th>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/1440/tpo_drives_list.png" width="440" alt="Drives List" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td align="center">
      <img src="docs/screenshots/1440/tpo_student_detail.png" width="440" alt="Candidate Dossier Detail" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/demo-tpo.gif" width="720" alt="TPO Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.2:</b> Superday Multi-Room Conflict Arbitrator &bull; 1-Click Constraint Resolution &bull; Zero Recruiter Idle Time.</sub>
</p>

- **Superday Conflict Solver**: 1-Click NP-hard room collision resolution.
- **6-Step Drive Creation Wizard**: Guided JNF publishing with live candidate estimator sliders.
- **Renege Flight Radar**: Telemetry identifying candidates at risk of dropping campus offers.
- **Model Registry &amp; Governance**: Real-time tracking of latency, feature weights, and retraining pipeline (`/tpo/models`).
- **Endpoints**: `GET /api/tpo/overview/`, `POST /api/tpo/jobs/`, `POST .../superday/resolve/`, `GET .../renege/`, `GET /api/tpo/models/`.
</details>

<details>
<summary><b>3. 🧑‍🏫 The Faculty Advisory Perspective (/faculty)</b> — <i>Mentee Cohorts &amp; Advising</i></summary>
<br/>

<p align="center">
  <img src="docs/screenshots/1440/faculty_home.png" width="900" alt="Faculty Advisory Cockpit" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Figure 2.3:</b> Faculty Advisory Cockpit — Assigned Mentee Cohort, Real-Time CIE Tracking &amp; Early Attendance Deficit Warnings (&lt;75%).</sub>
</p>

<p align="center">
  <img src="docs/assets/demo-faculty.gif" width="720" alt="Faculty Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.3:</b> Mentee Attendance Drop Warning (&lt;75%) &bull; Early Advisory Intervention Logging &bull; Placement Protection.</sub>
</p>

- **Assigned Mentees**: Dedicated ~24 mentee cohort with unmasked verified profiles.
- **Early Attendance Warnings**: Flags drop-offs (&lt;75%) before placement debarment.
- **Intervention Notes**: Confidential advisory logs and technical mock review records.
- **Endpoints**: `GET /api/faculty/mentees/`, `GET .../mentees/{id}/`, `GET /api/faculty/summary/`.
</details>

<details>
<summary><b>4. 🏛️ The Department Head (HOD) Perspective (/hod)</b> — <i>Department Leadership &amp; Benchmarks</i></summary>
<br/>

<p align="center">
  <img src="docs/screenshots/1440/hod_home.png" width="900" alt="HOD Department Governance" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Figure 2.4:</b> HOD Department Leadership — Department Placement Rate (89.6%), Median CTC (16.2 LPA), Faculty Mentoring Loads &amp; Borderline Eligibility Waivers.</sub>
</p>

<p align="center">
  <img src="docs/assets/demo-hod.gif" width="720" alt="HOD Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.4:</b> Department Leadership Benchmarking &bull; Borderline CGPA Eligibility Waiver Approval &bull; Audit Trail Signature.</sub>
</p>

- **Department Benchmarks**: 89.6% placement rate and 16.2 LPA median CTC tracking.
- **Faculty Load Allocations**: Balances student advisor loads across department faculty.
- **Waiver Exceptions**: Committee sign-off on borderline placement eligibility requests.
- **Endpoints**: `GET /api/hod/students/`, `GET /api/hod/faculty/`, `GET /api/hod/summary/`.
</details>

<details>
<summary><b>5. 📊 The Executive Management Perspective (/management)</b> — <i>NIRF Outcomes &amp; Fairness</i></summary>
<br/>

<p align="center">
  <img src="docs/screenshots/1440/management_home.png" width="900" alt="Executive Management Cockpit" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Figure 2.5:</b> Executive Management — Statutory NIRF Accreditation Metrics (GPH/GMS), Campus-wide Demographic Slice Fairness Audit (7,141 Students in 6.7s).</sub>
</p>

<p align="center">
  <img src="docs/assets/demo-management.gif" width="720" alt="Management Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.5:</b> Real-Time Cohort Fairness Audit Across 7,141 Candidates in 6.7s &bull; Disparate Impact Evaluation (0.842 Compliant).</sub>
</p>

- **Statutory NIRF Calculator**: Real-time GPH and GMS accreditation metrics.
- **7,141-Cohort Fairness Audit**: Disparate impact ratio evaluation completed in 6.7s.
- **Zero Sensitive Attributes Gate**: Prohibits gender, caste, native state, and income in models.
- **Endpoints**: `GET .../nirf/metrics/`, `GET .../fairness/audit/`, `GET .../agents/runs/`.
</details>

<details>
<summary><b>6. 🛡️ The Institutional Administrator Perspective (/admin)</b> — <i>IAM &amp; Topology</i></summary>
<br/>

<p align="center">
  <img src="docs/screenshots/1440/admin_home.png" width="900" alt="Institutional Administrator Control Plane" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Figure 2.6:</b> Institutional Administrator — Multi-Tenant Hierarchy, IAM Accounts, Identity Claims Resolution Queue &amp; System Health.</sub>
</p>

<p align="center">
  <img src="docs/assets/demo-admin.gif" width="720" alt="Admin Interactive Demo" style="border-radius: 8px; border: 1px solid #e2e8f0;" /><br/>
  <sub><b>Interactive Demo 2.6:</b> Unmatched External Email Identity Claim &bull; Institutional Roll Match &bull; 1-Click Verification &amp; Activation.</sub>
</p>

- **Account Claims Queue**: Manual resolution for unmatched or non-standard email claims.
- **Multi-Tenant Hierarchy**: Downward scope inheritance across campuses and schools.
- **IAM Lifecycle**: Re-issue invite tokens, force password resets, and session eviction.
- **Endpoints**: `GET /api/admin/claims/`, `POST .../claims/{id}/resolve/`, `GET /api/admin/tenants/`.
</details>

### 2. Design-System Cards with 5 Deterministic States

<p align="center">
  <img src="docs/screenshots/1440/dev_cards.png" width="920" alt="Meridian Design System Gallery" style="max-width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 16px 36px -12px rgba(15, 23, 42, 0.12);" /><br/>
  <sub><b>Figure 3.1:</b> Design-System Component Gallery — Standardized 5-State Architecture across ProfileCard, DriveCard, ApplicationCard, OfferCard, TaskCard, and Spine.</sub>
</p>

<p align="center">
  <img src="docs/assets/endpoint-person-card-masking.svg" width="860" alt="DPDP Act 2023 Masking" style="max-width: 100%;" /><br/>
  <sub><b>Figure 3.2:</b> Dynamic field-level privacy masking evaluated server-side when viewing peer candidate records vs. faculty/staff.</sub>
</p>

Every card in the system (`ProfileCard`, `DriveCard`, `ApplicationCard`, `InterviewCard`, `OfferCard`, `CompanyCard`, `TaskCard`) strictly supports:
- `Default`: Complete data presentation with interactive triggers.
- `Loading`: Pulse-animated skeleton matching exact layout dimensions.
- `Empty`: Descriptive explanation with actionable next steps.
- `Error`: Inline error state with retry triggers.
- `Masked`: Field-level privacy obfuscation for unauthorized viewers under DPDP regulations.

### 3. Server-Side Default-Deny RBAC &amp; Account Lifecycle

<table align="center" width="100%">
  <tr>
    <th width="50%" align="center">🔐 Unified Authentication Gateway (/login)</th>
    <th width="50%" align="center">⚙️ Shared Account &amp; Device Security (/account)</th>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/1440/login.png" width="440" alt="Authentication Gateway" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td align="center">
      <img src="docs/screenshots/1440/account_profile.png" width="440" alt="Account Profile & Security" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/endpoint-auth-lifecycle.svg" width="860" alt="Meridian Auth Lifecycle" style="max-width: 100%;" /><br/>
  <sub><b>Figure 4:</b> Authoritative session authentication flow, cryptographic claim token dispatch, and self-service password recovery.</sub>
</p>

- Permissions are verified strictly on the server by DRF permission classes.
- Identity is derived entirely from validated session cookies, not client-side state.
- Scopes are enforced hierarchically: `PLATFORM` &rarr; `INSTITUTION` &rarr; `CAMPUS` &rarr; `ORGANIZATIONAL_UNIT` &rarr; `SELF`.

### 4. Operational Business Moats: Superday Solver &amp; Seat Cascading

<p align="center">
  <img src="docs/assets/endpoint-superday-cascading.svg" width="880" alt="Superday Solver & Atomic Seat Cascading" style="max-width: 100%;" /><br/>
  <sub><b>Figure 5:</b> Constraint solver resolving Superday room contention and ACID multi-document seat cascading transaction pipeline.</sub>
</p>

---

## 📋 Comprehensive REST API Reference (199+ Endpoints)

| Category | Method | Endpoint | Auth Required | Description |
| :--- | :---: | :--- | :--- | :--- |
| **System** | `GET` | `/api/health/` | Public | Service health & replica set probe |
| **Auth** | `GET` | `/api/auth/csrf/` | Public | Acquire CSRF session cookie |
| **Auth** | `POST` | `/api/auth/login/` | Public | Authenticate with username & password |
| **Auth** | `POST` | `/api/auth/logout/` | Authed | Invalidate session & clear cookies |
| **Auth** | `GET` | `/api/auth/me/` | Authed | Active principal context & verified profile |
| **Lifecycle** | `POST` | `/api/auth/password/forgot/` | Public | Enumeration-safe password reset trigger |
| **Lifecycle** | `POST` | `/api/auth/password/reset/` | Public | Cryptographic token password reset |
| **Lifecycle** | `POST` | `/api/auth/claim/start/` | Public | Start identity claim via institutional email OTP |
| **Lifecycle** | `POST` | `/api/auth/claim/verify/` | Public | Verify 6-digit OTP & activate account |
| **Lifecycle** | `POST` | `/api/auth/accept-invite/` | Public | Redeem invitation token & set password |
| **Account** | `GET, PATCH` | `/api/account/profile/` | Authed | View & update editable profile extensions |
| **Account** | `POST` | `/api/account/avatar/` | Authed | Multipart upload user avatar |
| **Account** | `GET` | `/api/account/sessions/` | Authed | List active user sessions with IP & device flags |
| **Account** | `DELETE` | `/api/account/sessions/<session_id>/` | Authed | Terminate specific remote session |
| **Account** | `POST` | `/api/account/sessions/revoke-others/` | Authed | Invalidate all other active sessions |
| **Account** | `POST` | `/api/account/password/change/` | Authed | Self-service password change |
| **Account** | `GET` | `/api/account/notifications/` | Authed | List notifications with unread count |
| **Account** | `POST` | `/api/account/notifications/read/` | Authed | Mark notifications as read |
| **People** | `GET` | `/api/people/<id>/card/` | Authed | Scoped person card with field-level masking |
| **Media** | `GET` | `/api/media/avatar/<id>/` | Authed | Stream validated binary avatar image |
| **Copilot ML** | `POST` | `/api/v1/copilot/query/` | Authed | Unified Copilot ML pipeline: DB grounding, intent routing, ML inference & RAG |
| **Copilot ML** | `GET` | `/api/v1/copilot/context/` | Authed | Role-scoped Copilot persona context & shared attribute configuration |
| **Student** | `GET` | `/api/student/me/` | `portal.student` | Candidate context & mentor assignments |
| **Student** | `POST` | `/api/student/profile/` | `portal.student` | Update headline, skills, and bio extensions |
| **Student** | `GET` | `/api/student/opportunities/`| `placement.drive.view` | Eligible job drives matching criteria |
| **Student** | `POST` | `/api/student/opportunities/<id>/apply/` | `placement.apply` | Submit job application with DPDP consent |
| **Student** | `GET` | `/api/student/applications/` | `placement.apply` | Application history & stage progress |
| **Student** | `GET` | `/api/student/interviews/` | `placement.apply` | Scheduled technical/HR interview rounds |
| **Student** | `GET` | `/api/student/offers/` | `placement.offer.view` | Received offers & package details |
| **Student** | `POST` | `/api/student/offers/<id>/respond/` | `placement.offer.respond` | Accept/reject offer (triggers seat cascading) |
| **Student** | `GET` | `/api/student/academics/` | `academic.record.view`| NEP 2020 course progression & CIE scores |
| **Student** | `GET` | `/api/student/consents/` | `dpdp.consent.view` | DPDP 2023 purpose consent ledger |
| **Student** | `POST` | `/api/student/consents/record/` | `dpdp.consent.record` | Record DPDP recruiter sharing consent |
| **Student** | `POST` | `/api/student/consents/withdraw/` | `dpdp.consent.record` | Revoke DPDP recruiter sharing consent |
| **Student** | `GET` | `/api/student/insights/readiness/` | `portal.student` | In-process ML placement likelihood score |
| **Student** | `GET` | `/api/student/insights/skills/` | `portal.student` | Recommended skill gaps & target certifications |
| **Student** | `POST` | `/api/student/insights/whatif/` | `portal.student` | What-If career scenario & CGPA boost simulator |
| **TPO** | `GET` | `/api/tpo/overview/` | `placement.overview.view` | Directorate placement rate & median CTC |
| **TPO** | `GET, POST` | `/api/tpo/jobs/` | `placement.drive.create`| Campus recruitment drives & wizard setup |
| **TPO** | `GET` | `/api/tpo/jobs/<id>/candidates/` | `placement.drive.view` | Candidate roster per placement drive |
| **TPO** | `GET` | `/api/tpo/students/` | `student.roster.view` | Candidate roster with Verified Talent Index |
| **TPO** | `GET` | `/api/tpo/students/<id>/` | `student.roster.view` | Detailed candidate dossier & academic ledger |
| **TPO** | `GET, POST` | `/api/tpo/companies/` | `company.partner.view` | Corporate partner directory & tier policies |
| **TPO** | `GET` | `/api/tpo/applications/` | `placement.application.view` | Global application ledger across drives |
| **TPO** | `POST` | `/api/tpo/applications/<id>/status/` | `placement.application.manage` | Candidate interview stage advancement |
| **TPO** | `GET` | `/api/tpo/interviews/` | `placement.interview.view`| Campus-wide interview schedules |
| **TPO** | `GET` | `/api/tpo/placements/` | `placement.offer.view` | Confirmed placements register |
| **TPO** | `GET` | `/api/tpo/superday/conflicts/` | `superday.arbitrate` | Detect room collisions and slot double-bookings |
| **TPO** | `POST` | `/api/tpo/superday/resolve/` | `superday.arbitrate` | 1-Click atomic NP-hard slot rescheduling solver |
| **TPO** | `GET` | `/api/tpo/insights/renege/` | `renege.radar.view` | Post-offer candidate renege flight radar |
| **TPO** | `GET` | `/api/tpo/insights/fairness/` | `fairness.audit.view` | Disparate impact ratio audit across departments |
| **TPO** | `GET` | `/api/tpo/insights/reports/` | `reports.view` | 15 Aggregation reports (Package distribution, etc.) |
| **TPO** | `GET` | `/api/tpo/insights/reports/<id>/csv/` | `reports.export` | Streamed CSV report export |
| **TPO** | `POST` | `/api/tpo/insights/whatif/` | `placement.overview.view` | Cohort-wide placement scenario simulation |
| **TPO** | `GET` | `/api/tpo/models/` | `models.registry.view` | Placement ML models versioning & latency |
| **TPO** | `POST` | `/api/tpo/models/retrain/` | `models.retrain` | Retraining pipeline for placement predictor |
| **Faculty** | `GET` | `/api/faculty/mentees/` | `faculty.mentees.view` | Assigned mentee cohort with attendance flags |
| **Faculty** | `GET` | `/api/faculty/mentees/<id>/` | `faculty.mentees.view` | Mentee dossier, backlog history & review notes |
| **Faculty** | `GET` | `/api/faculty/summary/` | `faculty.mentees.view` | Mentorship cohort progression summary |
| **HOD** | `GET` | `/api/hod/students/` | `hod.students.view` | Department student cohort |
| **HOD** | `GET` | `/api/hod/students/<id>/` | `hod.students.view` | Student credit verification & interview history |
| **HOD** | `GET` | `/api/hod/faculty/` | `hod.faculty.view` | Department faculty roster & mentoring loads |
| **HOD** | `GET` | `/api/hod/summary/` | `hod.summary.view` | Department placement rate & year benchmarks |
| **Management**| `GET` | `/api/management/nirf/metrics/` | `accreditation.nirf.view` | NIRF GPH & GMS accreditation metrics |
| **Management**| `GET` | `/api/management/fairness/audit/` | `agent.fairness.audit` | Disparate impact fairness audit (7,141 cohort) |
| **Management**| `GET` | `/api/management/consent/records/` | `dpdp.consent.audit` | Campus-wide DPDP Act compliance audit ledger |
| **Management**| `GET` | `/api/management/agents/runs/` | `campus.ai.audit` | Autonomous Copilot execution ledger |
| **Management**| `GET` | `/api/management/reports/` | `management.reports.view` | Executive summaries across schools & colleges |
| **Admin** | `GET, POST` | `/api/admin/tenants/` | `tenant.manage` | Platform multi-tenant registry |
| **Admin** | `GET, POST` | `/api/admin/institutions/` | `institution.manage` | Institutional entities & campus mapping |
| **Admin** | `GET, POST` | `/api/admin/campuses/` | `campus.manage` | Physical campus sites & facilities |
| **Admin** | `GET` | `/api/admin/hierarchy/` | `hierarchy.manage` | Organizational school & department structure |
| **Admin** | `GET` | `/api/admin/summary/` | `admin.summary.view` | Global system status, active sessions & tenant count |
| **Admin** | `GET` | `/api/admin/claims/` | `iam.account.create` | Pending manual account verification queue |
| **Admin** | `POST` | `/api/admin/claims/<id>/resolve/` | `iam.account.create` | Approve or reject pending identity claim |
| **Admin** | `POST` | `/api/admin/affiliations/link/` | `iam.account.create` | Associate person identity with institutional record |
| **Admin** | `POST` | `/api/admin/affiliations/unlink/` | `iam.account.create` | Sever person link from institutional record |
| **Admin** | `POST` | `/api/admin/accounts/<id>/resend-invite/` | `iam.account.create` | Re-issue cryptographic onboarding invite token |
| **Admin** | `POST` | `/api/admin/accounts/<id>/force-reset/` | `iam.account.create` | Force password reset on next login |
| **Admin** | `POST` | `/api/admin/accounts/<id>/deactivate/` | `iam.account.create` | Lock account & terminate active sessions |
| **Admin** | `GET` | `/api/admin/iam/identities/` | `iam.view` | Person identity catalogue (CAMP-02) |
| **Admin** | `GET` | `/api/admin/iam/accounts/` | `iam.view` | User accounts registry |
| **Admin** | `GET` | `/api/admin/iam/roles/` | `iam.roles.view` | System RBAC roles & permissions catalogue |
| **Admin** | `GET` | `/api/admin/iam/assignments/` | `iam.assignments.view` | Role assignments & downward inheritance scopes |
| **Admin** | `GET` | `/api/admin/iam/delegations/` | `iam.delegations.view` | Role delegation ledger across faculty & staff |
| **Admin** | `GET` | `/api/admin/iam/memberships/` | `iam.view` | Department & campus membership rosters |
| **Admin** | `GET, POST` | `/api/admin/academic/qualifications/` | `academic.manage` | Degree qualification definitions |
| **Admin** | `GET, POST` | `/api/admin/academic/programs/` | `academic.manage` | NEP 2020 Degree programs & credit curricula |
| **Admin** | `GET, POST` | `/api/admin/academic/courses/` | `academic.manage` | Course catalog, prerequisites & credit weights |
| **Admin** | `GET` | `/api/admin/ai/traces/` | `campus.ai.audit` | AI Gateway LLM reasoning traces & latency |
| **Campus AI** | `POST` | `/api/v4/ai/query/` | `campus.ai.query` | Conversational query with campus context |
| **Campus AI** | `POST` | `/api/v4/ai/rag/` | `campus.ai.query` | Vector retrieval across institutional policy |
| **Campus AI** | `POST` | `/api/v4/ai/agent/execute/` | `campus.ai.execute` | Autonomous Copilot task execution |
| **Campus AI** | `GET` | `/api/v4/ai/traces/` | `campus.ai.audit` | LLM reasoning traces, prompt hashes & token costs |
| **Campus AI** | `GET` | `/api/v4/ai/quotas/` | `campus.ai.audit` | Institutional token rate limits & quotas |
| **Academic** | `GET, POST` | `/api/v4/academic/qualifications/` | `academic.manage` | Degree qualifications catalog (Certificate, B.Tech) |
| **Academic** | `GET, POST` | `/api/v4/academic/programs/` | `academic.manage` | Degree programs with credit requirements |
| **Academic** | `GET, POST` | `/api/v4/academic/courses/` | `academic.manage` | Course definitions, syllabus & CIE/SEE splits |
| **Academic** | `GET, POST` | `/api/v4/academic/calendars/` | `academic.manage` | Semester terms & examination windows |
| **Academic** | `GET, POST` | `/api/v4/academic/students/` | `academic.record.view` | Student academic enrollment registry |
| **Academic** | `GET` | `/api/v4/academic/students/<id>/ledger/` | `academic.record.view` | Tamper-evident credit ledger & CIE marks |
| **Academic** | `POST` | `/api/v4/academic/progression/evaluate/` | `academic.manage` | Real-time progression & graduation evaluator |

---

## 🔑 Seeded Demo Credentials (DEBUG Mode)

All accounts share the default development password: **`password123`**

```
┌───────────────────┬──────────────────────┬──────────────────────┬─────────────────────────┐
│ Username          │ Baseline Role        │ Scoped Unit          │ Primary Portal Route    │
├───────────────────┼──────────────────────┼──────────────────────┼─────────────────────────┤
│ student           │ STUDENT_MEMBER       │ STU001 (Self)        │ /student                │
│ placement_rep     │ PLACEMENT_REP        │ OU_CSE (Department)  │ /student                │
│ faculty           │ FACULTY_MENTOR       │ OU_CSE (Department)  │ /faculty                │
│ coordinator       │ DEPT_COORDINATOR     │ OU_CSE (Department)  │ /faculty                │
│ hod               │ DEPARTMENT_HEAD      │ OU_CSE (Department)  │ /hod                    │
│ dean              │ SCHOOL_HEAD          │ CMP_MAIN (Campus)    │ /hod                    │
│ tpo_coordinator   │ TPO_COORDINATOR      │ CMP_MAIN (Campus)    │ /tpo                    │
│ tpo_admin         │ TPO_ADMIN            │ INSTITUTION          │ /tpo                    │
│ vice_chancellor   │ INSTITUTION_HEAD     │ INSTITUTION          │ /management             │
│ admin             │ INSTITUTION_ADMIN    │ INSTITUTION          │ /admin                  │
│ superadmin        │ SUPER_ADMIN          │ GLOBAL               │ /admin                  │
│ auditor           │ AUDITOR              │ INSTITUTION          │ /management             │
│ recruiter         │ RECRUITER_EXTERNAL   │ COMP001 (Accenture)  │ /tpo                    │
└───────────────────┴──────────────────────┴──────────────────────┴─────────────────────────┘
```

---

## 🛠️ Verification Commands

```powershell
# 1. Architecture Boundaries & Linter (0 warnings, 0 errors, Boundaries OK)
cd placeflow/frontend; npm run lint

# 2. Frontend Production Build & Vitest Unit Tests (18 test suites, 79/79 passed)
cd placeflow/frontend; npm run build; npm test -- --run

# 3. Backend Automated Pytest Suite (29/29 passed across ML, RAG, and Copilot suites)
& placeflow\.venv\Scripts\python.exe -m pytest placeflow/tests/test_rag_injected_knowledge.py placeflow/tests/test_copilot_ml_pipeline.py placeflow/tests/test_copilot_role_architecture.py placeflow/tests/test_ml_endpoints.py placeflow/tests/test_ml_foundation.py -v

# 4. Live Endpoint Verification (199 / 199 Verified)
& placeflow\.venv\Scripts\python.exe placeflow/scripts/verify_all_endpoints.py
```

---

<div align="center">

**Meridian Institutional Systems** &bull; [placeflow/](placeflow/)  
*Verifiable Academic & Career Excellence.*

</div>

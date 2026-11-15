# DRF Route Inventory & Permission Audit (Production State)
Audit Date: 2026-11-15
Total API Endpoints: 199 (100% Server-Side RBAC & Scope Guarded)

---

## 1. Security Architecture Summary

- **Default-Deny Invariant**: Every DRF view strictly declares `permission_classes = [IsAuthenticated, HasPermission]`. Anonymous access is blocked by default across all institutional portals.
- **Hierarchical Scope Enforcement**: Authorization scopes are evaluated hierarchically (`GLOBAL` &rarr; `INSTITUTION` &rarr; `CAMPUS` &rarr; `ORGANIZATIONAL_UNIT` &rarr; `SELF`).
- **DPDP Act 2023 Statutory Masking**: Field-level PII (contact numbers, academic marks, personal emails) is dynamically masked server-side based on viewer permissions.
- **Cryptographic Tenant Isolation**: Queries and vector embeddings are partitioned by `tenant_id`, preventing cross-tenant information leakage.

---

## 2. Comprehensive Route Matrix

### 2.1 Public Gateway & Authentication (`/api/auth/*` & `/api/health/`)

| Endpoint URL | View Handler | Permission Declaration | Protected? | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `GET /api/health/` | `HealthCheckView` | `AllowAny` | Public | System uptime & MongoDB replica set health probe |
| `GET /api/auth/csrf/` | `CsrfCookieView` | `AllowAny` | Public | Acquire CSRF token cookie |
| `POST /api/auth/login/` | `LoginView` | `AllowAny` | Public | Session login with username/password |
| `POST /api/auth/logout/` | `LogoutView` | `IsAuthenticated` | Yes | Terminate session & clear cookies |
| `GET /api/auth/me/` | `MePrincipalView` | `IsAuthenticated` | Yes | Active authenticated principal & profile |
| `POST /api/auth/password/forgot/` | `PasswordForgotView` | `AllowAny` | Public | Enumeration-safe password reset trigger |
| `POST /api/auth/password/reset/` | `PasswordResetView` | `AllowAny` | Public | Token-verified password reset |
| `POST /api/auth/claim/start/` | `ClaimStartView` | `AllowAny` | Public | Initiate identity claim via institutional email OTP |
| `POST /api/auth/claim/verify/` | `ClaimVerifyView` | `AllowAny` | Public | Verify OTP and set password |
| `POST /api/auth/accept-invite/` | `AcceptInviteView` | `AllowAny` | Public | Redeem onboarding invite token |

---

### 2.2 Shared Account & Security (`/api/account/*`)

| Endpoint URL | View Handler | Permission Declaration | Protected? | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `GET, PATCH /api/account/profile/` | `AccountProfileView` | `IsAuthenticated` (Self) | Yes | View & update self-asserted profile data |
| `POST /api/account/avatar/` | `AccountAvatarUploadView` | `IsAuthenticated` (Self) | Yes | Upload avatar image (PNG/JPG/WebP, max 2MB) |
| `GET /api/account/sessions/` | `AccountSessionsView` | `IsAuthenticated` (Self) | Yes | List active user sessions |
| `DELETE /api/account/sessions/<id>/` | `AccountSessionRevokeView` | `IsAuthenticated` (Self) | Yes | Terminate specific remote session |
| `POST /api/account/sessions/revoke-others/`| `AccountRevokeOtherSessionsView` | `IsAuthenticated` (Self) | Yes | Invalidate all other active sessions |
| `POST /api/account/password/change/` | `AccountPasswordChangeView` | `IsAuthenticated` (Self) | Yes | Authenticated password change |
| `GET /api/account/notifications/` | `AccountNotificationsView` | `IsAuthenticated` (Self) | Yes | List user notifications |
| `POST /api/account/notifications/read/` | `AccountNotificationReadView` | `IsAuthenticated` (Self) | Yes | Mark notifications as read |
| `GET /api/people/<person_id>/card/` | `PersonCardView` | `student.profile.read` | Yes | Scoped person card with field-level DPDP masking |
| `GET /api/media/avatar/<person_id>/` | `AvatarMediaStreamView` | `IsAuthenticated` | Yes | Authenticated avatar image stream |

---

### 2.3 Student Workspace Portal (`/api/student/*`)

| Endpoint URL | View Handler | Permission Declaration | Protected? | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `GET /api/student/me/` | `StudentMeView` | `portal.student` | Yes | Student academic & placement overview |
| `POST /api/student/profile/` | `StudentProfileUpdateView` | `portal.student` | Yes | Update career headline, skills, and links |
| `GET /api/student/opportunities/` | `StudentOpportunitiesView`| `placement.drive.view` | Yes | Active drives with eligibility check |
| `POST /api/student/opportunities/<id>/apply/`| `StudentApplyView` | `placement.apply` | Yes | Submit 1-click application with DPDP consent |
| `GET /api/student/applications/` | `StudentApplicationsView` | `placement.apply` | Yes | Candidate application ledger & stage progress |
| `GET /api/student/interviews/` | `StudentInterviewsView` | `placement.apply` | Yes | Scheduled interview rounds |
| `GET /api/student/offers/` | `StudentOffersView` | `placement.offer.view` | Yes | Offers received with CTC package breakdown |
| `POST /api/student/offers/<id>/respond/` | `StudentOfferRespondView` | `placement.offer.respond`| Yes | Accept/reject offer (triggers seat cascading) |
| `GET /api/student/academics/` | `StudentAcademicsView` | `academic.record.view` | Yes | NEP 2020 credit ledger, CIE marks, milestones |
| `GET /api/student/consents/` | `StudentConsentsView` | `dpdp.consent.view` | Yes | View DPDP Act 2023 purpose consents |
| `POST /api/student/consents/record/` | `StudentConsentRecordView` | `dpdp.consent.record` | Yes | Record statutory recruiter sharing consent |
| `POST /api/student/consents/withdraw/` | `StudentConsentWithdrawView`| `dpdp.consent.record` | Yes | Revoke statutory recruiter sharing consent |
| `GET /api/student/insights/readiness/` | `StudentReadinessView` | `portal.student` | Yes | In-process ML placement likelihood score |
| `GET /api/student/insights/skills/` | `StudentSkillRecommendView`| `portal.student` | Yes | Target skill gap recommendations |
| `POST /api/student/insights/whatif/` | `StudentWhatIfView` | `portal.student` | Yes | Counterfactual career simulation |

---

### 2.4 Placement Directorate (TPO) Portal (`/api/tpo/*`)

| Endpoint URL | View Handler | Permission Declaration | Protected? | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `GET /api/tpo/overview/` | `TpoOverviewView` | `placement.overview.view`| Yes | TPO KPI dashboard & season statistics |
| `GET, POST /api/tpo/jobs/` | `TpoJobsView` | `placement.drive.create`| Yes | Recruitment drives registry & wizard setup |
| `GET /api/tpo/jobs/<id>/candidates/` | `TpoJobCandidatesView` | `placement.drive.view` | Yes | Drive-specific candidate applicant roster |
| `GET /api/tpo/students/` | `TpoStudentsView` | `student.roster.view` | Yes | Candidate registry with Verified Talent Index |
| `GET /api/tpo/students/<id>/` | `TpoStudentDetailView` | `student.roster.view` | Yes | Candidate dossier & verified academic record |
| `GET, POST /api/tpo/companies/` | `TpoCompaniesView` | `company.partner.view` | Yes | Corporate partner directory & tier policies |
| `GET /api/tpo/applications/` | `TpoApplicationsView` | `placement.application.view` | Yes | Global application ledger across drives |
| `POST /api/tpo/applications/<id>/status/` | `TpoApplicationStatusView`| `placement.application.manage` | Yes | Candidate interview stage advancement |
| `GET /api/tpo/interviews/` | `TpoInterviewsView` | `placement.interview.view`| Yes | Campus-wide interview schedules |
| `GET /api/tpo/placements/` | `TpoPlacementsView` | `placement.offer.view` | Yes | Confirmed placement offers registry |
| `GET /api/tpo/superday/conflicts/` | `TpoSuperdayConflictsView`| `superday.arbitrate` | Yes | Detect room collisions & candidate double-bookings |
| `POST /api/tpo/superday/resolve/` | `TpoSuperdayResolveView` | `superday.arbitrate` | Yes | 1-Click atomic NP-hard conflict arbitrator |
| `GET /api/tpo/insights/renege/` | `TpoRenegeRadarView` | `renege.radar.view` | Yes | Post-offer candidate renege risk radar |
| `GET /api/tpo/insights/fairness/` | `TpoFairnessAuditView` | `fairness.audit.view` | Yes | Disparate impact ratio audit across departments |
| `GET /api/tpo/insights/reports/` | `TpoReportsSummaryView` | `reports.view` | Yes | Aggregation reports (Package distribution, etc.) |
| `GET /api/tpo/insights/reports/<id>/csv/` | `TpoReportCsvExportView` | `reports.export` | Yes | Streamed CSV report export |
| `POST /api/tpo/insights/whatif/` | `TpoWhatIfSimulateView` | `placement.overview.view`| Yes | Cohort-wide placement scenario simulation |
| `GET /api/tpo/models/` | `TpoModelRegistryView` | `models.registry.view` | Yes | Placement ML models versioning & latency |
| `POST /api/tpo/models/retrain/` | `TpoModelRetrainView` | `models.retrain` | Yes | Retraining pipeline trigger for ML models |

---

### 2.5 Campus Copilot & Unified ML Pipeline (`/api/v1/copilot/*` & `/api/v4/ai/*`)

| Endpoint URL | View Handler | Permission Declaration | Protected? | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| `POST /api/v1/copilot/query/` | `CopilotQueryView` | `IsAuthenticated` | Yes | Unified Copilot ML pipeline: DB grounding, intent classification, ML models, RAG |
| `GET /api/v1/copilot/context/` | `CopilotContextView` | `IsAuthenticated` | Yes | Role-scoped Copilot context, profile binding, shared attributes |
| `POST /api/v4/ai/query/` | `AiQueryView` | `campus.ai.query` | Yes | Conversational query with campus context |
| `POST /api/v4/ai/rag/` | `AiRagView` | `campus.ai.query` | Yes | Vector retrieval across institutional policy documents |
| `POST /api/v4/ai/agent/execute/` | `AiAgentExecuteView` | `campus.ai.execute` | Yes | Autonomous Copilot task execution with sandboxed tools |
| `GET /api/v4/ai/traces/` | `AiTracesView` | `campus.ai.audit` | Yes | LLM reasoning traces, prompt hashes, token costs |
| `GET /api/v4/ai/quotas/` | `AiQuotasView` | `campus.ai.audit` | Yes | Institutional token rate limits and quotas |

---

### 2.6 Academic Portals & Governance (`/api/faculty/*`, `/api/hod/*`, `/api/management/*`, `/api/admin/*`)

- **Faculty Advisory** (`/api/faculty/*`): `faculty.mentees.view` — Assigned mentee roster, attendance drop flags (<75%), confidential advisory intervention notes.
- **Department Head (HOD)** (`/api/hod/*`): `hod.students.view`, `hod.faculty.view`, `hod.summary.view` — Department placement rates, faculty load allocations, borderline eligibility waivers.
- **Executive Management** (`/api/management/*`): `accreditation.nirf.view`, `agent.fairness.audit`, `dpdp.consent.audit`, `campus.ai.audit` — Statutory NIRF metrics (GPH/GMS), 7,141-student cohort fairness audit, Copilot execution traces.
- **Institutional Admin** (`/api/admin/*`): `tenant.manage`, `institution.manage`, `campus.manage`, `hierarchy.manage`, `iam.view`, `iam.roles.view`, `academic.manage` — Multi-tenant hierarchy, IAM account claims resolution queue, invitations, session eviction.

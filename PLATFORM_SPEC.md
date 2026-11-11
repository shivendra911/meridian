# Meridian Platform Spec: Identity, Profiles, Cards, Shell, Journeys

Builds on `docs/RBAC_SPEC.md`. Audited against commit `c71fe3e` (RBAC implemented). Public landing page is done (`03-landing-page.patch`).

## 0. What is missing today

| Gap | Evidence |
| :--- | :--- |
| `/auth/me` knows a name and a subject id, nothing else. No photo, email, department, designation, institution name. A profile card cannot be built from it | `Principal.to_dict()` in `api/auth/principal.py` |
| Person profile has no avatar, preferred name, headline, timezone, notification prefs | `camp_02/identities.create_person_identity` |
| Account-to-record link is a bare `person_id` string on `students/faculty/department_heads`. No status, no verifier, no history, one record type per person | `database/validation.py` |
| No way for a user to get an account: no invite, no claim, no forgot/reset, no change password | `camp_02/accounts.py` has `INVITED -> ACTIVE` but nothing drives it |
| No self-service security: cannot list or revoke own sessions (`revoke_all_account_sessions` exists, no list function) | `camp_02/sessions.py` |
| Six copies of the shell | `portals/*/layout.tsx`, about 175 lines each, same sidebar/switcher/badge code |
| Top bar shows no identity: no avatar menu, no profile, no settings | layouts only render a role badge and logout |
| Cards are ad hoc: two `StatCard`s, no entity cards, no profile card | `components/common`, `components/ui` |
| Login page ships a demo-account panel | `LoginPage.tsx` |

## 1. Identity model (industry standard: separate Person, Account, Affiliation, Role)

```
Person            the human. One per human per tenant. Profile fields live here.
  |-- Account(s)  how they sign in (username/email, password, status INVITED/ACTIVE/LOCKED/TERMINATED)
  |-- Affiliation(s)   links the person to institutional records, with a verification state
  |       student  -> students.student_id
  |       faculty  -> faculty.mentor_uid
  |       hod / dean -> department_heads / school_heads
  |-- RoleAssignment(s)  what they may do, and where (camp_02, exists)
  |-- ProfileExtension   self-asserted career data (students): skills, links, summary, resume
```

Rules:
1. **Verified vs self-asserted data are different things.** Official data (name as on record, reg no, program, CGPA, department, designation) comes from the institution, is read-only to the user, and is shown with a "Verified by institution" marker. Self-asserted data (preferred name, photo, headline, skills, links, phone) is editable, validated, and shown without that marker.
2. A person can hold several affiliations (faculty and mentor, student and later alumni). Portals come from permissions, not from affiliation type.
3. Roles never come from the profile. Editing a profile cannot change access.
4. Out of the box, the institution provisions people. Self-signup is only a *claim* of an existing record (section 3), never creation of a new one.

### 1.1 Data changes (update `database/validation.py` first, schemas are strict)

- `persons`: add `preferred_name`, `avatar` `{key, content_type, bytes, updated_at}`, `headline`, `locale`, `timezone`, `notification_prefs` `{email, in_app}`.
- New `person_affiliations`: `{affiliation_id, tenant_id, person_id, type: STUDENT|FACULTY|HOD|DEAN|ALUMNI, record_id, status: UNVERIFIED|VERIFIED|REVOKED, verified_by, verified_at, source: IMPORT|CLAIM|ADMIN, created_at}`. Unique `(tenant_id, type, record_id)` so a record belongs to one person. Backfill from the existing `person_id` fields.
- New `student_profiles`: `{student_id, tenant_id, summary, skills[], links[], resume_ref, updated_at}` (self-asserted only; never mix into `students`).
- New `account_tokens`: `{token_hash, account_id, purpose: INVITE|RESET|CLAIM_OTP, expires_at, used_at, attempts}`. Store hashes only; single use; TTL index.
- New `notifications`: `{notification_id, tenant_id, person_id, kind, title, body, link, created_at, read_at}` (the outbox in `camp_01/outbox.py` feeds it).

## 2. Profile API (server composes, client never joins)

| Endpoint | Purpose | Permission |
| :--- | :--- | :--- |
| `GET /api/auth/me/` | Add `profile`: `{display_name, preferred_name, avatar_url, headline, email, affiliation_label, institution_name, department}` and `unread_notifications` | authenticated |
| `GET /api/account/profile/` | Full composed profile: person, affiliations (with verification state), roles, extension | self |
| `PATCH /api/account/profile/` | Self-asserted fields only (allowlist). Reject unknown keys | self |
| `POST /api/account/avatar/` | Upload; allow png/jpg/webp, max 2 MB, re-encode, strip EXIF, store key not URL | self |
| `GET /api/people/<person_id>/card/` | Card for someone else. Fields returned depend on what the viewer's scope and permissions allow; masked fields are omitted, with `hidden: [..]` listing them | `student.profile.read` or same-institution directory permission |
| `GET /api/account/sessions/`, `DELETE /api/account/sessions/<id>/`, `POST /api/account/sessions/revoke-others/` | Own sessions (add a `list_account_sessions` function) | self |
| `POST /api/account/password/change/` | Needs current password; revokes other sessions | self |
| `GET /api/account/notifications/`, `POST .../read/` | Bell | self |

Avatar serving: `GET /api/media/avatar/<person_id>/` behind auth with cache headers, not a public bucket.

## 3. Account lifecycle (how a person gets in)

1. **Invite (primary).** Admin or cohort import creates Person + record + Account `INVITED`, and an `INVITE` token. `POST /api/auth/accept-invite/ {token, password}` sets the password, moves the account to `ACTIVE`, marks the affiliation `VERIFIED` (source `IMPORT`). Link expires in 7 days; admin can resend.
2. **Claim (self-service).** For students already in the system without an account.
   - Step 1 `POST /api/auth/claim/start/ {registration_no, institutional_email}`: find an unclaimed record. Always answer the same generic "If a record matches, we sent a code" message. Send a 6-digit OTP (`CLAIM_OTP`, 10 min, 5 attempts) to the *institutional email on file*, not an email the caller supplies.
   - Step 2 `POST /api/auth/claim/verify/ {claim_id, otp, password}`: creates the Account, sets the affiliation `VERIFIED` (source `CLAIM`).
   - Ambiguous or failed matches create a request in an admin queue (`GET/POST /api/admin/claims/`).
3. **Forgot / reset.** `POST /api/auth/password/forgot/` (generic response, rate limited), `POST /api/auth/password/reset/ {token, password}`; revokes all sessions.
4. **Admin tools.** Link or unlink an affiliation, resend invite, force password reset, deactivate. Each is audited and needs `iam.*` permissions; unlinking cannot remove the last affiliation of an active student without confirmation.
5. **Lifecycle events.** Graduation moves STUDENT to ALUMNI and drops student-portal permissions; leaving faculty revokes assignments; both keep the Person.

Dev email: log the link or OTP to the console when `DEBUG`; use an SMTP setting otherwise (`EMAIL_*` in `.env.example`).

## 4. Card system (`src/ui/cards/`)

Rules for every card: 16px padding, 8px radius, 1px border, no shadow at rest (`shadow-sm` on hover only for clickable cards); whole card is the click target and keyboard-focusable; header = title plus at most one badge; body = at most three meta rows; footer = one primary action; status is never colour alone (badge + icon + text); numbers `tabular-nums`; long text clamped with a `title`; a matching skeleton with the same dimensions; masked data renders as a "Hidden for your role" chip, not blank.

| Component | Contents |
| :--- | :--- |
| `Avatar` | image or initials on a deterministic muted colour; sizes 20/24/32/40/64/96; optional presence ring |
| `PersonChip` | avatar + name + role label; opens `ProfileCard` on hover/focus (popover) |
| `ProfileCard` | avatar, name, headline, role badges, department, "Verified by institution" marker, actions (View profile, Message later). Data from `/people/:id/card/` |
| `ProfileHeader` | profile page banner: large avatar, name, meta row (program, batch, reg no / designation, department), completeness meter with the next missing item, edit action |
| `StatCard` | one component (delete the duplicate): label, value, delta, optional help popover explaining the figure |
| `EntityCard` | base for the next five |
| `DriveCard` | company mark, role, tier badge, CTC (`₹32 LPA`), deadline countdown, eligibility chip (Eligible / Not eligible with reason), Apply |
| `ApplicationCard` | drive summary + `StageStepper` + last update |
| `InterviewCard` | date/time, round, mode, venue or link, Add to calendar |
| `OfferCard` | CTC, respond-by countdown, Accept / Decline with confirm dialog |
| `CompanyCard` | mark, industry, location, active drives, last visit |
| `TaskCard` | "needs your attention" item: icon, one line, due, primary action. Used on every portal Home |
| `EmptyState` / `ErrorState` / `Skeleton` | one pattern each, reused inside cards and tables |

Formatting helpers in `src/ui/format.ts`: `formatLpa`, `formatDate`, `formatRelative`, `formatDeadline`, `initials`, `maskedChip`. Nothing formats inline.

## 5. App shell (replace six layouts with one)

`app/shell/AppShell.tsx` takes `{ portal, nav }` and renders `Sidebar`, `TopBar`, `Breadcrumbs` (from route `handle.crumb`), `<Outlet/>`. Each `portals/<p>/layout.tsx` becomes about ten lines. Required in the top bar:

- Global search (the existing command palette), Ctrl+K hint.
- **Workspace switcher** (only if `me.portals.length > 1`), listing portals by name with icons.
- **Notifications bell** with unread count and a popover list.
- **User menu**: avatar button opens a panel with the user's mini `ProfileCard` (name, email, role, institution), View profile, Account settings, Switch workspace, Keyboard shortcuts, Sign out.
- A banner when a delegation or break-glass is active ("Acting as ... until ...").

## 6. Account area (shared, outside the portals)

`src/account/` at `/account/*`, requires only authentication, never imports a portal:

| Route | Content |
| :--- | :--- |
| `/account/profile` | `ProfileHeader`; verified section (read-only, with the marker) and editable section; avatar upload with crop; completeness |
| `/account/security` | change password, active sessions with "this device" and revoke, revoke all others |
| `/account/notifications` | channels and kinds |
| `/account/privacy` | consents given and withdrawn (existing consent API), download my data, request correction |

A student's career profile (skills, links, resume) is a tab on `/student/profile`, since it is student-only.

## 7. Public and auth pages

`/` landing (done); `/login`; `/forgot-password`; `/reset-password?token=`; `/accept-invite?token=`; `/claim` (identify, verify code, set password); `/privacy`, `/terms`, `/contact`; first-login onboarding. Rules: show the demo-account panel only when `import.meta.env.DEV`; wrong password and unknown user show the same message; preserve `?next=`; an expired session shows a "Session expired, sign in again" dialog that keeps unsaved work in place; a signed-in user visiting `/login` is redirected to their home.

**First-login onboarding** (full-screen stepper shown once, tracked by `person.onboarded_at`): confirm your details (read-only verified data plus fix-request link), add a photo (skippable), accept consent notices (DPDP), choose notification preferences, then land on Home with a completeness card.

## 7.1 Polish for a platform feel

Page titles per route (`document.title`), 404/403/500 pages with a way home, a toast system (already `sonner`), a keyboard shortcuts dialog (`?`), a help menu linking to a support contact, consistent loading skeletons, remembered table filters per user, and a footer with version. Respect `prefers-reduced-motion`.

## 8. Tests

Backend: claim cannot target another person's record; OTP is single use, expires, and locks after 5 attempts; invite and reset tokens are single use and stored hashed; generic responses never reveal whether a record or account exists; card endpoint omits masked fields for a student viewing a student; avatar upload rejects non-images and oversized files; password change revokes other sessions; an affiliation record cannot belong to two people.
Frontend: `ProfileCard` renders masked state; `UserMenu` shows only the user's portals; `/account/*` reachable by every role; portals do not import `account/` internals (only the public exports); demo panel absent in production build.

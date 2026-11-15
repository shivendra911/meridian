# Meridian Production Component & Architecture Inventory

This document catalogs all production frontend components, layout shells, domain cards, and primitive devices implemented and verified across the platform.

---

## 1. UI Primitives (`src/components/ui/` & `src/ui/`)

| Component | Path | Purpose | Production Status | Design System Tokens & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `Button` | `src/components/ui/Button.tsx` | Standard action buttons | **Production Implemented & Tested** | Primary, secondary, ghost, danger, pill shape (48px mobile / 40px desktop), amber `now` variant. |
| `Badge` | `src/components/ui/Badge.tsx` | Status and meta chips | **Production Implemented & Tested** | Pill badges with semantic color tokens (neutral, success, warning, danger, brand). |
| `Card` | `src/components/ui/Card.tsx` | Card surface container | **Production Implemented & Tested** | 12px/16px radius, hairline borders (`border-slate-200/80`), subtle elevations. |
| `Select` | `src/components/ui/Select.tsx` | Cupertino-style dropdown | **Production Implemented & Tested** | Custom Select with frosted glass popover, keyboard navigable. |
| `Modal` | `src/components/ui/Modal.tsx` | Dialog popover | **Production Implemented & Tested** | Cupertino sheet modal with backdrop blur and WCAG focus trap. |
| `SlideOverDrawer` | `src/components/ui/SlideOverDrawer.tsx` | Drawer container | **Production Implemented & Tested** | Right-sliding panel with backdrop dismiss and keyboard ESC handler. |
| `StatCard` | `src/components/ui/StatCard.tsx` | KPI display card | **Production Implemented & Tested** | Clean typography, numeric tabular figures, contextual delta indicator. |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Empty container placeholder | **Production Implemented & Tested** | Icon + title + message + actionable primary button. |
| `Skeleton` | `src/components/ui/Skeleton.tsx` | Loading state placeholder | **Production Implemented & Tested** | Pulse-animated shimmer with 1:1 geometry match to target components. |
| `Tabs` | `src/components/ui/Tabs.tsx` | Tab strip navigation | **Production Implemented & Tested** | Underline and pill variants with keyboard arrow-key navigation. |
| `Switch` | `src/components/ui/Switch.tsx` | Toggle switch | **Production Implemented & Tested** | iOS/macOS styled spring-animated toggle switch. |
| `MacOsLoadingScreen` | `src/components/ui/MacOsLoadingScreen.tsx` | Route loading fallback | **Production Implemented & Tested** | Smooth spinner + status text + indeterminate progress bar. |
| `PageHeader` | `src/components/ui/PageHeader.tsx` | Page title & action bar | **Production Implemented & Tested** | Sentence-case display heading, contextual breadcrumbs, right-aligned action toolbar. |

---

## 2. Universal Redesign Devices (`src/ui/`)

| Device | Path | Purpose | Production Status | Design Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `Spine` | `src/ui/Spine.tsx` | Stage progression tracker | **Production Implemented & Tested** | Thin horizontal stage tracker with amber "you are here" node, completed checks, and future steps. |
| `StateBlock` | `src/ui/StateBlock.tsx` | Color-blocked hero cards | **Production Implemented & Tested** | Full-bleed, 24px radius blocks (navy, teal, paper, slate) with contrast-safe typography. |
| `Receipt` | `src/ui/Receipt.tsx` | Real-work audit receipt | **Production Implemented & Tested** | Sequential confirmation lines with timestamps, transaction IDs, and cryptographic seals. |
| `EligibilityLedger` | `src/ui/EligibilityLedger.tsx` | Candidate criteria breakdown | **Production Implemented & Tested** | Rule-by-rule eligibility breakdown with green ✓, red ✗, and remediation action hints. |
| `BottomTabBar` | `src/ui/BottomTabBar.tsx` | Mobile-first student nav | **Production Implemented & Tested** | 4-tab sticky bottom navigation bar (Home, Opportunities, Applications, Profile) for 390px phone screens. |
| `TopNavBar` | `src/ui/TopNavBar.tsx` | Desktop student navigation | **Production Implemented & Tested** | Sleek horizontal top bar for student desktop experience with search and notifications. |
| `PeekPanel` | `src/ui/PeekPanel.tsx` | Contextual slide-in details | **Production Implemented & Tested** | Right-side drawer for inspecting student dossiers, drive specs, and conflict details. |
| `PipelineBoard` | `src/ui/PipelineBoard.tsx` | Recruitment stage board | **Production Implemented & Tested** | Stage-by-stage Kanban columns with accessible "Move to" actions and candidate chips. |
| `EligibilityExplainerDrawer` | `src/ui/EligibilityExplainerDrawer.tsx` | Criteria explainer drawer | **Production Implemented & Tested** | Deep-dive explanation drawer detailing why a student is eligible or ineligible for a drive. |

---

## 3. Domain & 5-State Card System (`src/ui/cards/`)

Every card strictly implements the **5 Deterministic States**: `Default`, `Loading`, `Empty`, `Error`, and `Masked` (DPDP Act 2023 compliance).

| Component | Path | Current Pattern | Production Status |
| :--- | :--- | :--- | :--- |
| `Avatar` | `src/ui/cards/Avatar.tsx` | Deterministic initials / image on pastel background, sizes 20/24/32/40/56/96, presence ring | **Production Implemented & Tested** |
| `CompanyMark` | `src/ui/cards/CompanyMark.tsx` | Deterministic company monogram tile with brand color hashing | **Production Implemented & Tested** |
| `PersonChip` | `src/ui/cards/PersonChip.tsx` | Avatar + name + role chip with hover/focus popover | **Production Implemented & Tested** |
| `ProfileCard` | `src/ui/cards/ProfileCard.tsx` | Mini profile card popover with field-level DPDP privacy masking | **Production Implemented & Tested** |
| `ProfileHeader` | `src/ui/cards/ProfileHeader.tsx` | Large profile page banner with completion meter and edit triggers | **Production Implemented & Tested** |
| `DriveCard` | `src/ui/cards/DriveCard.tsx` | Drive summary with CTC, tier, countdown, and inline eligibility check | **Production Implemented & Tested** |
| `ApplicationCard`| `src/ui/cards/ApplicationCard.tsx`| Drive summary + universal `<Spine>` stage tracker | **Production Implemented & Tested** |
| `InterviewCard` | `src/ui/cards/InterviewCard.tsx` | Scheduled slot with round, venue, time, and calendar export | **Production Implemented & Tested** |
| `OfferCard` | `src/ui/cards/OfferCard.tsx` | Offer details, compensation breakdown, respond countdown, renege risk | **Production Implemented & Tested** |
| `CompanyCard` | `src/ui/cards/CompanyCard.tsx` | Corporate partner card with tier badge, active drives, and tier policy | **Production Implemented & Tested** |
| `TaskCard` | `src/ui/cards/TaskCard.tsx` | Urgent "What Needs Me Now" triage item on portal homepages | **Production Implemented & Tested** |
| `SummaryStrip` | `src/ui/cards/SummaryStrip.tsx` | Compact horizontal KPI strip with percentage trends | **Production Implemented & Tested** |

---

## 4. Shell & Layout Navigation (`src/app/shell/` & `src/portals/*/`)

| Component | Path | Purpose | Production Status |
| :--- | :--- | :--- | :--- |
| `AppShell` | `src/app/shell/AppShell.tsx` | Unified portal shell (Sidebar + TopBar + UserMenu + CommandPalette) | **Production Implemented & Tested** |
| `Sidebar` | `src/app/shell/Sidebar.tsx` | Responsive sidebar navigation with role-scoped links and portal switcher | **Production Implemented & Tested** |
| `TopBar` | `src/app/shell/TopBar.tsx` | 56px top bar with breadcrumbs, command search trigger, notifications, user avatar | **Production Implemented & Tested** |
| `UserMenu` | `src/app/shell/UserMenu.tsx` | User profile popover with workspace switcher, security, and sign out | **Production Implemented & Tested** |
| `StudentShell` | `src/portals/student/StudentShell.tsx` | Specialized shell for students: TopNavBar on desktop, BottomTabBar on mobile | **Production Implemented & Tested** |
| `InsightsNav` | `src/portals/tpo/components/InsightsNav.tsx` | Sub-navigation bar across TPO analytics spaces (Overview, Season, Renege, Fairness, Superday, Models, Reports) | **Production Implemented & Tested** |

---

## 5. Campus Copilot & Machine Learning Touchpoints (`src/components/ai/` & Portals)

| Component / Page | Path | Purpose | Production Status |
| :--- | :--- | :--- | :--- |
| `CampusCopilotDrawer` | `src/components/ai/CampusCopilotDrawer.tsx` | Full-height slide-over drawer with role persona, context grounding, ML tool triggers | **Production Implemented & Tested** |
| `FloatingCopilotTrigger` | `src/components/ai/FloatingCopilotTrigger.tsx` | Floating launcher button with role badge and quick-suggestion pills | **Production Implemented & Tested** |
| `WhatIfPage` | `src/portals/student/pages/WhatIfPage.tsx` | Interactive career & CGPA boost simulator with counterfactual package intervals | **Production Implemented & Tested** |
| `ModelRegistryPage` | `src/portals/tpo/pages/ModelRegistryPage.tsx` | TPO model governance cockpit: versioning, latency, feature importance, retraining | **Production Implemented & Tested** |

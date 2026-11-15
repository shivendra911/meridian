# Meridian Component & Architecture Inventory (Pre-Redesign Baseline)

This document catalogs existing frontend components prior to the Journey Redesign execution.

## 1. UI Primitives (`src/components/ui/` & `src/ui/`)

| Component | Path | Purpose | Current State | Target in Redesign |
| :--- | :--- | :--- | :--- | :--- |
| `Button` | `src/components/ui/Button.tsx` | Standard action buttons | Has primary, secondary, ghost, danger | Add pill shape (48px phone / 40px desktop), amber `now` variant |
| `Badge` | `src/components/ui/Badge.tsx` | Status and meta chips | Pill/rounded badges with variants | Keep, ensure status colors match redesign tokens |
| `Card` | `src/components/ui/Card.tsx` | Card surface container | Standard rounded-xl card | 12px radius, hairline dividers, only for openable items |
| `Select` | `src/components/ui/Select.tsx` | Cupertino-style dropdown | Custom Select with frosted popover | Keep |
| `Modal` | `src/components/ui/Modal.tsx` | Dialog popover | Cupertino sheet modal | Keep, ensure WCAG focus trap |
| `SlideOverDrawer` | `src/components/ui/SlideOverDrawer.tsx` | Drawer container | Right-sliding drawer | Complement with `PeekPanel.tsx` |
| `StatCard` | `src/components/ui/StatCard.tsx` | KPI display card | Label, value, icon box, hint | Remove decorative icon boxes, ensure single clean pattern |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Empty container placeholder | Icon + title + message | Keep, standard empty state pattern |
| `Skeleton` | `src/components/ui/Skeleton.tsx` | Loading state placeholder | Shimmer container | Keep, ensure 1:1 geometry match |
| `Tabs` | `src/components/ui/Tabs.tsx` | Tab strip navigation | Underline / pill tabs | Keep |
| `Switch` | `src/components/ui/Switch.tsx` | Toggle switch | Cupertino toggle | Keep |
| `MacOsLoadingScreen` | `src/components/ui/MacOsLoadingScreen.tsx` | Route loading fallback | Spinner + message + progress bar | Keep for route suspensions |
| `PageHeader` | `src/components/ui/PageHeader.tsx` | Page title and action bar | Title, subtitle, actions right | Add display font option, sentence-case headings |

## 2. Domain & Card System (`src/ui/cards/`)

| Component | Path | Current Pattern | Target in Redesign |
| :--- | :--- | :--- | :--- |
| `Avatar` | `src/ui/cards/Avatar.tsx` | Initials or image on pastel background | Extend sizes (20/24/32/40/56/96), presence ring |
| `CompanyMark` | `src/ui/cards/CompanyMark.tsx` | Deterministic colored company monogram tile | Retain everywhere companies are displayed |
| `PersonChip` | `src/ui/cards/PersonChip.tsx` | Avatar + name + secondary role/id | Ensure popover card on hover/focus |
| `ProfileCard` | `src/ui/cards/ProfileCard.tsx` | Mini profile card popover with DPDP masking | Retain |
| `ProfileHeader` | `src/ui/cards/ProfileHeader.tsx` | Large profile page banner | Enhance with endowed progress Spine |
| `DriveCard` | `src/ui/cards/DriveCard.tsx` | Drive summary with Apply / Manage | Add inline eligibility ledger preview |
| `ApplicationCard`| `src/ui/cards/ApplicationCard.tsx`| Drive + stage stepper | Replace stepper with universal `<Spine>` |
| `InterviewCard`  | `src/ui/cards/InterviewCard.tsx`  | Scheduled slot with time & venue | Keep, integrate with day agenda |
| `OfferCard`      | `src/ui/cards/OfferCard.tsx`      | Offer details + respond countdown | Keep, add renege risk badge |
| `CompanyCard`    | `src/ui/cards/CompanyCard.tsx`    | Recruiter / company card | Keep |
| `TaskCard`       | `src/ui/cards/TaskCard.tsx`       | Urgent action item row | Keep, used on Home screens |
| `SummaryStrip`   | `src/ui/cards/SummaryStrip.tsx`   | Compact KPI summary strip | Keep |

## 3. Shell & Navigation (`src/app/shell/` & `src/portals/*/layout.tsx`)

| Component | Path | Current Status | Redesign Plan |
| :--- | :--- | :--- | :--- |
| `AppShell` | `src/app/shell/AppShell.tsx` | Universal shell (Sidebar + TopBar) | Keep for admin/management or refactor per portal |
| `Sidebar` | `src/app/shell/Sidebar.tsx` | 240px navy sidebar on all portals | **Eliminated for students**; replaced by top-bar on TPO |
| `TopBar` | `src/app/shell/TopBar.tsx` | 56px top bar with breadcrumbs & user menu | Refactored with 5 spaces for TPO |
| `StudentLayout` | `src/portals/student/layout.tsx` | Uses AppShell | Replaced by `StudentShell.tsx` (BottomTabBar + TopNavBar) |
| `TpoLayout` | `src/portals/tpo/layout.tsx` | Uses AppShell | Top-bar navigation with 5 spaces |
| `FacultyLayout` / `HodLayout` | `src/portals/*/layout.tsx` | Uses AppShell | Two-pane Desk layout |
| `ManagementLayout` | `src/portals/management/layout.tsx` | Uses AppShell | Scrolling story report |
| `AdminLayout` | `src/portals/admin/layout.tsx` | Uses AppShell | Setup checklist |

## 4. New Primitive Devices to Introduce

- `Spine.tsx`: Thin horizontal stage tracker with amber "you are here" node.
- `StateBlock.tsx`: Full-bleed, 24px radius color-blocked hero cards (navy, teal, paper, slate).
- `Receipt.tsx`: Real-work audit receipt with sequential confirmation lines.
- `EligibilityLedger.tsx`: Clear rule-by-rule eligibility breakdown with ✓/✗ and remediation hints.
- `BottomTabBar.tsx`: 4-tab mobile navigation bar for students (390px phone-first).
- `TopNavBar.tsx`: Desktop top bar for student portal.
- `PeekPanel.tsx`: Right-side slide-in drawer for TPO details.
- `SeasonTimeline.tsx`: Horizontal multi-month calendar timeline for recruitment season planning.
- `PipelineBoard.tsx`: Accessible recruitment stage board with "Move to" menus.

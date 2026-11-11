# Meridian Visual and UX Spec (follow exactly)

Audience: the frontend agent. Where this file and the existing code disagree, **this file wins**. Feel to aim for: a calm, neutral, data-dense business dashboard (think Linear, Stripe Dashboard, Workday): white surfaces on a light grey canvas, one navy brand colour, small precise type, strong alignment, no decoration that carries no meaning.

Read with `docs/RBAC_SPEC.md` and `docs/PLATFORM_SPEC.md`. This file defines only how things **look and are laid out**.

## 0. What is wrong in the current build (verified by rendering `/tpo/drives` and `/student/opportunities`)

1. The top bar is empty. It shows a breadcrumb and one stray `i` glyph at the far right. No search, no notifications, no user menu. Remove the glyph.
2. Breadcrumbs print the raw route slug (`drives`, `opportunities`). Show human labels from route `handle.crumb`.
3. Identity is plain text at the bottom of the sidebar, with the raw role code (`TPO_ADMIN`) or id (`STU001`). Move identity to a top-bar avatar menu and show human role names.
4. Jargon badges beside titles ("Live Registry", "Authoritative Feed") and titles like "Placement Drives (JNFs)". Delete the badges, rename the pages (section 11).
5. Every list page opens with four large KPI cards, each with an icon box that means nothing (same briefcase icon four times). Lists start with the list (section 6).
6. A "WORKSPACE" row in the sidebar repeats what the logo block already says.
7. **A bad API shape produces a blank white page.** Feeding `/tpo/home` an unexpected response throws `Cannot read properties of undefined (reading 'total_students')`; `/student/home` throws `opportunities.filter is not a function`. There is no error boundary. Fix: section 10.

## 1. Tokens (put in `index.css` `@theme`; replace hardcoded values everywhere)

### Colour
| Token | Value | Use |
| :--- | :--- | :--- |
| `canvas` | `#F6F7F9` | page background |
| `surface` | `#FFFFFF` | cards, tables, inputs |
| `surface-muted` | `#F9FAFB` | table header, filter bars, hover rows |
| `line` | `#E5E7EB` | all borders |
| `line-strong` | `#D1D5DB` | input borders, dividers that need weight |
| `ink` | `#111827` | headings, primary text |
| `ink-secondary` | `#374151` | body text in dense areas |
| `ink-muted` | `#6B7280` | captions, labels, helper text |
| `ink-faint` | `#9CA3AF` | placeholders, disabled |
| `brand` | `#0B1B3D` | sidebar, primary buttons, links |
| `brand-hover` | `#16295A` | primary hover |
| `brand-50` | `#EEF1F8` | selected row, active tab tint, focus fill |
| `accent` | `#8C1515` | **logo mark only**, and the single underline on the landing page. Never for buttons, badges or status |

Status pairs (text / background / border). Always shown as badge + icon + text, never colour alone:

| State | fg | bg | border |
| :--- | :--- | :--- | :--- |
| success | `#15803D` | `#ECFDF3` | `#ABEFC6` |
| warning | `#B54708` | `#FFFAEB` | `#FEDF89` |
| danger | `#B42318` | `#FEF3F2` | `#FECDCA` |
| info | `#175CD3` | `#EFF8FF` | `#B2DDFF` |
| neutral | `#344054` | `#F2F4F7` | `#E4E7EC` |

Text on `surface` must meet WCAG AA (4.5:1); on the navy sidebar, text is `#CBD5E1` (items), `#FFFFFF` (active), `#8A96B0` (section labels).

### Type (Inter only; `JetBrains Mono` only for IDs and codes at 12px)
| Role | Size / line | Weight | Notes |
| :--- | :--- | :--- | :--- |
| Page title (h1) | 24 / 32 | 600 | one per page, tracking -0.01em |
| Section title (h2) | 18 / 28 | 600 | |
| Card title (h3) | 15 / 24 | 600 | |
| Body | 14 / 20 | 400 | default |
| Small | 13 / 20 | 400 or 500 | table cells, nav items |
| Caption | 12 / 16 | 400 or 500 | **floor. Nothing smaller anywhere** (delete every `text-[9px]`, `text-[10px]`, `text-[11px]`) |
| KPI value | 28 / 32 | 600 | `tabular-nums` |
| Display | 48 / 52 | 600 | landing page only |

Sentence case everywhere. Uppercase only for sidebar section labels (12px, +0.04em tracking). Numbers: `tabular-nums`, format with `Intl.NumberFormat('en-IN')`. Money: `₹32 LPA`. Dates: `12 Nov 2026`; relative text (`in 3 days`) with the absolute date in a tooltip.

### Space, radius, elevation, motion
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48, 64. Nothing else.
- Radius: 6 badges and chips, 8 buttons, inputs, cards, 12 modals and large panels, full avatars and pills.
- Borders: 1px `line`. No shadows at rest. Shadows only: popover and menu `0 8px 24px rgb(16 24 40 / .12)`, drawer same, modal `0 20px 48px rgb(16 24 40 / .18)`, clickable-card hover `0 1px 2px rgb(16 24 40 / .08)`.
- Motion: 150ms ease-out for hover and colour; 200ms for drawer and modal; skeleton shimmer 1.2s. Honour `prefers-reduced-motion`.
- Breakpoints: 640, 768, 1024, 1280, 1536.
- Focus: 2px `brand` ring with 2px offset on every interactive element. Never remove it.

## 2. App shell (one component, all portals)

```
+----------+--------------------------------------------------------------+
| Sidebar  | TopBar (56px)                                                |
| 240px    |--------------------------------------------------------------|
|          |  Content (max-width 1280, centred, padding 32)               |
|          |                                                              |
+----------+--------------------------------------------------------------+
```

**Sidebar** (`bg-brand`, 240px; 64px collapsed with tooltips; below 1024px it is an off-canvas drawer opened by a hamburger in the top bar)
- Header, 56px, aligned with the top bar: 32px logo mark + `Meridian` 15/600 white, portal name under it 12px `#8A96B0`. If the user has more than one portal, the header is a button opening the workspace switcher.
- Nav: groups separated by 16px; group label 12px uppercase `#8A96B0`, 12px left padding. Items 36px high, 8px radius, 12px horizontal padding, icon 16px (Lucide, 1.5 stroke) + 8px gap + label 13/500. Default `#CBD5E1`; hover `bg-white/8`; **active `bg-white/12`, white text, 2px white bar on the left edge**. Badge (count) right-aligned, 12px.
- Footer: Help and Collapse only. No user block, no role badge, no "WORKSPACE" row.

**TopBar** (`bg-surface`, 56px, 1px bottom border)
- Left: breadcrumbs, 13px. Parent crumbs `ink-muted`, current `ink` 500, separator `/` in `ink-faint`. Max 3 levels; truncate middle.
- Centre-left: search field 320px wide, 36px high, placeholder `Search students, drives, companies`, `Ctrl K` hint chip inside on the right. Opens the command palette. Below 768px it collapses to an icon button.
- Right (gap 8): notifications bell (36px icon button, red-dot count max `9+`), help icon button, **user avatar button (32px)**. At 1280px and above, show the name (13/500) next to the avatar.
- User menu panel, 280px: mini profile (40px avatar, name 14/600, email 13 muted, role label 12 as a neutral badge, institution 12 muted), divider, `View profile`, `Account settings`, `Switch workspace` (only when more than one portal; each row has the portal icon and name, current one checked), `Keyboard shortcuts`, divider, `Sign out`.
- Delegation or break-glass banner: full width under the top bar, 40px, warning colours, text `Acting as {name} until {time}`, with an `End` button.

## 3. Component specs

| Component | Exact spec |
| :--- | :--- |
| **Button** | Heights 32 (sm), 36 (md, default), 40 (lg). Horizontal padding 12 / 16 / 20. Radius 8. 13/500 (sm, md), 14/500 (lg). `primary`: `bg-brand` white text, hover `brand-hover`. `secondary`: white, 1px `line-strong`, `ink` text, hover `surface-muted`. `ghost`: transparent, hover `surface-muted`. `danger`: `#B42318` fill, white text. Icon 16px with 8px gap. Loading state shows a 16px spinner and keeps the width. Disabled is `ink-faint` on `surface-muted`, `cursor-not-allowed`. One primary button per view region |
| **Input / Select** | 36px, radius 8, 1px `line-strong`, 12px padding, 14px text. Focus: border `brand` + 2px ring `brand-50`. Label above, 13/500; helper below, 12 muted; error below, 12 `danger` with icon. Required marks via text `(required)` not asterisks |
| **Badge** | 20px high, 6px radius, 8px horizontal padding, 12/500, optional 12px leading icon. Status pairs from section 1 |
| **Tabs** | Underline style, 40px high, 13/500. Active: `ink` text, 2px `brand` underline. Inactive `ink-muted`. Count appears as a neutral pill after the label. Tab row has a 1px `line` bottom border |
| **Table** | Card wrapper (white, 1px line, radius 8, overflow hidden). Header row 40px, `surface-muted`, 12/500 `ink-muted`, sentence case. Body rows 48px, 13/400, 1px `line` between rows, no zebra, hover `surface-muted`, selected `brand-50`. First column 500 `ink`. Numeric columns right-aligned `tabular-nums`. Row click opens detail; row actions in a final 40px kebab column. Sticky header. Footer 48px: `1-25 of 1,284`, page size select, prev/next. Under 768px each row becomes a card |
| **Card** | `surface`, 1px `line`, radius 8, padding 20 (16 compact). Header: title 15/600 left, optional action right, 16px below. No nested cards |
| **StatCard** | Padding 16. Label 12/500 `ink-muted`; value 28/32 600 `tabular-nums` 8px below; delta line 12px below with arrow icon + text in status colour. **No decorative icon box.** Optional help icon opens a popover explaining the figure. One component only; delete the duplicate |
| **Drawer** | Right side, 480 (detail) or 640 (form) wide, full height, header 56px with title and close, footer 64px with actions, scrim `black/30` |
| **Modal** | 480 (confirm), 640 (form), 800 (wizard). Radius 12. Header 56, body padding 24, footer 64. Focus trapped, Esc closes, returns focus to trigger |
| **Toast** | `sonner`, bottom-right, 360px, success/error/info with icon; errors do not auto-dismiss |
| **EmptyState** | 48px circle `surface-muted` with 24px icon; title 14/600; body 13 `ink-muted` max 360px; at most one primary action. 48px vertical padding. No dashed borders |
| **ErrorState** | Same layout with a `danger` icon; message from `ApiError.code`, a `Try again` button, and a request id in 12px mono |
| **Skeleton** | Same size and radius as the thing it replaces; `surface-muted` base, shimmer. A table skeleton is 6 rows |

## 4. Entity and profile cards (build in `src/ui/cards/`)

All cards: 16px padding, 8px radius, 1px `line`; clickable cards get the hover shadow, a visible focus ring, and the **whole card is the link**. Header holds the title plus at most one badge, body at most three meta rows, footer one primary action.

```
DriveCard  (320-420px wide, 3 per row at 1280)
+--------------------------------------------------+
| [N]  Software Engineer                [Super Dream]|   mark 40px, title 15/600, tier badge
|      Northwind Systems                             |   13 ink-muted
|                                                    |
|  Rs 32 LPA   Bengaluru   Closes in 3 days          |   13, icon + text, 12px gaps
|  (check) You are eligible          [ Apply ]       |   eligibility chip left, button right
+--------------------------------------------------+
Not eligible variant: chip is neutral "Not eligible: CGPA 7.0 needed (you have 6.4)" with a "Why?" link.

ApplicationCard
+--------------------------------------------------+
| [N]  Software Engineer, Northwind Systems  [Interview]|
|  Applied o--------o--------(o)--------o  Offer       |   StageStepper: done = filled brand,
|          Shortlisted  Interview                      |   current = ring, upcoming = grey
|  Last update: Interview scheduled for 14 Nov, 10:00  |
+--------------------------------------------------+

ProfileCard (popover, 320px wide, opens on hover/focus of a PersonChip after 300ms)
+--------------------------------------------+
| (AS)  Aarav Sharma                          |   avatar 56px
|       B.Tech CSE, Semester 7                |
|       [Student]  [Verified by institution]  |
|  --------------------------------------------|
|  CGPA 8.45     Reg no 2023CSB001            |   only fields the viewer may see;
|  Hidden for your role: Phone, Email         |   masked ones listed as a muted chip
|  [ View profile ]                           |
+--------------------------------------------+

ProfileHeader (top of a profile page)
+---------------------------------------------------------------+
| (  AS  )  Aarav Sharma                       [ Edit profile ]  |   avatar 96px, name 24/32
|  96px     B.Tech CSE, 7th semester, 2023CSB001                 |
|           [Student] [Verified by institution]                  |
|  Profile completeness  [=======---] 72%   Next: add a photo    |
+---------------------------------------------------------------+
```
Other cards (`InterviewCard`, `OfferCard`, `CompanyCard`, `TaskCard`, `PersonChip`) follow the same rules. `TaskCard` is a single-row list item: 32px icon, one line of text 14/500, due date 12 muted, primary action right. `OfferCard` shows CTC, `Respond by` countdown, and Accept / Decline (Decline needs a confirm modal).

Avatar: image, or initials on a deterministic muted colour (8 pastel pairs), sizes 20/24/32/40/56/96. Initials use 13/600 at 32px.

## 5. Page anatomy (every page)

```
PageHeader      title 24/32 600 . one-line description 14 muted (max 640px) . actions right
  24px
[ filter bar ]  search 36px left, filters right, no card wrapper, 40px high
  16px
[ content ]     table card, or card grid, or detail layout
```
- Page background `canvas`. Content padding 32 (24 below 1024, 16 below 640). Sections separated by 32.
- The title is plain text. A badge next to it appears only for a real state of the record (Draft, Live, Closed).
- Primary action top right, one per page.

## 6. List pages

A list page is: PageHeader, filter bar, table. **No KPI cards.** Put a one-line summary under the title instead (`12 open · 4 closing this week`) as 14px `ink-muted`, each count clickable to filter. Filter bar: search on the left, up to three filter selects, `Clear` link when active; filters persist in the URL query. Saved views are a later feature.

## 7. Detail pages

```
Breadcrumb: Drives / Software Engineer, Northwind
+----------------------------------------------------------------------+
| [N]  Software Engineer              [Live]     [ Edit ] [ Publish ]   |  summary band, 72px mark+title
|      Northwind Systems . Bengaluru . Rs 32 LPA . closes 14 Nov        |  meta row 13 muted
+----------------------------------------------------------------------+
| Overview | Eligibility | Applicants (84) | Interviews | Offers         |  tabs
+-------------------------------------------+--------------------------+
| main column (2fr)                          | side column (1fr), sticky |
| cards stacked, 16px gap                    | Key facts, Timeline,      |
|                                            | Owner (PersonChip)        |
+-------------------------------------------+--------------------------+
```
Secondary actions open a drawer, not a new page. The tab is in the URL (`?tab=applicants`).

## 8. Portal Home pages (answer "what needs me now")

Common structure: greeting row (`Good morning, Aarav` 24/32, date 14 muted), then `Needs your attention` (max 3 `TaskCard`s in one card, `View all` link), then two-column grid (2fr / 1fr) of cards, 16px gap. At most 4 `StatCard`s, all in one row, only if each is actionable.

| Portal | Left (2fr) | Right (1fr) |
| :--- | :--- | :--- |
| Student | Recommended drives (2 `DriveCard`s with eligibility), My pipeline (`ApplicationCard`s) | Next interview (`InterviewCard`), Profile completeness, Deadlines list |
| TPO | Funnel (applied to offered, horizontal bars), Drives needing action (table of 5) | Interview clashes, At-risk offers, Unplaced count |
| Faculty | Mentees needing attention (table of 5 with `PersonChip`) | Verification queue, Today |
| HOD | Department placement rate (single chart) + trend, At-risk students (table) | Curriculum approvals, Faculty workload |
| Management | Placement outcomes (chart), Compliance flags (table) | NIRF status, AI audit alerts |
| Admin | Onboarding checklist (progress), Recent role changes (table) | Pending access requests, System health |

Charts: Recharts, one series colour `brand`, comparison series `#8A96B0`, gridlines `line`, axis text 12px `ink-muted`, tooltip as a popover card. No 3D, no gradients, no pie charts for more than 4 slices.

## 9. Auth pages

Login is a two-column split. Left panel `bg-brand`, 45% width, hidden below 1024px: logo, headline 32/40 600 white `Every drive, every student, one system of record.`, three check-listed points, small footer text. Right panel: centred form 400px wide: title `Sign in` 24/32, one line of help, `Username or email`, `Password` (show/hide), `Forgot password?` right-aligned link, full-width primary `Sign in`, then a line `First time here? Claim your profile`. Errors appear above the button in a danger-tinted box with one generic message. The demo-account chooser renders only when `import.meta.env.DEV`, as a collapsed `Demo accounts` section.
Forgot, reset, accept-invite, claim: same split layout, same form width, one task per screen, a 3-dot progress indicator for the claim flow.

## 10. States and failure handling (every page and card)

- **Loading**: skeleton in the exact layout, never a centred spinner for a page. A button action shows an inline spinner.
- **Empty**: `EmptyState` with a next action. Different copy for "nothing yet" and "no results match filters" (the latter offers `Clear filters`).
- **Error**: `ErrorState` with retry.
- **Forbidden (403)**: full page, lock icon, `You do not have access to this page`, a button to the user's home.
- **Not found**: full page, `We could not find that page`, a button home.
- **Offline / 5xx**: banner under the top bar, `Reconnecting...`, auto retry.
- **Error boundary**: wrap the shell outlet and every route in a boundary that renders `ErrorState` (`Something went wrong on this page`) with `Reload` and a copyable error id, and logs the error. **The app must never render a blank page.**
- **Parse at the edge**: each portal `api.ts` validates responses (zod) and returns typed data or throws `ApiError('BadResponse')`. Components never dereference unvalidated API data.
- Masked data: `Hidden for your role` chip with a lock icon, never an empty cell.

## 11. Copy (apply to every string)

| Now | Use |
| :--- | :--- |
| Placement Drives (JNFs) | Drives |
| Live Registry, Authoritative Feed badges | remove |
| Campus Recruitment Drives | Opportunities |
| Create Placement Drive | New drive |
| Institutional Command Hub, Directorate | Home |
| `TPO_ADMIN`, `FACULTY_MENTOR`, ... | Placement officer, Faculty mentor, Head of department, Dean, Vice chancellor, Administrator, Student |
| `STU001` shown as identity | `2023CSB001` in 12px mono, secondary |
| "No placement drives registered" | "No drives yet" + one sentence + `New drive` |

Plain English, short sentences, no unprovable claims ("cryptographically auditable", "autonomous").

## 12. Responsive and accessibility

- 1280 and up: full layout. 1024-1279: sidebar stays, content padding 24, side column drops under main. Below 1024: sidebar becomes a drawer, tables with more than 4 columns become row cards below 768, modals become full-screen sheets below 640.
- Touch targets 44px below 768. All icon buttons have `aria-label`. Tables have `scope` headers. Tabs use the tab pattern with arrow-key navigation. Contrast AA. Everything usable by keyboard alone.

## 13. Order of work and acceptance

1. Tokens, type floor, and the shared `ui/` components (sections 1, 3). Then `AppShell`, `TopBar`, `UserMenu` (section 2). All six portals inherit.
2. Error boundary and API parsing (section 10). Then the failures in section 0 are closed.
3. Cards (section 4), then list and detail anatomy (sections 5-7) on TPO Drives and Student Opportunities as the reference pages.
4. Portal Homes (section 8), then login and auth pages (section 9), then copy pass (section 11).

Acceptance, per portal, with a seeded account: capture Playwright screenshots at 1440, 1024 and 390 wide for Home, one list page, one detail page and login, and attach them. A task is done only when: no text under 12px, no raw slugs or role codes visible, top bar shows search, bell and avatar, every page shows skeleton, empty and error states, killing the API or returning malformed JSON never produces a blank page, `npx tsc -b; npm run lint; npm run build` pass, and the boundary check passes.

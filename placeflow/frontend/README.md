# Meridian Frontend — Enterprise Institutional Client

The frontend client for **Meridian (PlaceFlow)**, built with React 19, TypeScript, Tailwind CSS v4, and Vite.

---

## 🏛️ Architecture Overview

The frontend implements **Role-Partitioned Workspaces** with strict boundaries to ensure clear separation of concerns across diverse university stakeholders:

```
src/
├── app/
│   ├── shell/               # AppShell (Sidebar, TopBar, UserMenu, CommandPalette)
│   ├── routes.tsx           # Global routing tree & authentication gates
│   └── __tests__/           # Universal parity & boundary validation tests
├── components/
│   ├── ai/                  # CampusCopilotDrawer & FloatingCopilotTrigger
│   ├── navigation/          # CommandPalette, SearchModal
│   └── ui/                  # Button, Badge, Card, Modal, Select, Tabs, etc.
├── core/
│   └── auth/                # AuthContext, AuthJourneys (/login, /claim, /onboarding)
├── portals/
│   ├── student/             # Candidate Command Center (/student/*) with StudentShell
│   ├── tpo/                 # Placement Directorate (/tpo/*) with InsightsNav
│   ├── faculty/             # Faculty Advisory (/faculty/*)
│   ├── hod/                 # Department Leadership (/hod/*)
│   ├── management/          # Executive NIRF & Fairness Governance (/management/*)
│   └── admin/               # IAM, Claims Queue & Tenant Topology (/admin/*)
├── account/                 # Shared Account & Security Area (/account/*)
└── ui/
    ├── cards/               # 5-State Domain Cards (Profile, Drive, Application, Offer, Task)
    ├── Spine.tsx            # Universal stage progression tracker
    ├── StateBlock.tsx       # 24px radius color-blocked hero cards
    ├── Receipt.tsx          # Real-work audit receipt component
    ├── EligibilityLedger.tsx# Rule-by-rule candidate criteria ledger
    ├── PipelineBoard.tsx    # Accessible recruitment stage board
    └── BottomTabBar.tsx     # Mobile-first 390px student navigation
```

---

## 🎨 Design System & Deterministic Invariants

1. **Deterministic 5-State Cards**:
   Every card (`ProfileCard`, `DriveCard`, `ApplicationCard`, `InterviewCard`, `OfferCard`, `CompanyCard`, `TaskCard`) strictly supports 5 states:
   - `Default`: Interactive card with real data.
   - `Loading`: Pulse-animated skeleton matching exact layout dimensions.
   - `Empty`: Contextual explanations with actionable next steps.
   - `Error`: Inline error state with retry triggers.
   - `Masked`: Field-level privacy obfuscation for unauthorized viewers under DPDP regulations.

2. **Universal Redesign Devices**:
   - `<Spine>`: Stage tracker with amber "you are here" node and completion checkmarks.
   - `<StateBlock>`: Color-blocked hero blocks (navy, teal, paper, slate).
   - `<Receipt>`: Verifiable audit trail receipts with sequential lines and cryptographic hash seals.
   - `<EligibilityLedger>`: Transparent criteria validation with green ✓ and red ✗ breakdown.

3. **Student Navigation Paradigm**:
   - **Desktop**: Clean horizontal `TopNavBar` with integrated search and notifications.
   - **Mobile (390px phone-first)**: 4-tab sticky `BottomTabBar` (Home, Opportunities, Applications, Profile).

4. **Campus Copilot Integration**:
   - `FloatingCopilotTrigger`: Quick floating launcher on bottom-right of pages.
   - `CampusCopilotDrawer`: Slide-over drawer providing role-based suggestions, context grounding, and ML tool triggers.

---

## 🛠️ Development & Quality Commands

```bash
# 1. Start Development Server (Vite @ http://127.0.0.1:5173)
npm run dev

# 2. Run Architectural Boundary Checks & Oxlint
npm run lint

# 3. Execute Frontend Unit & Integration Tests (Vitest)
npm test -- --run

# 4. Compile Production Build & Typecheck
npm run build
```

---

## 🧪 Verification Benchmarks

- **Vitest Suite**: 18 test files passed (79 / 79 unit and integration tests).
- **Linter (Oxlint)**: 0 warnings, 0 errors across 211 files with 109 rules.
- **Architectural Boundary Check**: `scripts/check-boundaries.mjs` verifies zero prohibited cross-portal imports.
- **TypeScript**: Strict mode with zero compilation errors (`tsc -b`).

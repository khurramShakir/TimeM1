# Task Checklist

## Core Features (MVP)
- [x] **[MVP-01] Database Setup**: Prisma schema for `User`, `BudgetPeriod`, `Envelope`, `Transaction`.
- [x] **[MVP-02] Seed Script**: Populate database with initial data (Work, Sleep, Leisure).
- [x] **[MVP-03] Dashboard UI**: Grid of envelopes with progress bars and remaining hours.
- [x] **[MVP-04] Transaction Logging**: Modal to log time (spent) against envelopes.
- [x] **[MVP-05] Data Fetching**: Server Actions for fetching budget data and summary.
- [x] **[MVP-06] Budget Transfer**: Server Action and UI to move budget between envelopes.

## Recent UI & Domain Refinements
- [x] **[REF-01] Feature: Multi-Domain Support**: Separate views for "Time" and "Money" management.
- [x] **[REF-02] UI Polish - Transaction Buttons**: Refined icons (Clock/Banknote) with white-bordered '+' sign badges.
- [x] **[REF-03] Feature: Weekly/Monthly Toggle**: High-level logic for different period types (Functional).
- [x] **[REF-04] Feature: Budget Chart**: Detailed Pie Chart for budget allocation (Verified).
- [x] **[REF-05] UI Polish - Round 13**: Final Hybrid Solution - Google 3D Pie + Recharts Bar (Stable) (Verified).

## Session History - Completed Work
- [x] **[HIST-01] Feature: Transaction List (History)**: Full CRUD - Create, Read, Update, Delete transactions.
- [x] **[HIST-02] UI Consistency**: Standardized fonts, icons, and emerald green theme.
- [x] **[HIST-03] Bug Fix**: Modal "screen vanish" and overlay click handling.
- [x] **[HIST-04] Funded Field Logic**: Added explicit `funded` vs `budgeted` tracking (Database & Logic).
- [x] **[HIST-05] UI Polish**: Multi-segment progress bars, mobile fixes, and consistent styling for Allocation Studio.

## Next Session - Priority Items
- [x] **[PRIO-01] Deployment**: Git setup and build for production.
- [/] **[PRIO-02] Dynamic Budgeting & Fill Flow**:
    - [x] Weekly Capacity (Time totals).
    - [x] Currency selection (with Canadian "C$" fix).
    - [x] Regional settings (Start of Week, Default Period).
    - [x] Dynamic Persistence (Copy from Previous Period).
    - [x] Unallocated Management (Automatic Buffer logic).
    - [x] Transfer Logic (Allow moves to/from Unallocated).
    - [x] Income Setup Screen ("Fill Envelopes" Flow).

    - [ ] Profile Management (View/Update name).
- [ ] **[PRIO-03] Date Picker**: Improved UX for selecting specific weeks/months.
- [ ] **[PRIO-04] Reports**: Advanced weekly/monthly summary reports.

## Session 07 - Refining Budgeting & UI
- [x] **[BUDG-01] Budget Manager UI Polish**:
    - [x] Add `funded` column to Budget Manager table.
    - [x] Update progress bar in Budget Manager to multi-segment (spent, available, unfunded gap).
    - [x] Ensure visual consistency with Dashboard `EnvelopeCard`.
    - [x] Refinement: Hide `Funded` column for Time domain (redundant).
- [x] **[BUDG-02] Allocation Studio Enhancement**:
    - [x] Add `funded` status to envelope cards in Fill Page.
    - [x] Show "Funded / Budgeted" indicator to guide users on remaining funding needs.
- [x] **[BUDG-03] Reports Page**:
    - [x] Create `/dashboard/reports` page.
    - [x] Implement advanced summary (Budgeted vs Funded vs Spent).
    - [x] Add breakdown by category and domain-specific insights.
    - [x] Add navigation links to Reports in Sidebar and Mobile Nav.
- [x] **[BUDG-04] Profile Management Polish**:
    - [x] Finalize any remaining profile update logic or UI tweaks.

## Backlog
...



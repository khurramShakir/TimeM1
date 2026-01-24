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

## Next Session - Priority Items
- [x] **[PRIO-01] Deployment**: Git setup and build for production.
- [/] **[PRIO-02] Dynamic Budgeting & Fill Flow**:
    - [x] Weekly Capacity (Time totals).
    - [x] Currency selection (with Canadian "C$" fix).
    - [x] Regional settings (Start of Week, Default Period).
    - [x] Dynamic Persistence (Copy from Previous Period).
    - [x] Unallocated Management (Automatic Buffer logic).
    - [x] Transfer Logic (Allow moves to/from Unallocated).
    - [ ] Income Setup Screen ("Fill Envelopes" Flow).

    - [ ] Profile Management (View/Update name).
- [ ] **[PRIO-03] Date Picker**: Improved UX for selecting specific weeks/months.
- [ ] **[PRIO-04] Reports**: Advanced weekly/monthly summary reports.

## Backlog
- [ ] **[LOG-01] Notifications**: Preferences for budget alerts or reminders.
- [ ] **[LOG-02] Custom Envelopes**: UI to create/delete envelopes (currently via Budget Manager).
- [x] **[LOG-03] Cloud Deployment**: Deploy to Google Cloud Run with public URL.
- [ ] **[LOG-04] Super Admin**: Screen to manage multiple users.



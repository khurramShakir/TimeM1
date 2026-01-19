# Task Checklist

## Core Features (MVP)
- [x] **Database Setup**: Prisma schema for `User`, `BudgetPeriod`, `Envelope`, `Transaction`.
- [x] **Seed Script**: Populate database with initial data (Work, Sleep, Leisure).
- [x] **Dashboard UI**: Grid of envelopes with progress bars and remaining hours.
- [x] **Transaction Logging**: Modal to log time (spent) against envelopes.
- [x] **Data Fetching**: Server Actions for fetching budget data and summary.
- [x] **Budget Transfer**: Server Action and UI to move budget between envelopes.

## Recent UI & Domain Refinements
- [x] **Feature: Multi-Domain Support**: Separate views for "Time" and "Money" management.
- [x] **UI Polish - Transaction Buttons**: Refined icons (Clock/Banknote) with white-bordered '+' sign badges.
- [x] **Feature: Weekly/Monthly Toggle**: High-level logic for different period types (Functional).
- [x] **Feature: Budget Chart**: Detailed Pie Chart for budget allocation (Verified).
- [x] **UI Polish - Round 13**: Final Hybrid Solution - Google 3D Pie + Recharts Bar (Stable) (Verified).

## Session 12/12/2025 - 01/13/2025 - Completed
- [x] **Feature: Transaction List (History)**: Full CRUD - Create, Read, Update, Delete transactions.
- [x] **UI Consistency**: Standardized fonts, icons, and emerald green theme.
- [x] **Bug Fix**: Modal "screen vanish" and overlay click handling.

## Next Session - Priority Items
- [ ] **Deployment**: Git setup and build for production.
- [ ] **Settings Page**: Customizable weekly totals, default categories, and profile management.
- [ ] **Date Picker**: Improved UX for selecting specific weeks/months.
- [ ] **Reports**: Advanced weekly/monthly summary reports.

## Backlog
- [ ] **Custom Envelopes**: UI to create/delete envelopes (currently via Budget Manager).
- [ ] **Cloud Deployment**: Deploy to Google Cloud Run with public URL.
- [ ] **Super Admin**: Screen to manage multiple users.
- [ ] **Reports**: Weekly/Monthly summary reports.


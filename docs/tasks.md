# Task Checklist

## Core Features (MVP)
- [x] **Database Setup**: Prisma schema for `User`, `BudgetPeriod`, `Envelope`, `Transaction`.
- [x] **Seed Script**: Populate database with initial data (Work, Sleep, Leisure).
- [x] **Dashboard UI**: Grid of envelopes with progress bars and remaining hours.
- [x] **Transaction Logging**: Modal to log time (spent) against envelopes.
- [x] **Data Fetching**: Server Actions for fetching budget data and summary.
- [x] **Budget Transfer**: Server Action and UI to move budget between envelopes.

## Recent UI Refinements
- [x] **Feature: Budget Chart**: Detailed Pie Chart for budget allocation (Verified).
- [x] **UI Polish - Round 13**: Final Hybrid Solution - Google 3D Pie + Recharts Bar (Stable) (Verified).

## Session 12/12/2025 - Completed
- [x] **Feature: Transaction List (History)**: Full CRUD - Create, Read, Update, Delete transactions.
- [x] **UI Consistency**: Standardized fonts, icons (20px), and button styles across Envelopes & History screens.
- [x] **Bug Fix**: Modal "screen vanish" when selecting/highlighting Hours input (fixed overlay click handling).

## Next Session - Priority Items
- [ ] **Deployment**: Git setup and build for production.
- [ ] **Auth**: Simple Clerk/NextAuth integration.
- [ ] **Date Picker**: For selecting specific weeks/budget periods.

## Backlog
- [ ] **Custom Envelopes**: UI to create/delete envelopes (currently via Budget Manager).
- [ ] **Cloud Deployment**: Deploy to Google Cloud Run with public URL.
- [ ] **Super Admin**: Screen to manage multiple users.
- [ ] **Reports**: Weekly/Monthly summary reports.


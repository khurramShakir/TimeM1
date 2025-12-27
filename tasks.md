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

## Future Roadmap
- [x] **Feature: Budget Allocation Screen**: Dedicated screen to manage budget entries + Log Time (Complete).
- [x] **Feature: Transaction List**: Screen to view and filter all transactions.
- [ ] **Feature: Transaction CRUD**:
    - [ ] Add `updateTransaction` and `deleteTransaction` actions.
    - [ ] Refactor `LogTimeModal` for editing.
    - [ ] Update `TransactionHistory` UI (Add/Edit/Delete).
- [ ] **Deployment**: Git setup and build for production.

## Backlog
- [ ] **Auth**: Simple Clerk/NextAuth integration.
- [ ] **Date Picker**: For selecting specific weeks.
- [ ] **Custom Envelopes**: UI to create/delete envelopes.
- [ ] **Cloud Deployment**: Deploy to Google Cloud Run with public URL.
- [ ] **Super Admin**: Screen to manage multiple users.

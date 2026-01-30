# Session Summary: Jan 27, 2026 - Budgeting, Reports & GCP Deployment

Today was a major milestone for Time Budget, focusing on transparency in financial reporting and a robust deployment pipeline.

## 1. Budgeting Logic: The "Funded" Field
We introduced the `funded` field to clarify the difference between what you **plan** to spend (Budgeted) and what you **actually have** in an envelope (Funded).
- **Transfer Logic**: Improved the "Fill Envelopes" flow to move money between `funded` balances.
- **Budget Manager**: Added a dedicated "Funded" column and unified progress bars (Spent/Available/Unfunded).
- **Auto-Sync**: Standardized behavior for the Time domain (where Budgeted always equals Funded) while keeping Money flexible for income-based funding.

## 2. Advanced Reports & Domain Context
Refined the reporting dashboard to better reflect user mental models:
- **Math Alignment**: Changed terminology to "Allocated Cash" + "Unallocated Cash" = "Total Cash (Hand)".
- **Context Persistence**: Fixed a bug where the Reports page would default to "Time" even when accessed from the "Money" Dashboard.
- **Navigation**: URLs now use `?domain=MONEY` or `?domain=TIME` to maintain the user's active context throughout the app.

## 3. GCP Deployment & PostgreSQL Transition
Successfully pushed the production version to Google Cloud Run with safe, incremental database updates.
- **Postgres Alignment**: Switched the primary Prisma provider to `postgresql` in `schema.prisma` for production use with Supabase.
- **Safe Migrations**: Updated the deployment `entrypoint.sh` to remove `--accept-data-loss`. The system now detects potential data loss and requires manual approval (prevented a 3000-user data loss warning during schema cast today).
- **Environment Parity**: Synchronized `schema.local.prisma` to ensure local SQLite development remains in sync with the new production features.

## 4. Repository Cleanup
- **PR Workflow**: Established a new workflow where all changes to `main` must come from a Pull Request from `dev`.
- **Branch Management**: Pushed all work to the remote `dev` branch on the root `TimeM1` repository.

## 🛠 Next Steps (Queued)
- [ ] Set up local PostgreSQL for full environment parity.
- [ ] Merge `dev` to `main` via PR.
- [ ] Clean up nested `.git` directory structure in `time-budget`.

---
*Status: All major Jan 27 objectives completed and deployed.*

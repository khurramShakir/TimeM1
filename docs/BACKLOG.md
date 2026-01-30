# Product Backlog: TimeM1

This backlog tracks the tasks required to implement the "Frictionless" PWA Strategy.

## 📱 Mobile UX (PWA First)
- [x] **[UX-01] manifest.json Standalone**: Ensure `display: standalone` is set and theme colors are correct.
- [x] **[UX-02] Disable Zoom/Chrome**: Apply CSS to `body` to disable pinch-to-zoom and ensure no standard browser UI is visible.
- [x] **[UX-03] Bottom Navigation Bar**: 
    - Implement a fixed bottom nav with: Home, Time, Money, Switch, Settings.
    - Remove the existing Sidebar for mobile widths.
- [x] **[UX-04] Context-Aware FAB**:
    - Implement a Floating Action Button `+` with glassmorphism overlap.
    - Logic: Detect current active tab (Time/Money) and open the relevant input modal.
- [x] **[UX-06] "More" Bottom Sheet**: Consolidate secondary actions (Settings, Mode Switch, Sign Out) into a slide-up menu.
- [ ] **[UX-05] 2-Tap Logging**: 
    - Refactor Transaction modals for speed. 
    - Focus on primary input immediately on open.

## 📊 Unified Dashboard
- [ ] **[DB-01] Heads-Up Display (HUD)**:
    - Create the dual-card summary component.
    - Hook: Fetch `currentPeriod` Liquid Cash and Liquid Time.
- [ ] **[DB-02] Red State Logic**:
    - Update progress bars/envelopes to turn red when `spent > budgeted`.
    - Add global warning banner if total budget is exceeded.
- [ ] **[DB-03] Opportunity Cost Nudge**:
    - Calculate `(Spent Time - Budgeted Time) * User.hourlyRate`.
    - Display result as a negative financial impact on the dashboard.

## 🔄 Engagement & Retention
- [ ] **[ENG-01] Tracking Streaks**:
    - Add `lastTrackedAt` to User model.
    - Implement logic to increment streak if tracked today; reset if skipped.
    - Display streak icon/count on Home.
- [ ] **[ENG-02] Analytics - Hourly Rate**: UI for setting and viewing calculated hourly rate.
- [ ] **[ENG-03] Analytics - Billable Reports**: Toggle for Billable vs Non-Billable on time transactions and a summary view.
- [ ] **[ENG-04] CSV Export**: Server Action + Client-side trigger to export all transactions.

## 🛠️ Technical Debt & Foundation
- [ ] **[TECH-01] File Cleanup**: Rename `Stretegy.md` to `Strategy.md`.
- [ ] **[TECH-02] Schema Update**: Ensure `User.hourlyRate` and `Transaction.billable` exist in Prisma.
42: 
43: ## 🚀 DevOps & Automation
44: - [ ] **[OPS-01] CI/CD Pipeline**: 
45:     - Setup GitHub Actions or Google Cloud Build triggers.
46:     - Logic: Automatically build and deploy to Cloud Run on merge to `main`.
47:     - Include automated Prisma migrations (`db push` or `migrate deploy`).

Here is your consolidated Product Strategy & Execution Roadmap. This document aggregates all our discussions, UI critiques, and technical decisions into a single plan of action.

Save this as STRATEGY.md in your project root.

Product Roadmap: Time & Money Budgeting App
Goal: Achieve $1M ARR (~8,350 subscribers @ $10/mo) Core Value Prop: "Budget your Time with the same rigor as your Money. See the financial cost of your time." Target Audience: Freelancers, Independent Contractors, Solopreneurs.

Phase 1: UX/UI Refinement (The "Frictionless" Era)
Objective: Remove all barriers to entry so users actually stick with the app.

1. Mobile Experience (PWA First)
The app must feel native. No browser chrome, no zoom. Use `standalone` mode in `manifest.json` and disable pinch-to-zoom in CSS.

**Navigation**: Move the Sidebar to a Bottom Navigation Bar.
- **Items**: Home, Time, Money, Settings.

**The "Quick Capture" FAB**:
- Replace the "Transfer" button with a Floating Action Button (FAB) `+`.
- **Context Aware**: FAB opens "Money" input if on Money tab; "Time" input if on Time tab.
- **Frictionless Entry**: Minimize clicks. Logging "30 mins of coding" should take 2 taps max.

2. Unified Dashboard
Stop treating Time and Money as separate silos.

**The "Heads Up" Display**:
- **Top Card (Left)**: Liquid Cash Remaining ($).
- **Top Card (Right)**: Liquid Time Remaining (Hours).
- **Why**: Reinforces the "Time = Money" philosophy instantly.

**Red State Logic**:
- Visual feedback/alerts when a user overspends Money OR Time.
- **Opportunity Cost Nudge**: If the user exceeds their Time budget, show the negative financial impact (e.g., "-$200 opportunity cost").

3. Interaction Design & Engagement
- **Streaks**: Display "Days Tracked" count to gamify daily login and build the retention loop.
- **One-Tap Actions**: Manual entry via FAB optimized for speed.
- **Unlocked Analytics**: All users get access to:
    - Hourly Rate Calculation.
    - Billable vs. Non-Billable Reports.
    - CSV Exports.

Phase 2: Technical Architecture (The $1M Backend)
Objective: Build a schema that supports high-value analytics.

1. Database Schema (Prisma)
The database must support the "Opportunity Cost" calculation.

Code snippet
// Key modifications to schema.prisma
model User {
  id          String   @id @default(cuid())
  // The magic number: How much is 1 hour of the user's life worth?
  hourlyRate  Decimal  @default(0.00) 
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(cuid())
  amount      Decimal  // Stores Dollars OR Hours
  // ... relations to User and Envelope
}
2. The "Unified" Transaction Modal
A single component to handle both data types to reduce code maintenance.

Logic: Detects EnvelopeType (Time vs. Money).

The Hook: If Type == TIME, calculate and display (Hours * hourlyRate) as "Opportunity Cost."

Code Reference: Use the AddTransactionModal.tsx component provided in our chat history.

3. Authentication & Payments
Auth: Continue with Clerk (Free tier covers initial growth).

Payments: Integrate Stripe Checkout.

Product 1: Monthly ($10)

Product 2: Annual ($100)

Webhook: Listen for checkout.session.completed to toggle isPremium in your DB.

Phase 3: The Business Model (Monetization)
Objective: Convert free users to paid subscribers.

1. The Freemium Split
Free Tier: Unlimited Time Budgeting.

Rationale: This is your lead magnet. It gets them addicted to the "Time Envelope" method.

Paid Tier ($10/mo):

Money Budgeting: Unlock the financial envelopes.

"Time = Money" Analytics: The dashboard that shows "You wasted $500 worth of time on Netflix this month."

Contractor Mode: Distinguish between "Billable" vs. "Non-Billable" work hours.

Phase 4: Go-To-Market (0 to 1,000 Users)
Objective: Validate the niche.

1. Positioning
Slogan: "Stop spending time you don't have."

Target: Do not market to "families" yet. Market to Makers and Developers who understand hourly_rate.

2. Launch Channels
Hacker News: "Show HN: I built a budgeting app that treats Time as a Currency." (Focus on the technical implementation).

IndieHackers: Document the journey of building the PWA.

Product Hunt: Launch only after you have 50 active beta testers.

Immediate Next Steps (Checklist)
[ ] Refactor Mobile UI: Implement the Bottom Nav and FAB.

[ ] Update Prisma Schema: Add hourlyRate to User and migrate the DB.

[ ] Implement Modal: Drop in the AddTransactionModal code and connect it to the FAB.

[ ] Alpha Test: Give the app to your wife and 3 friends. Watch them fail. Fix what breaks.

Phase 5: Technical Operations (DevOps)
Objective: Maintain a stable "dual-database" workflow and clean release process.

1. Database Strategy: "Hybrid"
We use different database engines to optimize for speed (Local) vs. scalability (Cloud).

*   **Local (`dev` branch)**: SQLite. Zero setup, works offline, fast.
*   **Cloud (`release/*` branches)**: PostgreSQL (Supabase). Scalable, production-ready.

**Workflow:**
*   Use `prisma/schema.local.prisma` for local changes (SQLite).
*   Use `prisma/schema.prisma` for production (PostgreSQL).
*   The `package.json` scripts will determine which one is used.

2. Branching Strategy
We use a simplified Git Flow to separate "work in progress" from "stable releases".

*   `dev` (Default): The cutting edge. All new features go here. Uses **SQLite**.
*   `release/M-YY`: Snapshot branches for deployment. Uses **PostgreSQL**.

**Release Process:**
1.  Checkout `dev`.
2.  Create new branch: `git checkout -b release/1-26`.
3.  **Action**: Verify `schema.prisma` is set to PostgreSQL (or use the automated deployment script).
4.  Push to GitHub -> Triggers Cloud Build.
5.  Merge back to `main` (optional, if you want a stable master).

I am ready to resume whenever you are. When you come back, we can tackle the Database Seed Script to populate your demo data, or we can start integrating Stripe. Happy coding!
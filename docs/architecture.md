# System Architecture & Data Design

## 1. Technology Stack
*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: CSS Modules (Vanilla CSS) - *Clean, Light Theme*
*   **Database**: SQLite (Local file for MVP) -> PostgreSQL (Production)
*   **ORM**: Prisma

## 2. Data Model (Schema)

We need a structure that supports "Weekly Buckets". Unlike a standard calendar, we are budgeting *buckets of time* for specific weeks.

### Proposed Prisma Schema

```prisma
// User Account
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  
  periods   BudgetPeriod[]
}

// A "Budget Period" container (e.g., Week of Dec 4th, or Month of Jan 2025)
model BudgetPeriod {
  id        String   @id @default(uuid())
  startDate DateTime // The start date of the period
  type      String   // "WEEKLY", "MONTHLY", "YEARLY"
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // State of the period
  isClosed  Boolean  @default(false)
  
  envelopes Envelope[]

  @@unique([userId, startDate, type]) // One budget per period type per start date
}

// The "Buckets" for a specific week
// e.g., "Work" for Week 42.
model Envelope {
  id          String   @id @default(uuid())
  name        String   // e.g., "Work", "Sleep"
  color       String?  // UI color code
  
  budgeted    Decimal  // The plan (e.g., 40.00)
  
  periodId    String
  period      BudgetPeriod @relation(fields: [periodId], references: [id])
  
  transactions Transaction[]
}

// The actual spending of time
model Transaction {
  id          String   @id @default(uuid())
  amount      Decimal  // e.g., 2.5 hours
  description String?  // "Deep work on Project X"
  date        DateTime // When it happened
  
  envelopeId  String
  envelope    Envelope @relation(fields: [envelopeId], references: [id])
  
  createdAt   DateTime @default(now())
}
```

## 3. Key Logic Flows

### A. The "New Period" Event
When a user starts a new period (Week/Month), we cannot start empty. We need a **"Rollover" or "Template" system**.
*   **Logic**: Copy the `Envelope` names and `Budgeted` amounts from the previous period to the new one.
*   **Unallocated Handling**: If `Sum(UserAllocated) < TotalPeriodHours`, the system automatically creates/updates an "Unallocated" envelope with the difference.
*   **User Action**: User clicks "Start Week of Dec 11th". System duplicates the plan.

### B. The "Overspending" Calculation
*   `Remaining = Budgeted - Sum(Transactions)`
*   If `Remaining < 0`, the UI must flag this envelope as **Overdrawn**.
*   **Enforcement**: We don't stop the user from logging time (reality is reality), but we show a persistent "Unbalanced Budget" warning until they move hours from another envelope to fix it.

## 4. Component Structure (Frontend)

*   **Responsive Design**: All components must be mobile-first (using CSS Grid/Flexbox with media queries).
*   `layout.tsx`: Main shell (Sidebar for Desktop, Bottom Nav for Mobile).
*   `dashboard/page.tsx`: The main grid view.
    *   `WeekHeader`: Shows "72h Remaining".
    *   `EnvelopeGrid`: Container for cards (1 col on mobile, 3 cols on desktop).
    *   `EnvelopeCard`: Individual bucket status.
*   `modals/LogTimeModal.tsx`: The form to add a transaction.
*   `modals/TransferModal.tsx`: The "Whack-a-mole" tool to move budget between envelopes.

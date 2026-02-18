# Time Envelope Budgeting - Product Requirements Document (PRD)

## 1. Core Concept
**"Zero-Based Time Budgeting"**
Unlike traditional calendars that schedule *when* things happen, this tool budgets *how much* time is allocated to categories. The fundamental constraint is the **Total Available Time** for the selected period (Weekly, Monthly, or Yearly). Every hour in that period must be accounted for.

## 2. Key Mechanics

### A. The Currency
*   **Unit**: Decimal Hours (e.g., `1.5` hours = 1 hour 30 mins).
*   **Precision**: 2 decimal places (allows for granular tracking like `0.25` hours).
*   **Limit**: Hard cap based on selected period (e.g., **168.00 hours** for Weekly, **~730 hours** for Monthly).

### B. The Workflow
1.  **Period Setup (The Budget)**
    *   User selects a period (Default: **Weekly**).
    *   User starts with available hours for that period (e.g., 168.00 for Weekly).
    *   User allocates hours to **Envelopes** (Categories).
    *   *Constraint*: `Sum(Envelopes) == TotalPeriodHours`. The user cannot proceed until the budget is balanced (Zero-Based).
    *   *Example*:
        *   Sleep: 56.00
        *   Work: 40.00
        *   Commute: 5.00
        *   Leisure: 20.00
        *   Life Admin: 47.00
        *   **Remaining: 0.00**

2.  **Time Entry (The Spending)**
    *   **Mode**: **Manual Entry** (User explicitly logs time).
    *   User logs a "Transaction":
        *   **Amount**: `2.5` hours.
        *   **Category**: "Leisure".
        *   **Description**: "Video Games".
        *   **Date**: Current Date.
    *   This deducts from the "Leisure" envelope's *Remaining* balance.

3.  **Re-Balancing (The "Whack-a-Mole")**
    *   If an envelope goes negative (e.g., Spent 22.00 on Leisure, Budget was 20.00 -> Balance is -2.00), the user is in "Debt".
    *   User must "Cover Overspending" by moving hours from another envelope (e.g., take 2.00 from "Life Admin").

## 3. User Interface (UI) Requirements

### A. Design Aesthetic
*   **Theme**: Clean Light Mode.
*   **Style**: Minimalist, professional, "Sober" aesthetic.
*   **Palette**: White backgrounds, soft gray borders, and subtle pastel accents (Soft Blue, Sage Green) for status indicators. High legibility with dark gray typography.

### B. Key Views
1.  **Dashboard**:
    *   **Heads-up Display**: Total Hours Remaining in the week (Physical time left).
    *   **Envelope Cards**: Visual representation of categories showing `Budgeted | Spent | Remaining`.
    *   **Progress Bars**: Visual feedback on consumption.
2.  **Transaction Log**:
    *   List of recent time entries.
    *   "Quick Add" button for frequent activities.
3.  **Budget Planner**:
    *   Table/List view to adjust allocations for the week.

## 4. Technical Stack (Tentative)
*   **Frontend**: TBD (Next.js or Thymeleaf depending on environment).
*   **Backend**: TBD (Node.js or Spring Boot).
*   **Database**: Relational DB (SQLite or H2 for MVP, Postgres for Prod).
*   **ORM**: Prisma (if Node) or JPA/Hibernate (if Java).

## 5. Future Scope (Phase 2)
*   **Templates**: Save "Ideal Week" to auto-populate.
*   **Analytics**: "Where did my time actually go vs. where I planned it?"
*   **Rollover**: Handling deficits across weeks.

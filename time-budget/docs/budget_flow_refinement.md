# Requirement Refinement: Dynamic Budgeting & Fill Flow

This document details the refined logic for managing categories and allocating funds/time across budget periods.

## 1. Automatic Envelope Persistence
- **Behavior**: When a user creates or moves to a new budget period (Week/Month), the system will automatically clone all Envelopes from the **most recent previous period** of the same domain and type.
- **Explicit Deletion**: Categories persist indefinitely until a user explicitly deletes them from the "Budget Management" or "Settings" screen.

## 2. The "Unallocated" Envelope
- **Requirement**: Every budget period MUST have an "Unallocated" envelope.
- **Logic**: 
    - `Unallocated = (Total Period Capacity) - Sum(All other Envelopes)`.
    - If a user increases the Total Capacity, the difference is added to Unallocated.
    - If a user increases an envelope's budget, the amount is deducted from Unallocated.
- **UI**: This envelope should be visually distinct (e.g., a "Buffer" or "General" color).

## 3. Configuration & Capacity
- **Settings Page**:
    - **Total Capacity (Time)**: Global setting (e.g., 168h/week).
    - **Total Capacity (Money)**: Can be set per-period (Income).
- **Cumulative vs. Set**: Option to show the "Total Budgeted Amount" for the entire month/week clearly in the header.

## 4. "Fill Envelopes" Workflow
- **Concept**: A "Planning Mode" for each new period.
- **Steps**:
    1. **Set Income/Capacity**: User enters the total amount available (e.g., "$10,000 for January").
    2. **Review/Adjust Allocations**: See the cloned envelopes and update their budgeted amounts.
    3. **Fill Action**: A button to "Commit/Fill" the period, which officially sets the `budgeted` values.
- **Automatic Filling (Time)**: Since time is fixed (168h), it auto-fills, but users can still re-allocate within that fixed cap.

## 5. UI/UX Changes
- **Income Entry Screen**: A clean modal or overlay when starting/editing a period's budget.
- **Budget Balance Indicator**: A real-time counter showing `Total - Budgeted = Unallocated`.
- **Transfer Logic**: Users can transfer funds/time between any two envelopes. This includes moving budget from a specific envelope (e.g., "Work") back to "Unallocated" or vice versa.


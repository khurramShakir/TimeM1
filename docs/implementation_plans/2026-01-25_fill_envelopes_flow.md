# Implementation Plan - Income "Fill" Flow

This feature introduces a dedicated "Fill Envelopes" flow (also known as "Paycheck Planning"). It allows users to input a lump sum of income (Money) or Hours (Time) and immediately distribute it across their envelopes, following the Zero-Based Budgeting philosophy.

## Goal Description
Currently, users must manually edit each envelope to set budgets. This process is tedious and disconnected from the "Source" of the funds.
The **Fill Envelopes** feature will:
1.  Allow entering a "Total Inflow" (e.g., Paycheck amount).
2.  Provide a UI to distribute this inflow into various envelopes.
3.  Automatically calculate the "Remaining" amount and assign it to "Unallocated".

## User Review Required
> [!IMPORTANT]
> **Transaction Logging Strategy**: The system will log this as ONE "Income" transaction (into Unallocated) followed by multiple "Transfer" transactions (from Unallocated to Envelopes). This ensures the ledger faithfully represents the flow of funds (Source -> Pool -> Envelopes).

## Proposed Changes

### Database & Schema
*   **No Schema Changes Required**: The existing `BudgetPeriod`, `Envelope`, and `Transaction` models clearly support this via the `type="INCOME"` and `type="TRANSFER"` fields.

### Components

#### [NEW] `src/components/budget/FillEnvelopesModal.tsx`
A new modal component triggered from the Dashboard.
*   **Inputs**:
    *   `Total Amount` (Number)
    *   `Description` (Optional, defaults to "Paycheck" or "Start of Week")
*   **Distribution List**:
    *   Scrollable list of all envelopes in the current period.
    *   Each row has an input field.
    *   Input fields default to `0`. (Future: Default to "Planned" amounts if we add that feature).
*   **Helpers**:
    *   "Remaining" indicator (Total - Sum of allocated).
    *   Validation: Cannot allocate more than the Total Amount? (Or maybe allow it, and go negative in Unallocated? -> **Decision**: Prevent over-allocation for now to keep it safe).

#### [MODIFY] `src/components/layout/FloatingActionButton.tsx`
*   Add a new secondary action button (e.g., `Wallet` or `Plus` icon distinct from "Log Transaction") to open the "Fill" modal.
*   Alternatively, place a "Fill" button in the `DashboardHeader`.

### Server Actions

#### [NEW] `src/actions/budget-actions.ts` (or extend `lib/actions.ts`)
*   `fillEnvelopes(periodId: number, totalAmount: number, allocations: { envelopeId: number, amount: number }[], description: string)`
    *   **Step 1**: Call `addIncome(periodId, totalAmount)` (updates capacity, increases Unallocated).
    *   **Step 2**: Iterate through `allocations`.
        *   Skip if `amount` is 0.
        *   Call `transferBudget(unallocatedId, envelopeId, amount)`.
    *   **Step 3**: Revalidate paths.

## Verification Plan

### Manual Verification
1.  **Open Dashboard** (Money Domain).
2.  **Click "Fill" Button**.
3.  **Enter Amount**: $1000.
4.  **Allocate**:
    *   Rent: $500
    *   Groceries: $100
    *   (Leave $400 unallocated).
5.  **Submit**.
6.  **Verify UI**:
    *   "Total Capacity" / "Income" should increase by $1000.
    *   "Rent" budget bar should increase by $500.
    *   "Unallocated" should show $400 available.
7.  **Verify History**:
    *   Check Transaction Log. Should see:
        *   `+ $1000 Income`
        *   `Transfer $500 to Rent`
        *   `Transfer $100 to Groceries`

# Implementation Plan - Budget Allocation Screen

## Goal Description
Create a dedicated screen where users can manage their budget envelopes. This includes viewing a list of all envelopes, creating new ones, updating budgets/names/colors, and deleting them. This provides the granular control needed for the "NetSuite" style resource management system.

## User Review Required
> [!NOTE]
> I propose using `/dashboard/budget` as the route. The UI will be a clean list/table view with inline editing or a slide-over panel for editing to keep it professional.

## Proposed Changes

### Backend
#### [MODIFY] [actions.ts](file:///c:/development/workspace/TimeM1/time-budget/src/lib/actions.ts)
-   `createEnvelope(name, budgeted, color)`: Create new envelope.
-   `updateEnvelope(id, data)`: Update budget/name/color.
-   `deleteEnvelope(id)`: Remove envelope (handle transactions? Maybe prevent delete if used).

### Frontend Components
#### [NEW] [BudgetPage](file:///c:/development/workspace/TimeM1/time-budget/src/app/dashboard/budget/page.tsx)
-   **Header**: "Budget Management", "Add Envelope" button.
-   **List**: Renders `EnvelopeRow` or a table.
-   **Columns**: Name, Budgeted Hours, Spent (read-only), Remaining (read-only), Actions (Edit/Delete).

#### [NEW] [EnvelopeModal.tsx](file:///c:/development/workspace/TimeM1/time-budget/src/components/budget/EnvelopeModal.tsx)
-   Modal for Creating/Editing.
-   Fields: Name, Budgeted Hours, Color Picker.

### Navigation
#### [MODIFY] [Sidebar.tsx](file:///c:/development/workspace/TimeM1/time-budget/src/components/layout/Sidebar.tsx)
-   Add link to `/dashboard/budget` ("Budgeting" or "Envelopes").

## Verification Plan
1.  **Create**: Add a new envelope "Gym", verify it appears on Dashboard.
2.  **Edit**: Change "Work" to 45h, verify chart updates.
3.  **Delete**: delete an unused envelope.

# Envelope Budgeting - Enhanced Metrics Specification

## Overview

This document defines the data model and UI requirements for displaying comprehensive envelope metrics: **Budgeted**, **Funded**, **Spent**, and **Balance**.

---

## Core Concepts

### 1. Budgeted (Target)
- **What it is**: The amount you *plan* to spend from this envelope during the period.
- **Set by**: User, when creating/editing an envelope.
- **Stored in**: `envelope.budgeted`
- **Example**: "I budget $500/month for groceries"

### 2. Funded (Capacity)
- **What it is**: The actual money *deposited* into the envelope.
- **Set by**: Fill Envelopes flow, Income transactions.
- **Stored in**: `envelope.capacity` (existing field, may need renaming for clarity)
- **Example**: "I've added $400 to groceries this month"

### 3. Spent
- **What it is**: The total expenses charged to this envelope.
- **Calculated**: Sum of expense transactions against this envelope.
- **Stored in**: `envelope.spent` (existing field)
- **Example**: "I've spent $250 on groceries"

### 4. Balance (Left)
- **What it is**: What remains available to spend.
- **Formula**: `Balance = Funded - Spent`
- **Stored in**: Computed, or `envelope.balance` if denormalized.
- **Example**: "$400 funded - $250 spent = $150 left"

---

## Derived Status Indicators

| Status | Condition | Meaning |
|--------|-----------|---------|
| 🟢 **Fully Funded** | `Funded >= Budgeted` | Envelope has enough money for the plan |
| 🟡 **Underfunded** | `Funded < Budgeted` | Need to add more money to meet budget |
| 🔴 **Overspent** | `Balance < 0` | Spent more than funded |
| ⚪ **On Track** | `Spent <= Funded` and within budget | Normal operation |

---

## Data Flow: Fill Envelopes

### Step 1: User Enters Incoming Amount
```
Incoming: $3,000
└── This amount will be added to capacity
```

### Step 2: User Allocates to Envelopes
```
Rent:      +$1,500 (moves from Unallocated -> Rent)
Groceries: +$500   (moves from Unallocated -> Groceries)
```

### Step 3: System Updates
```
Unallocated.funded += $3,000      // Total incoming
Unallocated.funded -= $1,500      // Transfer to Rent
Unallocated.funded -= $500        // Transfer to Groceries
Rent.funded        += $1,500
Groceries.funded   += $500

Net Result:
- Unallocated: +$1,000 (remaining)
- Rent: +$1,500
- Groceries: +$500
```

---

## UI Requirements

### Dashboard - Envelope Cards

**Current:**
```
┌─────────────────────────────┐
│ 🟢 Groceries      $520 Left │
│ Spent: $80                  │
│ ███████░░░░░░░░░ $520       │
└─────────────────────────────┘
```

**Proposed:**
```
┌─────────────────────────────┐
│ 🟢 Groceries                │
│                             │
│ Budgeted    Funded    Left  │
│ $500        $600      $520  │
│                             │
│ Spent: $80                  │
│ █████████░░░░░░░░░░ 87%     │
└─────────────────────────────┘
```

### Allocation Studio - Stats Panel

**Current:**
```
Allocated:  $1,500.00
Remaining:  $1,500.00
```

**Proposed:**
```
─── Current Period Summary ───
Total Budgeted:    $6,400.00
Total Funded:      $5,200.00
Unallocated:       $1,800.00

─── This Transaction ─────────
Incoming:          $3,000.00
Allocating:        $1,500.00
→ To Unallocated:  $1,500.00
```

---

## Current Data Model Analysis

### Schema Structure
```
BudgetPeriod
├── capacity: Decimal      ← Total income added via "Fill Envelopes"
├── envelopes[]
    └── Envelope
        ├── budgeted: Decimal  ← Currently used as BOTH target AND funded
        └── transactions[]
            └── Transaction (EXPENSE deducts from balance)
```

### Current Calculation Logic (getBudgetSummary)
```typescript
// For each envelope:
spent = sum(transactions.filter(t => t.type === "EXPENSE").amount)
remaining = budgeted - spent    // <-- budgeted acts as "funded"

// Period totals:
totalBudgeted = sum(envelopes.budgeted)
totalSpent = sum(envelopes.spent)
```

### Conceptual Issue Identified

> [!WARNING]  
> The field `envelope.budgeted` currently serves a **dual purpose**:
> 1. **Target** (what you plan to spend)
> 2. **Funded** (what you've actually added)
> 
> This works for simple use cases but breaks when:
> - User wants to set a $500 target but only fund $400 initially
> - User wants to see "Am I on track with my funding?"

---

## Decision: Single vs Dual Field Model

### Option A: Keep Single Field (Simpler)
- `budgeted` = both target and funded
- **Pro**: No schema migration, simpler logic
- **Con**: Can't distinguish "underfunded" envelopes

### Option B: Add Separate `funded` Field (More Accurate)
- `budgeted` = your spending target/plan
- `funded` = actual money deposited
- `balance` = `funded - spent`
- **Pro**: True envelope budgeting semantics
- **Con**: Requires migration, more complexity

### Recommendation: **Option A for Now, Option B Later**
For MVP, keep the simple model but **rename UI labels** for clarity:
- Show "Budget" (what you set)
- Show "Spent" (expenses)
- Show "Left" (budget - spent)

Add "Funded" tracking in a future iteration if users request it.

---

## Implementation Plan (Phase 1: Enhanced UI)

### Step 1: Update Dashboard Cards
Show three metrics per envelope:
| Label | Value |
|-------|-------|
| Budgeted | `envelope.budgeted` |
| Spent | `envelope.spent` |
| Left | `envelope.remaining` (budgeted - spent) |

### Step 2: Update Allocation Studio Stats
Show period-level summary:
| Label | Value |
|-------|-------|
| Period Income | `period.capacity` |
| Total Budgeted | Sum of all `envelope.budgeted` |
| Unallocated | `period.capacity - totalBudgeted` |

### Step 3: Show Live Allocation Preview
As user fills envelopes, show:
- Incoming amount
- Amount being allocated
- Projected new balance for each envelope

---

## Implementation Checklist

- [ ] Update EnvelopeCard to show Budgeted | Spent | Left
- [ ] Update Allocation Studio stats panel with period summary
- [ ] Pass `spent` data to EnvelopeCard component  
- [ ] Calculate and display "Unallocated" balance correctly
- [ ] Test that existing Fill flow still works correctly

---

## Questions Resolved

1. ~~Rename capacity to funded?~~ → No, keep as-is for now
2. **Show Spent on dashboard cards?** → **Yes** (user confirmed)
3. ~~Highlight underfunded?~~ → Defer to Phase 2

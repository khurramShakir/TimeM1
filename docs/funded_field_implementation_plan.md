# Implementation Plan: Option B - Add Funded Field

## Overview

Add a separate `funded` field to the Envelope model to distinguish between:
- **budgeted**: Target spending amount (the plan)
- **funded**: Actual money deposited into the envelope
- **balance**: What's left to spend (`funded - spent`)

---

## Phase 1: Database Schema Changes

### 1.1 Update Prisma Schema

#### [MODIFY] [schema.prisma](file:///c:/development/workspace/TimeM1/time-budget/prisma/schema.prisma)

```diff
model Envelope {
  id          Int      @id @default(autoincrement())
  name        String
  color       String?
  
  budgeted    Decimal  // The plan (target spending)
+ funded      Decimal  @default(0)  // Actual money deposited
  
  periodId    Int
  period      BudgetPeriod @relation(...)
  transactions Transaction[]
}
```

### 1.2 Migration Strategy

```bash
# Generate migration
npx prisma migrate dev --name add_envelope_funded_field

# Migration content (auto-generated will add column with default 0)
# Then we need a data migration to set funded = budgeted for existing records
```

### 1.3 Data Migration Script

Create a one-time script to migrate existing data:
```sql
-- For existing envelopes, set funded = budgeted (they were the same)
UPDATE Envelope SET funded = budgeted;
```

---

## Phase 2: Core Logic Changes

### 2.1 Update `transferBudget()` Function

#### [MODIFY] [actions.ts](file:///c:/development/workspace/TimeM1/time-budget/src/lib/actions.ts#L548-595)

**Current behavior**: Modifies `budgeted` field  
**New behavior**: Modify `funded` field (money moves, not budget)

```diff
await db.$transaction([
    db.envelope.update({
        where: { id: fromId },
-       data: { budgeted: { decrement: amount } },
+       data: { funded: { decrement: amount } },
    }),
    db.envelope.update({
        where: { id: toId },
-       data: { budgeted: { increment: amount } },
+       data: { funded: { increment: amount } },
    }),
]);
```

### 2.2 Update `addIncome()` Function

#### [MODIFY] [actions.ts](file:///c:/development/workspace/TimeM1/time-budget/src/lib/actions.ts#L237-275)

After `syncUnallocated`, also update the Unallocated envelope's `funded`:

```diff
await syncUnallocated(periodId);

+ // Update Unallocated funded amount
+ const unallocatedEnv = await db.envelope.findFirst({
+     where: { periodId, name: "Unallocated" }
+ });
+ if (unallocatedEnv) {
+     await db.envelope.update({
+         where: { id: unallocatedEnv.id },
+         data: { funded: { increment: amount } }
+     });
+ }
```

### 2.3 Update `syncUnallocated()` Function

#### [MODIFY] [actions.ts](file:///c:/development/workspace/TimeM1/time-budget/src/lib/actions.ts#L186-216)

Update to also sync `funded` for Unallocated:

```diff
// Current: Sets budgeted = capacity - sum(other.budgeted)
// New: Also set funded = capacity - sum(other.funded)
```

### 2.4 Update `getBudgetSummary()` Function

#### [MODIFY] [actions.ts](file:///c:/development/workspace/TimeM1/time-budget/src/lib/actions.ts#L437-513)

Add `funded` to the returned envelope objects:

```diff
return {
    id: env.id,
    name: env.name,
    budgeted,
+   funded: Number(env.funded),
    spent,
-   remaining,
+   remaining: Number(env.funded) - spent,  // Balance = funded - spent
    color: env.color || "gray",
    ...
};
```

---

## Phase 2.5: TIME Domain Handling

> [!IMPORTANT]  
> TIME and MONEY domains have different semantics for `funded`.

### Conceptual Difference

| Domain | Funded Meaning |
|--------|----------------|
| **MONEY** | Actual money deposited into the envelope |
| **TIME** | Time "exists" automatically (168h/week) - no deposit needed |

### Implementation Rule

For **TIME** envelopes, `funded` should **always equal `budgeted`** automatically:

```typescript
// In any function that creates/updates TIME envelopes:
if (domain === "TIME") {
    // Time is always "fully funded" by definition
    envelope.funded = envelope.budgeted;
}
```

### Affected Functions

#### 2.5.1 `createEnvelope()` - Set funded = budgeted for TIME

```typescript
// When creating envelope
const data = {
    name,
    budgeted,
    funded: domain === "TIME" ? budgeted : 0, // TIME: auto-fund
    color,
    periodId
};
```

#### 2.5.2 `updateEnvelope()` - Sync funded when budgeted changes for TIME

```typescript
// When updating envelope budget
if (domain === "TIME" && data.budgeted !== undefined) {
    data.funded = data.budgeted; // Keep in sync
}
```

#### 2.5.3 `syncUnallocated()` - Also sync funded for TIME

```typescript
// For TIME domain only:
// Unallocated.funded = capacity - sum(other.funded)
```

### Summary

| Action | MONEY | TIME |
|--------|-------|------|
| Create envelope | funded = 0 | funded = budgeted |
| Edit budget | funded unchanged | funded = budgeted |
| Transfer | funded moves | funded moves (but stays = budgeted after sync) |
| Fill Envelopes | Increment funded | N/A (use Budget Manager instead) |

---

## Phase 3: UI Changes

### 3.1 Update EnvelopeCard Component

#### [MODIFY] [EnvelopeCard.tsx](file:///c:/development/workspace/TimeM1/time-budget/src/components/ui/EnvelopeCard.tsx)

Add `funded` prop and display funding status:

```tsx
interface EnvelopeProps {
    budgeted: number;
    funded: number;    // NEW
    spent: number;
    remaining: number; // Now = funded - spent
}

// Show underfunded indicator when funded < budgeted (MONEY only)
const isUnderfunded = domain === "MONEY" && funded < budgeted;
```

### 3.2 Update Allocation Studio Stats

#### [MODIFY] [FillClientPage.tsx](file:///c:/development/workspace/TimeM1/time-budget/src/app/dashboard/fill/FillClientPage.tsx)

Show period summary:
- Total Budgeted (sum of all budgeted)
- Total Funded (sum of all funded)
- Unallocated Balance

### 3.3 Update Dashboard Pages

#### [MODIFY] Money/Time dashboard pages

Pass `funded` to EnvelopeCard components.

---

## Phase 4: Testing & Verification

### 4.1 Test Cases

| # | Domain | Scenario | Expected |
|---|--------|----------|----------|
| 1 | MONEY | Add $1000 income | Unallocated.funded += 1000 |
| 2 | MONEY | Transfer $500 from Unallocated to Rent | Unallocated.funded -= 500, Rent.funded += 500 |
| 3 | MONEY | Spend $100 from Rent | Rent.spent += 100, Rent.remaining = funded - spent |
| 4 | MONEY | Set Rent budget to $800 | Rent.budgeted = 800 (funded unchanged) |
| 5 | MONEY | Underfunded check | funded < budgeted → show indicator |
| 6 | TIME | Create "Work" envelope with 40h | funded = 40, budgeted = 40 |
| 7 | TIME | Change "Work" budget to 45h | funded = 45, budgeted = 45 |
| 8 | TIME | Log 2h expense | spent += 2, remaining = 43h |

### 4.2 Browser Verification
- Fill envelopes (MONEY) and verify funded updates
- Check dashboard shows correct values
- Verify transfers move funded (not budgeted)
- Verify TIME envelopes stay fully funded

---

## Files to Modify (Summary)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `funded` column |
| `src/lib/actions.ts` | Update 5 functions (including TIME handling) |
| `src/actions/budget-actions.ts` | No change needed |
| `src/components/ui/EnvelopeCard.tsx` | Add funded prop, underfunded indicator (MONEY only) |
| `src/app/dashboard/fill/FillClientPage.tsx` | Enhanced stats |
| `src/app/dashboard/money/page.tsx` | Pass funded to cards |
| `src/app/dashboard/time/page.tsx` | Pass funded to cards |

---

## Rollback Plan

If issues arise:
1. Revert schema migration: `npx prisma migrate reset`
2. Git revert code changes
3. Redeploy previous version

---

## Questions Resolved

1. **Copy budgeted to funded during migration?** → Yes  
2. **Edit Budget → affect funded?** → Only for TIME domain  
3. **Underfunded indicator for TIME?** → No (always fully funded)

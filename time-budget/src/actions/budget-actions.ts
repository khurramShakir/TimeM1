"use server";

import { addIncome, transferBudget } from "@/lib/actions";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

interface Allocation {
    envelopeId: number;
    amount: number;
}

export async function fillEnvelopes(
    periodId: number,
    totalAmount: number,
    allocations: Allocation[],
    description: string = "Income Fill"
) {
    if (totalAmount <= 0) throw new Error("Total amount must be positive");

    // 1. Add Income (Increases Capacity & Unallocated)
    // This logs a "INCOME" transaction into Unallocated
    await addIncome(periodId, totalAmount);

    // 2. Distribute to Envelopes (From Unallocated)
    // We need to find the Unallocated envelope for this period to transfer FROM.
    const unallocated = await db.envelope.findFirst({
        where: { periodId, name: "Unallocated" }
    });

    if (!unallocated) {
        // Should not happen as addIncome ensures it, but safety check
        throw new Error("System Error: Unallocated envelope missing after income add.");
    }

    // Reuse transferBudget logic (which logs TRANSFER transactions)
    for (const alloc of allocations) {
        if (alloc.amount > 0) {
            // transferBudget(from, to, amount)
            await transferBudget(unallocated.id, alloc.envelopeId, alloc.amount);
        }
    }

    // Revalidate is handled by the sub-actions, but a top-level revalidate doesn't hurt
    // just to be sure we catch the aggregate state.
    // We can't easily guess the domain here without fetching period, but sub-actions handle it.
}

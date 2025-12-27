import React from "react";
import { getBudgetSummary } from "@/lib/actions";
import BudgetManager from "@/components/budget/BudgetManager";

export default async function BudgetPage() {
    const USER_ID = 1; // MVP hardcoded
    const summary = await getBudgetSummary(USER_ID);

    if (!summary) {
        return (
            <div style={{ padding: "2rem" }}>
                <h1>No Budget Period Found</h1>
                <p>Please run the seed script or create a period.</p>
            </div>
        );
    }

    // Convert Decimals to numbers for client component
    const sanitizedEnvelopes = summary.envelopes.map(env => ({
        ...env,
        budgeted: Number(env.budgeted),
        spent: Number(env.spent),
        remaining: Number(env.remaining),
        color: env.color || "gray"
    }));

    return (
        <BudgetManager
            userId={USER_ID}
            initialEnvelopes={sanitizedEnvelopes}
        />
    );
}

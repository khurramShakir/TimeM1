import { getBudgetSummary, getUserSettings } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { FillClientPage } from "./FillClientPage";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ domain?: string }>;
}

export default async function FillPage({ searchParams }: PageProps) {
    const { domain = "MONEY" } = await searchParams;
    const settings = await getUserSettings();
    const periodType = domain === "MONEY" ? "MONTHLY" : "WEEKLY";

    const data = await getBudgetSummary(undefined, domain, periodType);

    if (!data.period) {
        redirect(domain === "MONEY" ? "/dashboard/money" : "/dashboard/time");
    }

    return (
        <FillClientPage
            periodId={data.period.id}
            envelopes={data.envelopes}
            currency={data.currency}
            domain={domain}
        />
    );
}

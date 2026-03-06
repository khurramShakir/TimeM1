import { getBudgetSummary, getUserSettings } from "@/lib/actions";
import { getAllEnvelopeNames } from "@/lib/budget-actions";
import { formatCurrency } from "@/lib/format";
import { FillClientPage } from "./FillClientPage";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ domain?: string; date?: string }>;
}

export default async function FillPage({ searchParams }: PageProps) {
    const { domain = "MONEY", date } = await searchParams;
    const settings = await getUserSettings();
    const periodType = domain === "MONEY" ? "MONTHLY" : "WEEKLY";

    const data = await getBudgetSummary(date, domain, periodType);
    const distinctEnvelopes = await getAllEnvelopeNames(domain);

    if (!data.period) {
        redirect(domain === "MONEY" ? "/dashboard/money" : "/dashboard/time");
    }

    return (
        <FillClientPage
            periodId={data.period.id}
            envelopes={data.envelopes}
            currency={data.currency}
            domain={domain}
            currentDate={data.period.startDate ? new Date(data.period.startDate).toISOString() : new Date().toISOString()}
            allDistinctEnvelopes={distinctEnvelopes}
        />
    );
}

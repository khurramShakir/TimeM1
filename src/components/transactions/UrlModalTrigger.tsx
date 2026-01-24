"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogTimeModal } from "./LogTimeModal";

interface UrlModalTriggerProps {
    envelopes: any[];
    domain: "TIME" | "MONEY";
    currency?: string;
}

export function UrlModalTrigger({ envelopes, domain, currency }: UrlModalTriggerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const action = searchParams.get("action");

    // Check for either specific action names
    const isOpen = (domain === "TIME" && action === "log_time") ||
        (domain === "MONEY" && action === "add_transaction");

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("action");
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <LogTimeModal
            isOpen={isOpen}
            onClose={handleClose}
            envelopes={envelopes}
            domain={domain}
            currency={currency}
        />
    );
}

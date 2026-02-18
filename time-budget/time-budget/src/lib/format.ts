export function formatCurrency(value: number, currency: string = "USD"): string {
    const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    }).format(value);

    if (currency === "CAD") {
        return formatted.replace("CA$", "C$");
    }
    return formatted;
}

export function formatValue(value: number, domain: string = "TIME", currency: string = "USD"): string {
    if (domain === "TIME") {
        const hours = Math.floor(Math.abs(value));
        const mins = Math.round((Math.abs(value) - hours) * 60);

        if (hours === 0 && mins === 0) return "0h";
        if (hours === 0) return `${value < 0 ? '-' : ''}${mins}m`;
        if (mins === 0) return `${value < 0 ? '-' : ''}${hours}h`;
        return `${value < 0 ? '-' : ''}${hours}h ${mins}m`;
    } else {
        return formatCurrency(value, currency);
    }
}

export function formatValueShort(value: number, domain: string = "TIME", currency: string = "USD"): string {
    if (domain === "TIME") {
        return `${value.toFixed(1)}h`;
    } else {
        const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: 0
        }).format(value);

        if (currency === "CAD") {
            return formatted.replace("CA$", "C$");
        }
        return formatted;
    }
}

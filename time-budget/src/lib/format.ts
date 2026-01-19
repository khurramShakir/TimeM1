export function formatValue(value: number, domain: string = "TIME"): string {
    if (domain === "TIME") {
        const hours = Math.floor(Math.abs(value));
        const mins = Math.round((Math.abs(value) - hours) * 60);

        if (hours === 0 && mins === 0) return "0h";
        if (hours === 0) return `${value < 0 ? '-' : ''}${mins}m`;
        if (mins === 0) return `${value < 0 ? '-' : ''}${hours}h`;
        return `${value < 0 ? '-' : ''}${hours}h ${mins}m`;
    } else {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    }
}

export function formatValueShort(value: number, domain: string = "TIME"): string {
    if (domain === "TIME") {
        return `${value.toFixed(1)}h`;
    } else {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(value);
    }
}

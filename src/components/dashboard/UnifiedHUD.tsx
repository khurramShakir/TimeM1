import { getUnifiedHudData } from "@/lib/actions";
import { LiquidCard } from "./LiquidCard";
import styles from "./UnifiedHUD.module.css";

export async function UnifiedHUD({ date, domain }: { date?: string; domain?: string }) {
    const data = await getUnifiedHudData(date);

    return (
        <div className={styles.hud}>
            <LiquidCard
                label="Liquid Time"
                value={data.time.liquid}
                unit={data.time.unit}
                threshold={data.time.total}
            />
            {domain !== "MONEY" && (
                <LiquidCard
                    label="Unallocated Cash"
                    value={data.money.liquid}
                    unit=""
                    prefix={data.money.prefix}
                    threshold={data.money.total}
                />
            )}

            {domain === "MONEY" && (
                <>
                    <LiquidCard
                        label="Total Budgeted"
                        value={data.money.budgeted}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Total Funded"
                        value={data.money.funded}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Total Spent"
                        value={data.money.spent}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Unallocated Funds"
                        value={data.money.unallocatedFunds}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                </>
            )}
        </div>
    );
}

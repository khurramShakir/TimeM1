import React from "react";
import { getUnifiedHudData } from "@/lib/actions";
import { LiquidCard } from "./LiquidCard";
import styles from "./UnifiedHUD.module.css";

export async function UnifiedHUD({ date, domain }: { date?: string; domain?: string }) {
    const data = await getUnifiedHudData(date);

    return (
        <div className={styles.hud}>
            <LiquidCard
                label="Liquid Time"
                value={data.time.liquid || 0}
                unit={data.time.unit}
                threshold={data.time.total || 168}
            />
            {domain !== "MONEY" && (
                <LiquidCard
                    label="Unallocated Cash"
                    value={data.money.liquid || 0}
                    unit=""
                    prefix={data.money.prefix}
                    threshold={data.money.total || 0}
                />
            )}

            {domain === "MONEY" && (
                <>
                    <LiquidCard
                        label="Total Budgeted"
                        value={data.money.budgeted || 0}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Total Funded"
                        value={data.money.funded || 0}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Total Spent"
                        value={data.money.spent || 0}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                    <LiquidCard
                        label="Unallocated Funds"
                        value={data.money.unallocatedFunds || 0}
                        unit={data.money.unit}
                        prefix={data.money.prefix}
                    />
                </>
            )}
        </div>
    );
}

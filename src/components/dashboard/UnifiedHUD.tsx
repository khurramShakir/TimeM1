import { getUnifiedHudData } from "@/lib/actions";
import { LiquidCard } from "./LiquidCard";
import styles from "./UnifiedHUD.module.css";

export async function UnifiedHUD({ date }: { date?: string }) {
    const data = await getUnifiedHudData(date);

    return (
        <div className={styles.hud}>
            <LiquidCard
                label="Liquid Time"
                value={data.time.liquid}
                unit={data.time.unit}
                threshold={data.time.total}
            />
            <LiquidCard
                label="Liquid Cash"
                value={data.money.liquid}
                unit=""
                prefix={data.money.unit}
                threshold={data.money.total}
            />
        </div>
    );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fillEnvelopes } from "@/actions/budget-actions";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Clock, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { getThemeColor, getLightColor, getTextColor } from "@/lib/colors";
import styles from "./page.module.css";

interface Envelope {
    id: number;
    name: string;
    budgeted: number;
    funded: number;
    color: string;
}

interface FillClientPageProps {
    periodId: number;
    envelopes: Envelope[];
    currency: string;
    domain: string;
}

export function FillClientPage({
    periodId,
    envelopes,
    currency,
    domain
}: FillClientPageProps) {
    const router = useRouter();
    const [totalAmount, setTotalAmount] = useState<string>("");
    const [description, setDescription] = useState(domain === "TIME" ? "Weekly Hours Implementation" : "Monthly Paycheck");
    const [allocations, setAllocations] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const targetEnvelopes = useMemo(() => envelopes.filter(e => e.name !== "Unallocated"), [envelopes]);

    const handleAllocationChange = (id: number, value: string) => {
        setAllocations(prev => ({ ...prev, [id]: value }));
    };

    const parsedTotal = parseFloat(totalAmount) || 0;
    const currentAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const remaining = parsedTotal - currentAllocated;

    const fmt = (val: number) => {
        if (domain === "TIME") return `${val.toFixed(1)}h`;
        return formatCurrency(val, currency);
    };

    const handleSubmit = async () => {
        if (parsedTotal <= 0 || remaining < 0 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const allocationList = Object.entries(allocations)
                .map(([id, amount]) => ({
                    envelopeId: Number(id),
                    amount: parseFloat(amount) || 0
                }))
                .filter(a => a.amount > 0);

            await fillEnvelopes(periodId, parsedTotal, allocationList, description);
            router.push(domain === "MONEY" ? "/dashboard/money" : "/dashboard/time");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to save allocation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const backUrl = domain === "MONEY" ? "/dashboard/money" : "/dashboard/time";

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Link href={backUrl} className={styles.backBtn}>
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                    <h1 className={styles.title}>Allocation Studio</h1>
                    <p className="text-gray-500 text-sm">Distribute your {domain === "TIME" ? "time" : "funds"} across envelopes.</p>
                </div>
            </header>

            <div className={styles.layout}>
                {/* Left: Source Control */}
                <div className={styles.sourceCard}>
                    <div className="mb-8">
                        <label className={styles.inputLabel}>
                            {domain === "TIME" ? "Hours to Allocate" : "Incoming Amount"}
                        </label>
                        <div className={styles.inflowInputContainer}>
                            <span className={styles.currency}>
                                {domain === "TIME" ? <Clock size={28} /> : (currency === "USD" ? "$" : currency)}
                            </span>
                            <input
                                type="number"
                                className={styles.inflowInput}
                                placeholder="0.00"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.descRow}>
                            <Pencil size={14} className={styles.descIcon} />
                            <input
                                placeholder="Add a label (e.g. Salary, Side Hustle)"
                                className={styles.descInput}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.statsBox}>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Allocated</span>
                            <span className={styles.statValue}>{fmt(currentAllocated)}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Remaining</span>
                            <span className={`${styles.statValueLarge} ${remaining < 0 ? styles.remainingNegative : styles.remainingPositive}`}>
                                {fmt(remaining)}
                            </span>
                        </div>

                        <button
                            className={styles.submitBtn}
                            disabled={isSubmitting || parsedTotal <= 0 || remaining < 0}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? "Processing..." : "Confirm & Distribute"}
                        </button>
                    </div>
                </div>

                {/* Right: Envelopes List */}
                <div className={styles.envelopesGrid}>
                    {targetEnvelopes.map(env => {
                        const themeColor = getThemeColor(env.color);
                        const lightBg = getLightColor(env.color);
                        const textColor = getTextColor(env.color);

                        return (
                            <div
                                key={env.id}
                                className={styles.envelopeCard}
                                style={{
                                    backgroundColor: lightBg,
                                    borderColor: `${themeColor}40`
                                }}
                            >
                                <div className={styles.envHeader}>
                                    <div
                                        className={styles.envIcon}
                                        style={{
                                            background: '#ffffff',
                                            color: themeColor
                                        }}
                                    >
                                        <ChevronRight size={16} />
                                    </div>
                                    <span className={styles.envName} style={{ color: '#1f2937' }}>{env.name}</span>
                                </div>

                                <div className={styles.envStats}>
                                    <div>
                                        <div className="text-[0.65rem] uppercase opacity-60 font-semibold mb-1">Target</div>
                                        <div className="font-bold" style={{ color: textColor }}>{fmt(env.budgeted)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[0.65rem] uppercase opacity-60 font-semibold mb-1">Current Funded</div>
                                        <div className="font-bold" style={{ color: env.funded >= env.budgeted && env.budgeted > 0 ? '#16a34a' : textColor }}>{fmt(env.funded)}</div>
                                    </div>
                                </div>

                                <div
                                    className={styles.envInputContainer}
                                    style={{ borderColor: `${themeColor}40` }}
                                >
                                    <span className={styles.envInputIcon} style={{ color: themeColor }}>+</span>
                                    <input
                                        type="number"
                                        className={styles.envInput}
                                        placeholder="0"
                                        value={allocations[env.id] || ""}
                                        onChange={(e) => handleAllocationChange(env.id, e.target.value)}
                                        style={{ color: '#111827' }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

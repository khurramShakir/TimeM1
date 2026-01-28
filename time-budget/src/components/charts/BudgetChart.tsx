"use client";

import React from "react";
import { Chart } from "react-google-charts";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend as RechartsLegend,
    ResponsiveContainer
} from "recharts";
import styles from "./BudgetChart.module.css";
import { formatValue } from "@/lib/format";

interface EnvelopeData {
    id: number;
    name: string;
    budgeted: number;
    spent: number;
    color: string;
}

interface BudgetChartProps {
    envelopes: EnvelopeData[];
    totalBudgeted: number;
    domain?: string;
    periodType?: string;
    totalAvailable?: number;
    currency?: string;
}

// Map app colors to 'Badge' background colors (Pastel) for Pie Chart
import { getLightColor } from "@/lib/colors";

export function BudgetChart({
    envelopes,
    totalBudgeted,
    domain = "TIME",
    periodType = "WEEKLY",
    totalAvailable = 168,
    currency = "USD"
}: BudgetChartProps) {
    // 1. Identify "Unallocated" envelope logic
    const explicitUnallocatedEnv = envelopes.find(e => e.name.toLowerCase() === "unallocated");
    const otherEnvelopes = envelopes.filter(e => e.name.toLowerCase() !== "unallocated");
    const isTime = domain === "TIME";
    const implicitUnallocated = isTime ? Math.max(0, totalAvailable - totalBudgeted) : 0;
    const totalUnallocated = (explicitUnallocatedEnv?.budgeted || 0) + implicitUnallocated;

    // --- Google Charts: Pie Chart Data (Allocation) ---
    const pieData = [
        ["Category", isTime ? "Hours" : "Amount"],
        ...otherEnvelopes.map(env => [env.name, env.budgeted]),
    ];

    if (isTime || totalUnallocated > 0) {
        pieData.push(["Unallocated", totalUnallocated]);
    }

    const pieColors = [
        ...otherEnvelopes.map(env => getLightColor(env.color)),
        "#f1f5f9" // unallocated
    ];

    const pieOptions = {
        is3D: true,
        backgroundColor: "transparent",
        chartArea: { left: "10%", top: "10%", width: "80%", height: "80%" }, // Reduced margin to prevent overlap
        legend: "none",
        colors: pieColors,
        tooltip: {
            text: "value",
            showColorCode: true,
            trigger: "focus"
        },
        pieSliceText: 'none',
        fontSize: 12
    };

    // --- Recharts: Bar Chart Data (Budget vs Spent) ---
    const barData = otherEnvelopes.map(env => ({
        name: env.name,
        Budget: env.budgeted,
        Spent: env.spent
    }));

    const trueAllocated = otherEnvelopes.reduce((sum, e) => sum + e.budgeted, 0);

    const periodLabel = periodType === "MONTHLY" ? "Monthly" : "Weekly";
    const hoursLabel = isTime ? `${totalAvailable} hours` : "your budget";

    return (
        <div className={styles.chartCard}>
            <div className={styles.header}>
                <h3 className={styles.title}>{isTime ? `${periodLabel} Budget Allocation` : "Expense Allocation"}</h3>
                <span className={styles.subtitle}>
                    {isTime ? `Where your ${hoursLabel} are going` : "Budget distribution across categories"}
                </span>
            </div>

            <div className={styles.content}>
                {/* Left: Google Charts 3D Pie Chart */}
                <div className={styles.chartWrapper}>
                    <Chart
                        chartType="PieChart"
                        data={pieData}
                        options={pieOptions}
                        width={"100%"}
                        height={"100%"}
                    />
                </div>

                {/* Right: Side Panel with Stats & Bar Chart */}
                <div className={styles.sidePanel}>
                    {/* Top: Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Total Capacity</span>
                            <span className={styles.statValueProminent}>
                                {formatValue(isTime ? totalAvailable : totalAvailable, domain, currency)}
                            </span>
                        </div>
                        {isTime && (
                            <>
                                <div className={styles.statDivider} />
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Target Plan</span>
                                    <span className={styles.statValueSecondary}>{trueAllocated.toFixed(1)}h</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom: Bar Chart (Comparison) */}
                    <div className={styles.barContainer}>
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={barData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 10, left: 30, bottom: 0 }}
                                    barGap={2}
                                    barCategoryGap="20%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={70}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    />
                                    <RechartsLegend wrapperStyle={{ fontSize: '11px' }} iconSize={8} />
                                    <Bar dataKey="Budget" fill="#cbd5e1" radius={[0, 3, 3, 0]} barSize={12} />
                                    <Bar dataKey="Spent" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyState}>No budgets set</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

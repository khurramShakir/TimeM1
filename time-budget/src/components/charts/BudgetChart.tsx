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
import { Card } from "@/components/ui/Card";

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
import { getLightColor, desaturateColor } from "@/lib/colors";

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

    // --- PaperBanana Color Palette (Pastel) ---
    const pastelPalette = ["#93c5fd", "#d8b4fe", "#86efac", "#fca5a5", "#fcd34d"];
    const UNALLOCATED_COLOR = "#e2e8f0"; // slate-200

    const getPastelColor = (index: number) => desaturateColor(pastelPalette[index % pastelPalette.length], 0.5);

    const pieColors = isTime ?
        [
            ...otherEnvelopes.map((_, i) => getPastelColor(i)),
            UNALLOCATED_COLOR
        ] :
        [
            ...otherEnvelopes.map(env => desaturateColor(getLightColor(env.color), 0.5)),
            UNALLOCATED_COLOR
        ];

    // Update Bar Chart colors below as well
    const spentColor = desaturateColor("#7c9885", 0.4); // Muted Sage
    const budgetColor = "#e2e8f0"; // Consistent light gray

    const pieOptions = {
        is3D: false, // Flat for PaperBanana
        pieHole: 0.4, // Donut chart looks cleaner
        backgroundColor: "transparent",
        chartArea: { left: "5%", top: "5%", width: "90%", height: "90%" },
        legend: "none",
        colors: pieColors,
        tooltip: {
            text: "value",
            showColorCode: true,
            trigger: "focus",
            textStyle: { fontName: 'inherit' }
        },
        pieSliceText: 'none',
        fontSize: 12,
        fontName: 'inherit'
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
        <Card className={styles.chartCard}>
            <div className={styles.header}>
                <h3 className={styles.title}>{isTime ? `${periodLabel} Budget` : "Expense Allocation"}</h3>
                <span className={styles.subtitle}>
                    {isTime ? `Where your ${hoursLabel} are going` : "Budget distribution across categories"}
                </span>
            </div>

            <div className={styles.content}>
                {/* Left: Pie Chart */}
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
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={70}
                                        tick={{ fontSize: 11, fill: '#525252', fontFamily: 'inherit' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{
                                            fontSize: '12px',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Bar dataKey="Budget" fill={budgetColor} radius={[0, 4, 4, 0]} barSize={10} />
                                    <Bar dataKey="Spent" fill={spentColor} radius={[0, 4, 4, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyState}>No budgets set</div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

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
}

// Map app colors to 'Badge' background colors (Pastel) for Pie Chart
const COLOR_VALUES: Record<string, string> = {
    blue: "#dbeafe",   // Blue-100
    purple: "#f3e8ff", // Purple-100
    green: "#d1fae5",  // Green-100
    gray: "#f3f4f6",   // Gray-100
    red: "#fee2e2",    // Red-100
    default: "#cbd5e1",
    unallocated: "#f1f5f9" // Slate-100
};

export function BudgetChart({ envelopes, totalBudgeted }: BudgetChartProps) {
    // 1. Identify "Unallocated" envelope logic
    const explicitUnallocatedEnv = envelopes.find(e => e.name.toLowerCase() === "unallocated");
    const otherEnvelopes = envelopes.filter(e => e.name.toLowerCase() !== "unallocated");
    const implicitUnallocated = Math.max(0, 168 - totalBudgeted);
    const totalUnallocated = (explicitUnallocatedEnv?.budgeted || 0) + implicitUnallocated;

    // --- Google Charts: Pie Chart Data (Allocation) ---
    const pieData = [
        ["Category", "Hours"],
        ...otherEnvelopes.map(env => [env.name, env.budgeted]),
        ["Unallocated", totalUnallocated]
    ];

    const pieColors = [
        ...otherEnvelopes.map(env => COLOR_VALUES[env.color] || COLOR_VALUES.default),
        COLOR_VALUES.unallocated
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

    return (
        <div className={styles.chartCard}>
            <div className={styles.header}>
                <h3 className={styles.title}>Weekly Budget Allocation</h3>
                <span className={styles.subtitle}>Where your 168 hours are going</span>
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
                            <span className={styles.statLabel}>Total Allocated</span>
                            <span className={styles.statValueProminent}>{trueAllocated.toFixed(1)}h</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Unallocated</span>
                            <span className={styles.statValueSecondary}>{totalUnallocated.toFixed(1)}h</span>
                        </div>
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

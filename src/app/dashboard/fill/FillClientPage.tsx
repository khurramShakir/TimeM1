"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fillEnvelopes } from "@/actions/budget-actions";
import { getBudgetTemplates, executeBudgetTemplate, upsertBudgetTemplate, setActiveTemplate, createEnvelopeForPeriod } from "@/lib/budget-actions";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Clock, Pencil, Scale, Zap, Save, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getThemeColor, getLightColor, PRESET_COLORS } from "@/lib/colors";
import { ReconcileModal } from "@/components/budget/ReconcileModal";
import styles from "./page.module.css";
import { addIncome } from "@/lib/actions";

interface Envelope {
    id: number;
    name: string;
    budgeted: number;
    funded: number;
    color: string;
}

interface TemplateItem {
    envelopeName: string;
    amount: number | string;
    fundingModeOverride: "ADD" | "RESET" | "INHERIT";
}

interface Template {
    id: string;
    name: string;
    domain: string;
    isAutoFillEnabled: boolean;
    isActive: boolean;
    isBuiltIn: boolean;
    defaultFundingMode: "ADD" | "RESET";
    items: TemplateItem[];
}

interface FillClientPageProps {
    periodId: number;
    envelopes: Envelope[];
    currency: string;
    domain: string;
    currentDate: string;
    allDistinctEnvelopes: string[];
}

export function FillClientPage({
    periodId,
    envelopes,
    currency,
    domain,
    currentDate,
    allDistinctEnvelopes
}: FillClientPageProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeTemplateId, setActiveTemplateId] = useState<string>("");
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [isReconcileOpen, setIsReconcileOpen] = useState(false);
    const [autoIncome, setAutoIncome] = useState(true);
    const [isManualMode, setIsManualMode] = useState(false);
    // Create Envelope modal state
    const [showCreateEnv, setShowCreateEnv] = useState(false);
    const [newEnvName, setNewEnvName] = useState("");
    const [newEnvColor, setNewEnvColor] = useState("blue");
    const [newEnvBudget, setNewEnvBudget] = useState("");
    const [customColorHex, setCustomColorHex] = useState("#cccccc");
    const [isCreatingEnv, setIsCreatingEnv] = useState(false);

    // Inline Income state
    const [inlineIncomeAmount, setInlineIncomeAmount] = useState<string>("");
    const [isAddingIncome, setIsAddingIncome] = useState(false);

    // Template Creation Modal
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateMode, setNewTemplateMode] = useState<"BLANK" | "DISTINCT" | "COPY">("DISTINCT");

    // Manual mode states
    const [totalAmount, setTotalAmount] = useState<string>("");
    const [description, setDescription] = useState(domain === "TIME" ? "Weekly Hours Allocation" : "Manual Fill");
    const [allocations, setAllocations] = useState<Record<number, string>>({});

    useEffect(() => {
        async function load() {
            const tData = await getBudgetTemplates(domain);
            setTemplates(tData as any);
            const active = (tData as any).find((t: any) => t.isActive);
            if (active) {
                setActiveTemplateId(active.id);
                setEditingTemplate(active);
            } else if (tData.length > 0) {
                setActiveTemplateId(tData[0].id);
                setEditingTemplate(tData[0]);
            }
        }
        load();
    }, [domain]);

    const handleTemplateSelect = (id: string) => {
        setActiveTemplateId(id);
        const t = templates.find(temp => temp.id === id);
        // We must clone the items array so editing one doesn't mutate the original list state
        if (t) setEditingTemplate({ ...t, items: [...t.items] });
    };

    // Calculate balances
    const unallocatedEnv = useMemo(() => envelopes.find(e => e.name === "Unallocated"), [envelopes]);
    const currentUnallocated = unallocatedEnv ? Number(unallocatedEnv.funded) : 0;
    const targetEnvelopes = useMemo(() => envelopes.filter(e => e.name !== "Unallocated"), [envelopes]);

    // Format utility
    const fmt = (val: number) => {
        if (domain === "TIME") return `${val.toFixed(1)}h`;
        return formatCurrency(val, currency);
    };

    // --- TEMPLATE ENGINE MODE LOGIC (mode-aware) ---
    const engineBreakdown = useMemo(() => {
        if (!editingTemplate) return { netPull: 0, netSweep: 0, engineRequiredFunds: 0 };
        let netPull = 0;
        let netSweep = 0;
        for (const item of editingTemplate.items) {
            const amount = parseFloat(item.amount as string) || 0;
            const mode = item.fundingModeOverride === "INHERIT" || !item.fundingModeOverride
                ? editingTemplate.defaultFundingMode
                : item.fundingModeOverride;
            if (mode === "ADD") {
                netPull += amount;
            } else {
                // RESET: pull only the gap, or sweep excess back
                const env = targetEnvelopes.find(e => e.name === item.envelopeName);
                const currentFunded = env ? Number(env.funded) : 0;
                const delta = amount - currentFunded;
                if (delta > 0) netPull += delta;
                else netSweep += Math.abs(delta);
            }
        }
        const engineRequiredFunds = editingTemplate.items.reduce((s, i) => s + (parseFloat(i.amount as string) || 0), 0);
        return { netPull, netSweep, engineRequiredFunds };
    }, [editingTemplate, targetEnvelopes]);

    const { netPull, netSweep, engineRequiredFunds } = engineBreakdown;
    // Effective funds available = Unallocated + sweeps that will come back
    const effectiveAvailable = currentUnallocated + netSweep;
    const engineDeficit = netPull - effectiveAvailable;
    const hasDeficit = engineDeficit > 0;

    // Dynamic font size — shrink as the formatted number grows longer
    // Left panel is ~250px; Courier is ~0.6em/char, so 8 chars @ 48px = ~230px max
    const heroFontSize = useMemo(() => {
        const len = fmt(engineRequiredFunds).length;
        if (len > 13) return '26px';
        if (len > 11) return '32px';
        if (len > 9) return '38px';
        if (len > 7) return '44px';
        return '48px';
    }, [engineRequiredFunds, fmt]);

    const handleMakeActive = async () => {
        if (!editingTemplate) return;
        try {
            await setActiveTemplate(editingTemplate.id);
            const updated = await getBudgetTemplates(domain);
            setTemplates(updated as any);
            setEditingTemplate({ ...editingTemplate });
        } catch (e: any) {
            alert(e.message || "Failed to activate template.");
        }
    };

    const handleResetTemplate = async () => {
        if (!editingTemplate) return;
        if (!confirm(`Reset "${editingTemplate.name}" to its last saved state?`)) return;
        const original = templates.find(t => t.id === editingTemplate.id);
        if (original) setEditingTemplate({ ...original, items: [...original.items] });
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate) return;
        setSaveStatus("saving");
        try {
            await upsertBudgetTemplate({
                id: editingTemplate.id || undefined,
                name: editingTemplate.name,
                domain: editingTemplate.domain,
                isAutoFillEnabled: editingTemplate.isAutoFillEnabled,
                defaultFundingMode: editingTemplate.defaultFundingMode,
                items: editingTemplate.items.map(i => ({
                    ...i,
                    amount: Number(i.amount) || 0
                }))
            });

            const updated = await getBudgetTemplates(domain);
            setTemplates(updated as any);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
            console.error("Failed to save template:", error);
            alert("Error saving template.");
            setSaveStatus("idle");
        }
    };

    const handleOpenTemplateModal = () => {
        setNewTemplateName(editingTemplate ? `${editingTemplate.name} (Copy)` : "New Template");
        setNewTemplateMode("DISTINCT");
        setShowTemplateModal(true);
    };

    const handleCreateTemplateSubmit = async () => {
        if (!newTemplateName.trim()) return;

        setSaveStatus("saving");
        setShowTemplateModal(false);

        try {
            let initialItems: { envelopeName: string; amount: number; fundingModeOverride: "ADD" | "RESET" | "INHERIT" }[] = [];

            if (newTemplateMode === "COPY" && editingTemplate) {
                initialItems = editingTemplate.items.map(i => ({
                    envelopeName: i.envelopeName,
                    amount: Number(i.amount) || 0,
                    fundingModeOverride: i.fundingModeOverride || "INHERIT"
                }));
            } else if (newTemplateMode === "DISTINCT") {
                initialItems = allDistinctEnvelopes.map(name => ({
                    envelopeName: name,
                    amount: 0,
                    fundingModeOverride: "INHERIT"
                }));
            }
            // else BLANK stays []

            const newItem = await upsertBudgetTemplate({
                name: newTemplateName.trim(),
                domain: domain,
                isAutoFillEnabled: false,
                defaultFundingMode: editingTemplate?.defaultFundingMode || "ADD",
                items: initialItems
            });

            const updated = await getBudgetTemplates(domain);
            setTemplates(updated as any);
            setActiveTemplateId(newItem.id);
            setEditingTemplate(updated.find((t: any) => t.id === newItem.id) as any);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
            console.error("Failed to save template as new:", error);
            alert("Error saving template.");
            setSaveStatus("idle");
        }
    };

    const handleRunEngine = async () => {
        if (!editingTemplate || isSubmitting) return;

        // Auto-save any unsaved inline edits first
        if (saveStatus !== "saved" && saveStatus !== "saving") {
            await handleSaveTemplate();
        }

        setIsSubmitting(true);
        try {
            await executeBudgetTemplate(editingTemplate.id, periodId, autoIncome);
            router.push(domain === "MONEY" ? "/dashboard/money" : "/dashboard/time");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to execute template.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateItem = (index: number, updates: Partial<TemplateItem>) => {
        if (!editingTemplate) return;
        const newItems = [...editingTemplate.items];
        newItems[index] = { ...newItems[index], ...updates };
        setEditingTemplate({ ...editingTemplate, items: newItems });
        setSaveStatus("idle"); // Mark dirty
    };

    const removeItem = (index: number) => {
        if (!editingTemplate) return;
        const newItems = [...editingTemplate.items];
        newItems.splice(index, 1);
        setEditingTemplate({ ...editingTemplate, items: newItems });
        setSaveStatus("idle");
    };

    const addItem = () => {
        if (!editingTemplate) return;
        const usedNames = new Set(editingTemplate.items.map(i => i.envelopeName));
        // Only add if there is an unused envelope
        const firstUnused = targetEnvelopes.find(e => !usedNames.has(e.name))?.name;
        if (!firstUnused) return; // all envelopes already added
        setEditingTemplate({
            ...editingTemplate,
            items: [...editingTemplate.items, { envelopeName: firstUnused, amount: "", fundingModeOverride: "INHERIT" }]
        });
        setSaveStatus("idle");
    };

    const hasUnusedEnvelopes = useMemo(() => {
        if (!editingTemplate) return false;
        const usedNames = new Set(editingTemplate.items.map(i => i.envelopeName));
        return targetEnvelopes.some(e => !usedNames.has(e.name));
    }, [editingTemplate, targetEnvelopes]);

    const handleCreateEnvelope = async () => {
        if (!newEnvName.trim()) return;
        // Determine actual color value: preset key or custom hex
        const colorValue = newEnvColor.startsWith("#") ? newEnvColor : newEnvColor;
        setIsCreatingEnv(true);
        try {
            await createEnvelopeForPeriod({
                name: newEnvName.trim(),
                color: colorValue,
                budgeted: parseFloat(newEnvBudget) || 0,
                periodId
            });
            setShowCreateEnv(false);
            setNewEnvName("");
            setNewEnvColor("blue");
            setNewEnvBudget("");
            setCustomColorHex("#cccccc");
            router.refresh();
        } catch (e: any) {
            alert(e.message || "Failed to create envelope.");
        } finally {
            setIsCreatingEnv(false);
        }
    };

    const handleAddInlineIncome = async () => {
        const amount = parseFloat(inlineIncomeAmount);
        if (!amount || amount <= 0 || isAddingIncome) return;
        setIsAddingIncome(true);
        try {
            await addIncome(periodId, amount);
            setInlineIncomeAmount("");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to add income.");
        } finally {
            setIsAddingIncome(false);
        }
    };

    // --- MANUAL MODE LOGIC ---
    const handleAllocationChange = (id: number, value: string) => {
        setAllocations(prev => ({ ...prev, [id]: value }));
    };
    const parsedTotal = parseFloat(totalAmount) || 0;
    const currentAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const manualRemaining = parsedTotal - currentAllocated;

    const handleManualSubmit = async () => {
        if (parsedTotal <= 0 || manualRemaining < 0 || isSubmitting) return;
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

    // Navigation Links
    const currentPathDate = new Date(currentDate);
    const prevDate = new Date(currentDate);
    const nextDate = new Date(currentDate);
    if (domain === "MONEY") {
        prevDate.setMonth(prevDate.getMonth() - 1);
        nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
        prevDate.setDate(prevDate.getDate() - 7);
        nextDate.setDate(nextDate.getDate() + 7);
    }

    const prevUrl = `/dashboard/fill?domain=${domain}&date=${prevDate.toISOString()}`;
    const nextUrl = `/dashboard/fill?domain=${domain}&date=${nextDate.toISOString()}`;

    const formattedPeriod = domain === "MONEY"
        ? currentPathDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        : `Week of ${currentPathDate.toLocaleDateString()}`;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="flex items-center justify-between w-full">
                    <div>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>Allocation Studio</h1>
                            <div className={styles.navGroup}>
                                <Link href={prevUrl} className={styles.navArrow}><ChevronLeft size={16} /></Link>
                                <span>{formattedPeriod}</span>
                                <Link href={nextUrl} className={styles.navArrow}><ChevronRight size={16} /></Link>
                            </div>
                        </div>
                        <p className={styles.subtitle}>
                            {isManualMode ? `Manually distribute ${domain === "TIME" ? "time" : "funds"} across envelopes.` : `Directly edit your active blueprint and deploy ${domain === "TIME" ? "time" : "funds"}.`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className={styles.reconcileTopBtn}
                            onClick={() => setIsReconcileOpen(true)}
                        >
                            <Scale size={16} /> Reconcile Drift
                        </button>
                    </div>
                </div>
            </header>

            <ReconcileModal
                isOpen={isReconcileOpen}
                onClose={() => setIsReconcileOpen(false)}
                periodId={periodId}
                currentUnallocated={currentUnallocated}
                currency={currency}
            />

            {!isManualMode ? (
                <div className={styles.layout}>
                    {/* Left: The Engine */}
                    <div className={styles.enginePanel}>
                        <div className={styles.unallocatedBox}>
                            <span className={styles.unallocatedLabel}>Budgeted Amount</span>
                            <div
                                className={styles.unallocatedAmount}
                                style={{ fontSize: heroFontSize }}
                            >
                                {fmt(engineRequiredFunds)}
                            </div>
                        </div>

                        {/* Inline Income Entry */}
                        <div className={styles.inlineIncomeRow}>
                            <input
                                type="number"
                                className={styles.inlineIncomeInput}
                                placeholder="Add income amount..."
                                value={inlineIncomeAmount}
                                onChange={(e) => setInlineIncomeAmount(e.target.value)}
                            />
                            <button
                                className={styles.inlineIncomeBtn}
                                onClick={handleAddInlineIncome}
                                disabled={isAddingIncome || !inlineIncomeAmount || parseFloat(inlineIncomeAmount) <= 0}
                            >
                                {isAddingIncome ? "..." : "Add"}
                            </button>
                        </div>

                        <div className={styles.engineStats}>
                            <div className={styles.statRow}>
                                <span className={styles.statTextMuted}>Ready to Deploy</span>
                                <span className={styles.statFontMono}>{fmt(currentUnallocated)}</span>
                            </div>
                            {netSweep > 0 && (
                                <div className={styles.statRow}>
                                    <span className={styles.statTextMuted}>Expected Sweeps Back</span>
                                    <span className={`${styles.statFontMono}`} style={{ color: '#16a34a' }}>+{fmt(netSweep)}</span>
                                </div>
                            )}
                            <div className={styles.statRow}>
                                <span className={styles.statTextMuted}>Net Required</span>
                                <span className={`${styles.statFontMono} ${(hasDeficit && domain === "MONEY") ? styles.statTextDanger : ''}`}>
                                    {fmt(netPull)}
                                </span>
                            </div>
                            <div className={`${styles.statRow} ${(hasDeficit && domain === "MONEY") ? styles.statTextDanger : ''}`}>
                                <span>{hasDeficit ? 'Deficit' : 'Surplus'}</span>
                                <span className={styles.statFontMono}>
                                    {hasDeficit ? `-${fmt(Math.abs(engineDeficit))}` : `+${fmt(Math.abs(engineDeficit))}`}
                                </span>
                            </div>
                        </div>

                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={autoIncome}
                                onChange={(e) => setAutoIncome(e.target.checked)}
                            />
                            <span>
                                <strong>Auto-Income Injection</strong><br />
                                Automatically generate an income transaction to cover any deficit before sweeping funds.
                            </span>
                        </label>

                        <button
                            className={styles.massiveBtn}
                            onClick={handleRunEngine}
                            disabled={isSubmitting || !editingTemplate || (hasDeficit && !autoIncome)}
                        >
                            <Zap size={20} fill="currentColor" /> Run Template Engine
                        </button>

                        <div>
                            <a
                                className={styles.switchModeLink}
                                onClick={() => setIsManualMode(true)}
                            >
                                Switch to Manual Form Entry
                            </a>
                        </div>
                    </div>

                    {/* Right: The Blueprint */}
                    <div className={styles.blueprintPanel}>
                        <div className={styles.blueprintHeader}>
                            <div className={styles.templateSelector}>
                                <label>Active Master Blueprint</label>
                                <select
                                    className={styles.templateDropdown}
                                    value={activeTemplateId}
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                >
                                    {templates.length === 0 && <option value="">No templates found</option>}
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                {/* Template text action links */}
                                <div className={styles.templateLinks}>
                                    <button className={styles.templateLinkBtn} onClick={handleSaveTemplate} disabled={!editingTemplate}>Save</button>
                                    <span className={styles.templateLinkDot}>|</span>
                                    <button className={styles.templateLinkBtn} onClick={handleOpenTemplateModal}>Create New / Copy</button>
                                    <span className={styles.templateLinkDot}>|</span>
                                    <button className={`${styles.templateLinkBtn} ${styles.templateLinkBtnDanger}`} onClick={handleResetTemplate} disabled={!editingTemplate}>Reset</button>
                                    {saveStatus === "saved" && <><span className={styles.templateLinkDot}>|</span><span className={styles.templateLinkSaved}>✓ Saved</span></>}
                                    {saveStatus === "saving" && <><span className={styles.templateLinkDot}>|</span><span className={styles.templateLinkSaving}>Saving...</span></>}
                                </div>
                            </div>
                            {/* Active checkbox right side */}
                            <label className={styles.activeCheckboxRow}>
                                <input
                                    type="checkbox"
                                    checked={editingTemplate?.isActive ?? false}
                                    onChange={() => handleMakeActive()}
                                    disabled={!editingTemplate || editingTemplate.isActive}
                                    className={styles.activeCheckbox}
                                />
                                <span className={styles.activeCheckboxLabel}>Active</span>
                            </label>
                        </div>

                        <table className={styles.editorTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '48%' }}>Envelope / Category</th>
                                    <th style={{ width: '17%', textAlign: 'center' }}>Mode</th>
                                    <th style={{ textAlign: 'right', width: '30%' }}>Target Amount</th>
                                    <th style={{ width: '5%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {editingTemplate?.items.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className={styles.emptyState}>
                                            No envelopes added to this template yet.
                                        </td>
                                    </tr>
                                )}
                                {editingTemplate?.items.map((item, index) => {
                                    const envInfo = targetEnvelopes.find(e => e.name === item.envelopeName);
                                    const color = envInfo ? getThemeColor(envInfo.color) : "#ccc";
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div className={styles.envelopeTd}>
                                                    <span className={styles.colorSwatch} style={{ backgroundColor: color }}></span>
                                                    <select
                                                        className={styles.envelopeSelect}
                                                        value={item.envelopeName}
                                                        onChange={(e) => updateItem(index, { envelopeName: e.target.value })}
                                                    >
                                                        {targetEnvelopes.map(e => (
                                                            <option key={e.id} value={e.name}>{e.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.modePills}>
                                                    {(['INHERIT', 'ADD', 'RESET'] as const).map((mode) => (
                                                        <button
                                                            key={mode}
                                                            className={`${styles.modePill} ${(item.fundingModeOverride || 'INHERIT') === mode ? styles.modePillActive : ''}`}
                                                            onClick={() => updateItem(index, { fundingModeOverride: mode })}
                                                            title={mode === 'INHERIT' ? 'Use template default' : mode === 'ADD' ? 'Add amount on top of current funds' : 'Set envelope to exact target amount'}
                                                        >
                                                            {mode === 'INHERIT' ? 'AUTO' : mode === 'ADD' ? 'ADD' : 'TARGET'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className={`${styles.inputGhost} ${styles.inputAmount}`}
                                                    value={item.amount}
                                                    onChange={(e) => updateItem(index, { amount: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className={styles.actionIcon} onClick={() => removeItem(index)} title="Remove row">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className={styles.tableFooter}>
                            <button className={styles.addRow} onClick={addItem} disabled={!editingTemplate || !hasUnusedEnvelopes}>
                                <Plus size={16} /> Add Envelope Row
                            </button>
                            <button className={styles.createEnvBtn} onClick={() => setShowCreateEnv(true)} disabled={!editingTemplate}>
                                <Plus size={14} /> Create New Envelope
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- MANUAL MODE --- */
                <div className={styles.layout}>
                    <div className={styles.manualSourceCard}>
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
                                <span className={`${styles.statValueLarge} ${manualRemaining < 0 ? styles.remainingNegative : styles.remainingPositive}`}>
                                    {fmt(manualRemaining)}
                                </span>
                            </div>
                        </div>

                        <button
                            className={styles.submitBtn}
                            disabled={isSubmitting || parsedTotal <= 0 || manualRemaining < 0}
                            onClick={handleManualSubmit}
                        >
                            {isSubmitting ? "Distributing..." : "Distribute Manually"}
                        </button>

                        <a
                            className={styles.switchModeLink}
                            onClick={() => setIsManualMode(false)}
                        >
                            Back to Allocation Studio (Template Engine)
                        </a>
                    </div>

                    <div className={styles.envelopesGrid}>
                        {targetEnvelopes.map(env => (
                            <div key={env.id} className={styles.envelopeCard}>
                                <div className={styles.envHeader}>
                                    <div className={styles.envIcon} style={{ background: getLightColor(env.color), color: getThemeColor(env.color) }}>
                                        ★
                                    </div>
                                    <div className={styles.envName}>{env.name}</div>
                                </div>

                                <div className={styles.envInputContainer}>
                                    <span className={styles.envInputIcon}>{domain === "TIME" ? "h" : (currency === "USD" ? "$" : currency)}</span>
                                    <input
                                        type="number"
                                        className={styles.envInput}
                                        placeholder="0.00"
                                        value={allocations[env.id] || ""}
                                        onChange={(e) => handleAllocationChange(env.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}\n
            {/* Template Creation Modal */}
            {showTemplateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalTitle}>Create Template</h2>

                        <div className={styles.inputGroup}>
                            <label>Template Name</label>
                            <input
                                type="text"
                                className={styles.inputField}
                                placeholder="e.g. Master Plan V2"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Starting Point</label>
                            <select
                                className={styles.inputField}
                                value={newTemplateMode}
                                onChange={(e) => setNewTemplateMode(e.target.value as any)}
                            >
                                <option value="DISTINCT">Pre-fill with All Past Envelopes ($0.00)</option>
                                <option value="BLANK">Start Completely Blank</option>
                                {editingTemplate && (
                                    <option value="COPY">Duplicate "{editingTemplate.name}"</option>
                                )}
                            </select>
                            <p style={{ fontSize: '12px', color: 'var(--txt-sec)', marginTop: '0.25rem' }}>
                                {newTemplateMode === "DISTINCT" && "Creates a template containing all envelopes you have previously used, set to $0.00."}
                                {newTemplateMode === "BLANK" && "Start fresh with zero envelopes."}
                                {newTemplateMode === "COPY" && "Copies the currently active template."}
                            </p>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.btnGhostSm}
                                onClick={() => setShowTemplateModal(false)}
                                disabled={saveStatus === "saving"}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btnSm}
                                onClick={handleCreateTemplateSubmit}
                                disabled={!newTemplateName.trim() || saveStatus === "saving"}
                            >
                                {saveStatus === "saving" ? "Saving..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Envelope Modal */}
            {showCreateEnv && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateEnv(false)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>New Envelope</h3>
                        <div className={styles.modalBody}>
                            <label className={styles.modalLabel}>Name</label>
                            <input
                                className={styles.modalInput}
                                type="text"
                                placeholder="e.g. Groceries"
                                value={newEnvName}
                                onChange={(e) => setNewEnvName(e.target.value)}
                                autoFocus
                            />
                            <label className={styles.modalLabel} style={{ marginTop: '1rem' }}>Budgeted Amount</label>
                            <div className={styles.modalInputPrefixed}>
                                <span className={styles.modalInputPrefix}>
                                    {domain === "TIME" ? "h" : (currency === "USD" ? "$" : currency)}
                                </span>
                                <input
                                    className={styles.modalInput}
                                    type="number"
                                    placeholder="0.0"
                                    value={newEnvBudget}
                                    onChange={(e) => setNewEnvBudget(e.target.value)}
                                    style={{ paddingLeft: '2.25rem' }}
                                />
                            </div>
                            <label className={styles.modalLabel} style={{ marginTop: '1rem' }}>Color</label>
                            <div className={styles.colorGrid}>
                                {Object.entries(PRESET_COLORS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        className={`${styles.colorSwatch2} ${newEnvColor === key ? styles.colorSwatchActive : ''}`}
                                        style={{ background: val.theme }}
                                        onClick={() => setNewEnvColor(key)}
                                        title={key}
                                    />
                                ))}
                                {/* Custom color swatch with `+` button */}
                                <label
                                    className={`${styles.colorSwatch2} ${newEnvColor === customColorHex ? styles.colorSwatchActive : ''} ${styles.colorSwatchCustom}`}
                                    style={{ background: customColorHex }}
                                    title="Custom color"
                                >
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => { setCustomColorHex(e.target.value); setNewEnvColor(e.target.value); }}
                                        className={styles.colorInputHidden}
                                    />
                                    {newEnvColor !== customColorHex && <span className={styles.customColorPlus}>+</span>}
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.blueprintBtn} onClick={() => setShowCreateEnv(false)}>Cancel</button>
                            <button
                                className={`${styles.blueprintBtn} ${styles.blueprintBtnPrimary}`}
                                onClick={handleCreateEnvelope}
                                disabled={!newEnvName.trim() || isCreatingEnv}
                            >
                                {isCreatingEnv ? 'Creating...' : 'Save Envelope'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { Clock, Banknote, Globe, Save, Loader2, User } from "lucide-react";
import { getUserSettings, updateUserSettings, updateUserProfile } from "@/lib/actions";
import styles from "./page.module.css";

type Tab = "profile" | "general" | "time" | "money";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [settings, setSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function load() {
            const data = await getUserSettings();
            setSettings(data);
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        try {
            // Save Settings
            await updateUserSettings({
                currency: settings.currency,
                weekStart: Number(settings.weekStart),
                defaultDomain: settings.defaultDomain,
                defaultPeriod: settings.defaultPeriod,
                timeCapacity: Number(settings.timeCapacity)
            });

            // Save Profile
            await updateUserProfile({
                name: settings.user.name
            });

            setMessage("Settings saved successfully!");
        } catch (error) {
            console.error(error);
            setMessage("Failed to save settings.");
        } finally {
            setIsSaving(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        }
    };

    if (!settings) {
        return (
            <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className={styles.spin} size={32} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Settings</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "profile" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    <User size={18} /> Profile
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "general" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("general")}
                >
                    <Globe size={18} /> General
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "time" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("time")}
                >
                    <Clock size={18} /> Time
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "money" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("money")}
                >
                    <Banknote size={18} /> Money
                </button>
            </div>

            <form onSubmit={handleSave} className={styles.card}>
                {activeTab === "profile" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Profile Details</h2>
                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Display Name</label>
                                    <p className={styles.hint}>Your name as seen in the app.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="text"
                                        value={settings.user.name || ""}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            user: { ...settings.user, name: e.target.value }
                                        })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Email Address</label>
                                    <p className={styles.hint}>Used for account identification.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="email"
                                        value={settings.user.email}
                                        disabled
                                        className={styles.disabledInput}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "general" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>General Preferences</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Default Domain</label>
                                    <p className={styles.hint}>Choose your primary dashboard.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.defaultDomain}
                                        onChange={(e) => setSettings({ ...settings, defaultDomain: e.target.value })}
                                    >
                                        <option value="TIME">Time Management</option>
                                        <option value="MONEY">Money Management</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Start of Week</label>
                                    <p className={styles.hint}>Affects weekly view calculations.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.weekStart}
                                        onChange={(e) => setSettings({ ...settings, weekStart: e.target.value })}
                                    >
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Default Period Type</label>
                                    <p className={styles.hint}>Your preferred budgeting cycle.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.defaultPeriod}
                                        onChange={(e) => setSettings({ ...settings, defaultPeriod: e.target.value })}
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "time" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Time Management</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Weekly Capacity</label>
                                    <p className={styles.hint}>Total hours to budget per week (max 168).</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="168"
                                        value={settings.timeCapacity}
                                        onChange={(e) => setSettings({ ...settings, timeCapacity: e.target.value })}
                                        placeholder="168"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "money" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Money Management</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Currency Symbol</label>
                                    <p className={styles.hint}>Symbol used for monetary values.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    >
                                        <option value="USD">$ (USD)</option>
                                        <option value="EUR">€ (EUR)</option>
                                        <option value="GBP">£ (GBP)</option>
                                        <option value="JPY">¥ (JPY)</option>
                                        <option value="CAD">C$ (CAD)</option>
                                        <option value="AUD">A$ (AUD)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                        {isSaving ? <Loader2 className={styles.spin} size={20} /> : <Save size={20} />}
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                    {message && <span className={styles.message}>{message}</span>}
                </div>
            </form>
        </div>
    );
}

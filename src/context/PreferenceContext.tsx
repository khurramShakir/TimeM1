"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { updateUserSettings } from "@/lib/actions";

type Theme = "default" | "paper-banana";

export const FONT_OPTIONS: Record<string, string> = {
    // Monospaced
    "courier": "var(--font-courier-prime)",
    "space-mono": "var(--font-space-mono)",
    "ibm-plex-mono": "var(--font-ibm-plex-mono)",
    "jetbrains-mono": "var(--font-jetbrains-mono)",
    "dm-mono": "var(--font-dm-mono)",

    // Sans-Serif
    "inter": "var(--font-inter)",
    "outfit": "var(--font-outfit)",
    "manrope": "var(--font-manrope)",

    // System Fallbacks
    "system-sans": "system-ui, -apple-system, sans-serif",
    "system-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

interface PreferenceContextType {
    theme: Theme;
    fontFamily: string;
    fontSize: number;
    setTheme: (theme: Theme) => void;
    setFontFamily: (font: string) => void;
    setFontSize: (size: number) => void;
    toggleTheme: () => void;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export function PreferenceProvider({ children, initialSettings }: {
    children: React.ReactNode;
    initialSettings?: { theme?: Theme; fontFamily?: string | null; fontSize?: number };
}) {
    // FORCE "paper-banana" as the only theme.
    // We keep the state/types for compatibility but effectively lock it.
    const [theme, setThemeState] = useState<Theme>("paper-banana");
    const [fontFamily, setFontFamilyState] = useState<string>("var(--font-courier-prime)");
    const [fontSize, setFontSizeState] = useState<number>(18);

    // Initialize state from initialSettings or localStorage
    useEffect(() => {
        // Force paper-banana regardless of storage for theme
        const effectiveTheme = "paper-banana";

        const savedFont = localStorage.getItem("timem1-font");
        const effectiveFont = initialSettings?.fontFamily || savedFont || "var(--font-courier-prime)";

        const savedFontSize = localStorage.getItem("timem1-fontSize");
        // Default to 18 if not set, or use saved/initial
        let effectiveFontSize = 18;
        if (initialSettings?.fontSize) {
            effectiveFontSize = initialSettings.fontSize;
        } else if (savedFontSize) {
            effectiveFontSize = parseInt(savedFontSize);
        }

        setThemeState(effectiveTheme as Theme);
        setFontFamilyState(effectiveFont);
        setFontSizeState(effectiveFontSize);

        document.documentElement.setAttribute("data-theme", effectiveTheme);
        document.documentElement.style.setProperty("--user-font", effectiveFont);
        document.documentElement.style.setProperty("--app-font-size", `${effectiveFontSize}px`);
    }, [initialSettings]);

    const setTheme = (newTheme: Theme) => {
        // No-op or just force paper-banana
        setThemeState("paper-banana");
        localStorage.setItem("timem1-theme", "paper-banana");
        document.documentElement.setAttribute("data-theme", "paper-banana");
    };

    const setFontFamily = (newFont: string) => {
        setFontFamilyState(newFont);
        localStorage.setItem("timem1-font", newFont);
        document.documentElement.style.setProperty("--user-font", newFont);

        // Sync to DB (Optimistic update on settings page will handle this specifically)
        updateUserSettings({ fontFamily: newFont }).catch(console.error);
    };

    const setFontSize = (newSize: number) => {
        setFontSizeState(newSize);
        localStorage.setItem("timem1-fontSize", newSize.toString());
        document.documentElement.style.setProperty("--app-font-size", `${newSize}px`);

        updateUserSettings({ fontSize: newSize }).catch(console.error);
    };

    const toggleTheme = () => {
        // No-op: Always stay on paper-banana
        setTheme("paper-banana");
    };

    return (
        <PreferenceContext.Provider value={{ theme, fontFamily, fontSize, setTheme, setFontFamily, setFontSize, toggleTheme }}>
            {children}
        </PreferenceContext.Provider>
    );
}

export function usePreference() {
    const context = useContext(PreferenceContext);
    if (context === undefined) {
        throw new Error("usePreference must be used within a PreferenceProvider");
    }
    return context;
}

// Aliases for backward compatibility
export { usePreference as useTheme };

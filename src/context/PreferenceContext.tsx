"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { updateUserSettings } from "@/lib/actions";

type Theme = "default" | "paper-banana";

export const FONT_OPTIONS: Record<string, string> = {
    "inter": "var(--font-inter)",
    "courier": "var(--font-courier-prime)",
    "system-sans": "system-ui, -apple-system, sans-serif",
    "system-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "roboto": "'Roboto', sans-serif",
    "opensans": "'Open Sans', sans-serif",
    "roboto-mono": "'Roboto Mono', monospace",
    "firacode": "'Fira Code', monospace",
};

interface PreferenceContextType {
    theme: Theme;
    fontFamily: string;
    setTheme: (theme: Theme) => void;
    setFontFamily: (font: string) => void;
    toggleTheme: () => void;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export function PreferenceProvider({ children, initialSettings }: {
    children: React.ReactNode;
    initialSettings?: { theme?: Theme; fontFamily?: string | null };
}) {
    const [theme, setThemeState] = useState<Theme>("default");
    const [fontFamily, setFontFamilyState] = useState<string>("var(--font-inter)");

    // Initialize state from initialSettings or localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("timem1-theme") as Theme;
        const savedFont = localStorage.getItem("timem1-font");

        const effectiveTheme = initialSettings?.theme || savedTheme || "default";
        const effectiveFont = initialSettings?.fontFamily || savedFont || "var(--font-inter)";

        setThemeState(effectiveTheme as Theme);
        setFontFamilyState(effectiveFont);

        document.documentElement.setAttribute("data-theme", effectiveTheme);
        document.documentElement.style.setProperty("--user-font", effectiveFont);
    }, [initialSettings]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("timem1-theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const setFontFamily = (newFont: string) => {
        setFontFamilyState(newFont);
        localStorage.setItem("timem1-font", newFont);
        document.documentElement.style.setProperty("--user-font", newFont);

        // Sync to DB (Optimistic update on settings page will handle this specifically)
        updateUserSettings({ fontFamily: newFont }).catch(console.error);
    };

    const toggleTheme = () => {
        const newTheme = theme === "default" ? "paper-banana" : "default";
        setTheme(newTheme);
    };

    return (
        <PreferenceContext.Provider value={{ theme, fontFamily, setTheme, setFontFamily, toggleTheme }}>
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

/**
 * Centralized color utility for the application.
 * Maps color names (presets) to their respective hex values for both solid and light themes.
 */

export const PRESET_COLORS: Record<string, { theme: string; light: string; text: string }> = {
    blue: { theme: "#2563eb", light: "#dbeafe", text: "#1e40af" },
    green: { theme: "#16a34a", light: "#d1fae5", text: "#065f46" },
    purple: { theme: "#9333ea", light: "#f3e8ff", text: "#6b21a8" },
    red: { theme: "#dc2626", light: "#fee2e2", text: "#991b1b" },
    gray: { theme: "#4b5563", light: "#f3f4f6", text: "#1f2937" },
    orange: { theme: "#f97316", light: "#ffedd5", text: "#9a3412" },
    pink: { theme: "#ec4899", light: "#fce7f3", text: "#9d174d" },
    indigo: { theme: "#6366f1", light: "#e0e7ff", text: "#3730a3" },
};

/**
 * Blends a hex color with white to create a lighter version.
 * Returns a standard 6-digit hex code compatible with all libraries (like Google Charts).
 */
function blendWithWhite(hex: string, alpha: number): string {
    // Basic validation: ensure it's a 6-digit hex
    if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) return hex;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const mix = (c: number) => {
        const value = Math.round(c * alpha + 255 * (1 - alpha));
        return Math.min(255, value).toString(16).padStart(2, '0');
    };

    return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/**
 * Returns the solid "brand" color for a given color name or hex.
 */
export function getThemeColor(color: string | null | undefined): string {
    if (!color) return PRESET_COLORS.gray.theme;
    if (color.startsWith("#")) return color;
    return PRESET_COLORS[color]?.theme || PRESET_COLORS.gray.theme;
}

/**
 * Returns a light/pastel version of the color (for backgrounds).
 * Uses blendWithWhite for custom hex codes to ensure compatibility.
 */
export function getLightColor(color: string | null | undefined): string {
    if (!color) return PRESET_COLORS.gray.light;
    if (color.startsWith("#")) {
        // Blend with white instead of using alpha channel for better library compatibility
        return blendWithWhite(color, 0.15);
    }
    return PRESET_COLORS[color]?.light || PRESET_COLORS.gray.light;
}

/**
 * Returns a dark/high-contrast version of the color (for text).
 */
export function getTextColor(color: string | null | undefined): string {
    if (!color) return PRESET_COLORS.gray.text;
    if (color.startsWith("#")) {
        // For custom hex, use the theme color as text color
        return color;
    }
    return PRESET_COLORS[color]?.text || PRESET_COLORS.gray.text;
}

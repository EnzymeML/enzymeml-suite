import { getBadgeColor } from "@suite/components/CardHeader";
import { GlobalToken } from "antd";

/**
 * Generates container styles for LLM extraction components with theme-aware colors and CSS variables.
 * 
 * This utility creates a consistent styling object that includes:
 * - CSS custom properties for primary colors with various opacity levels
 * - Theme-aware background and text colors from Ant Design tokens
 * - Standard padding for container elements
 * 
 * The primary color adapts based on dark/light mode:
 * - Dark mode: Lime green (rgb(50, 205, 50))
 * - Light mode: Pink/magenta (rgb(206, 9, 123))
 * 
 * @param darkMode - Boolean indicating if dark mode is active
 * @param token - Ant Design GlobalToken object containing theme colors
 * @returns React.CSSProperties object with CSS variables and styling properties
 */
export function glowingContainerStyle(darkMode: boolean, token: GlobalToken): React.CSSProperties {
    const badgeColor = getBadgeColor(darkMode);
    const primaryColorRgb = darkMode ? '50, 205, 50' : '206, 9, 123'; // lime: rgb(50, 205, 50), #ce097b: rgb(206, 9, 123)

    return {
        '--bg-color': token.colorBgContainer,
        '--primary-color': badgeColor,
        '--primary-color-transparent': `rgba(${primaryColorRgb}, 0.3)`, // 30% opacity
        '--primary-color-glow': `rgba(${primaryColorRgb}, 0.2)`, // 20% opacity for glow
        '--primary-color-subtle': `rgba(${primaryColorRgb}, 0.1)`, // 10% opacity for subtle outer glow
        padding: 16,
        color: token.colorText,
    } as React.CSSProperties;
}
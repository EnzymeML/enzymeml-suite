/**
 * Utility functions for OS detection and keyboard shortcut handling
 */

/**
 * Detects if the current platform is macOS
 * @returns boolean indicating if the platform is macOS
 */
export function isMacOS(): boolean {
    return typeof navigator !== 'undefined' &&
        (navigator.platform.toLowerCase().includes('mac') ||
            navigator.userAgent.toLowerCase().includes('mac'));
}

/**
 * Gets the appropriate modifier key symbol based on the OS
 * @returns string representing the modifier key (⌘ for Mac, Ctrl+ for others)
 */
export function getModifierKeySymbol(): string {
    return isMacOS() ? '⌘' : 'Ctrl+';
}

/**
 * Formats a keyboard shortcut display string based on the OS
 * @param key The key letter (e.g., 'O', 'S', 'R')
 * @returns Formatted shortcut string (e.g., '⌘O' on Mac, 'Ctrl+O' on Windows/Linux)
 */
export function formatKeyboardShortcut(key: string): string {
    const modifier = getModifierKeySymbol();
    const separator = isMacOS() ? '' : '+';
    return `${modifier}${separator}${key.toUpperCase()}`;
}

/**
 * Creates keyboard shortcut options for both Mac and Windows/Linux
 * @param key The key to bind
 * @param callback The function to execute
 * @param enabled Whether the shortcut is enabled
 * @returns Array of shortcut options for both platforms
 */
export function createCrossPlatformShortcut(
    key: string,
    callback: () => void,
    enabled: boolean = true
) {
    return [
        {
            key: key.toLowerCase(),
            metaKey: true, // Cmd key on Mac
            callback,
            enabled,
        },
        {
            key: key.toLowerCase(),
            ctrlKey: true, // Ctrl key on Windows/Linux
            callback,
            enabled,
        },
    ];
}

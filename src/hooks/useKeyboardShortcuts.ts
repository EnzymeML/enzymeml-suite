import { useEffect } from 'react';

interface KeyboardShortcutOptions {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean; // Cmd key on Mac
    altKey?: boolean;
    shiftKey?: boolean;
    callback: () => void;
    enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutOptions[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                // Skip if shortcut is disabled
                if (shortcut.enabled === false) continue;

                // Check if the key matches
                if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

                // Check modifier keys
                const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
                const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
                const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

                // If all conditions match, execute the callback
                if (ctrlMatch && metaMatch && altMatch && shiftMatch) {
                    event.preventDefault();
                    event.stopPropagation();
                    shortcut.callback();
                    break; // Only execute the first matching shortcut
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
}

/**
 * Helper function to create shortcuts for toggling extraction modal
 * Supports both Cmd+L (Mac) and Ctrl+L (Windows/Linux)
 */
export function useExtractionModalShortcuts(toggleModal: () => void, enabled: boolean = true) {
    useKeyboardShortcuts([
        {
            key: 'l',
            metaKey: true, // Cmd+L on Mac
            callback: toggleModal,
            enabled,
        },
        {
            key: 'l',
            ctrlKey: true, // Ctrl+L on Windows/Linux
            callback: toggleModal,
            enabled,
        },
    ]);
}

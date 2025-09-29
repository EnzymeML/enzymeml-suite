import { useEffect } from 'react';
import { createCrossPlatformShortcut } from '../utilities/osutils';
import { loadJSON, saveEntry, exportToJSON, newEntry } from '../commands/dataio';
import { NotificationType } from '../components/NotificationProvider';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

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
                    break;
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

/**
 * File menu keyboard shortcuts interface
 */
export interface FileMenuShortcuts {
    onOpen?: () => void;
    onSave?: () => void;
    onExport?: () => void;
    onClose?: () => void;
    onNew?: () => void;
    openNotification: (message: string, type: NotificationType, description: string) => void;
    navigate?: (path: string) => void;
    appWindow: WebviewWindow;
}

/**
 * Helper function to create shortcuts for file menu operations
 * Supports cross-platform shortcuts:
 * - Open: Cmd+O (Mac) / Ctrl+O (Windows/Linux)
 * - Save: Cmd+S (Mac) / Ctrl+S (Windows/Linux)  
 * - Export: Cmd+R (Mac) / Ctrl+R (Windows/Linux)
 * - New: Cmd+N (Mac) / Ctrl+N (Windows/Linux)
 * - Close: Cmd+W (Mac) / Ctrl+W (Windows/Linux)
 */
export function useFileMenuShortcuts({
    onOpen,
    onSave,
    onExport,
    onClose,
    onNew,
    openNotification,
    navigate,
    appWindow
}: FileMenuShortcuts, enabled: boolean = true) {
    const shortcuts = [];

    const openHandler = onOpen || (() => {
        loadJSON().then(() => {
            openNotification('Entry loaded', NotificationType.SUCCESS, 'Your entry has been loaded successfully');
            navigate?.('/');
        }).catch((error) => {
            openNotification('Error loading entry', NotificationType.ERROR, error.toString());
        });
    });
    const exportHandler = onExport || (() => exportToJSON().then((path) => {
        openNotification('Entry exported', NotificationType.SUCCESS, 'Your entry has been exported successfully to ' + path);
    }).catch((error) => {
        openNotification('Error exporting entry', NotificationType.ERROR, error.toString());
    }));
    const closeHandler = onClose || (() => appWindow.close());

    const saveHandler = onSave || (() => saveEntry().then(() => {
        openNotification('Entry saved', NotificationType.SUCCESS, 'Your entry has been saved successfully');
    }).catch((error) => {
        openNotification('Error saving entry', NotificationType.ERROR, error.toString());
    }));

    const newHandler = onNew || (() => newEntry().then(() => {
        openNotification('New entry created', NotificationType.SUCCESS, 'Your new entry has been created successfully');
        navigate?.('/');
    }).catch((error) => {
        openNotification('Error creating new entry', NotificationType.ERROR, error.toString());
    }));

    shortcuts.push(...createCrossPlatformShortcut('o', openHandler, enabled));
    shortcuts.push(...createCrossPlatformShortcut('s', saveHandler, enabled));
    shortcuts.push(...createCrossPlatformShortcut('r', exportHandler, enabled));
    shortcuts.push(...createCrossPlatformShortcut('n', newHandler, enabled));
    shortcuts.push(...createCrossPlatformShortcut('w', closeHandler, enabled));

    useKeyboardShortcuts(shortcuts);
}

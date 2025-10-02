import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Interface defining the configuration window state and actions
 */
interface ConfigWindowState {
    // States
    /** The currently selected Python installation path, null if none selected */
    pythonPath: string | null,

    // Actions
    /** 
     * Sets the Python installation path
     * @param pythonPath - The path to the Python executable, or null to clear selection
     */
    setPythonPath: (pythonPath: string | null) => void,
}

/**
 * Zustand store for managing application configuration state
 * 
 * This store handles configuration settings that need to persist across sessions,
 * including the selected Python installation path for Jupyter integration.
 * 
 * Features:
 * - Persistent storage using localStorage
 * - DevTools integration for debugging
 * - Type-safe state management
 */
const useConfigStore = create<ConfigWindowState>()(
    devtools(
        persist(
            (set) => ({
                // States
                pythonPath: null,
                // Actions
                setPythonPath: (pythonPath: string | null) => set({ pythonPath }),
            }),
            {
                name: 'config-storage',
            },
        ),
    ),
)

export default useConfigStore
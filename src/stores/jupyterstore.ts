import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * State interface for the Jupyter store
 */
interface JupyterWindowState {
    /** Current number of active Jupyter sessions */
    numberOfSessions: number,
    /** Decrements the session count by 1 */
    removeSession: () => void,
    /** Increments the session count by 1 */
    addSession: () => void,
    /** Sets the session count to a specific number (for synchronization) */
    setNumberOfSessions: (count: number) => void,
}

/**
 * Zustand store for managing Jupyter session state.
 * Session count is reset on each app startup to ensure accuracy.
 * 
 * Features:
 * - Session count tracking (non-persistent)
 * - Simple increment/decrement operations for session management
 * - DevTools integration for debugging state changes
 */
const useJupyterStore = create<JupyterWindowState>()(
    devtools(
        (set) => ({
            // States
            numberOfSessions: 0,
            // Actions
            removeSession: () => set((state) => ({ numberOfSessions: state.numberOfSessions - 1 })),
            addSession: () => set((state) => ({ numberOfSessions: state.numberOfSessions + 1 })),
            setNumberOfSessions: (count: number) => set(() => ({ numberOfSessions: count })),
        }),
    ),
)

export default useJupyterStore
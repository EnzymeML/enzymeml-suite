import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'

interface AppState {
    darkMode: boolean
    setDarkMode: (darkMode: boolean) => void
}

const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set) => ({
                // States
                darkMode: false,

                // Actions
                setDarkMode: (darkMode) => set(() => ({darkMode: darkMode})),
            }),
            {
                name: 'bear-storage',
            },
        ),
    ),
)

export default useAppStore
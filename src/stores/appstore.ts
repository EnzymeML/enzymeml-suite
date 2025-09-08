import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { NotificationType } from "../components/NotificationProvider.tsx";

export type openNotificationType = (message: string, type: NotificationType, description: string) => void

export enum AvailablePaths {
    HOME = '/',
    VESSELS = '/vessels',
    SMALL_MOLECULES = '/small-molecules',
    PROTEINS = '/proteins',
    REACTIONS = '/reactions',
    MEASUREMENTS = '/measurements',
    MODELLING = '/modelling',
}

interface AppState {
    // States
    darkMode: boolean
    themePreference: string
    openNotification: openNotificationType
    databasesToUse: string[]
    currentPath: AvailablePaths
    selectedId: string | null
    // Actions
    setThemePreference: (themePreference: string) => void
    setOpenNotification: (openNotification: openNotificationType) => void
    setDarkMode: (darkMode: boolean) => void
    setDatabasesToUse: (databasesToUse: string[]) => void
    setCurrentPath: (currentPath: AvailablePaths) => void
    setSelectedId: (selectedId: string | null) => void
}

const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set) => ({
                // States
                darkMode: false,
                themePreference: localStorage.getItem('theme') || 'system',
                openNotification: () => null,
                databasesToUse: ['pubchem', 'uniprot'],
                currentPath: AvailablePaths.HOME,
                selectedId: null,

                // Actions
                setThemePreference: (themePreference) => set(() => {
                    localStorage.setItem('theme', themePreference);
                    return {
                        themePreference: themePreference
                    }
                }),
                setCurrentPath: (currentPath: AvailablePaths) => set(() => ({ currentPath: currentPath })),
                setDarkMode: (darkMode) => set(() => ({ darkMode: darkMode })),
                setOpenNotification: (openNotification) => set(() => ({ openNotification: openNotification })),
                setDatabasesToUse: (databasesToUse) => set(() => {
                    localStorage.setItem('databasesToUse', JSON.stringify(databasesToUse));
                    return {
                        databasesToUse: databasesToUse
                    }
                }),
                setSelectedId: (selectedId) => set(() => {
                    return {
                        selectedId: selectedId
                    }
                })
            }),
            {
                name: 'bear-storage',
            },
        ),
    ),
)

export default useAppStore
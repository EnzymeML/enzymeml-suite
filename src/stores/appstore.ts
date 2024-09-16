import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'
import {NotificationType} from "../components/NotificationProvider.tsx";

type openNotificationType = (message: string, type: NotificationType, description: string) => void

interface AppState {
    darkMode: boolean
    themePreference: string
    setThemePreference: (themePreference: string) => void
    setDarkMode: (darkMode: boolean) => void
    openNotification: openNotificationType
    setOpenNotification: (openNotification: openNotificationType) => void
    databasesToUse: string[]
    setDatabasesToUse: (databasesToUse: string[]) => void
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

                // Actions
                setThemePreference: (themePreference) => set(() => {
                    localStorage.setItem('theme', themePreference);
                    return {
                        themePreference: themePreference
                    }
                }),
                setDarkMode: (darkMode) => set(() => ({darkMode: darkMode})),
                setOpenNotification: (openNotification) => set(() => ({openNotification: openNotification})),
                setDatabasesToUse: (databasesToUse) => set(() => {
                    localStorage.setItem('databasesToUse', JSON.stringify(databasesToUse));
                    return {
                        databasesToUse: databasesToUse
                    }
                }),
            }),
            {
                name: 'bear-storage',
            },
        ),
    ),
)

export default useAppStore
import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'

export interface SelectedMeasurement {
    id: string,
    name: string,
}

interface VizWindowState {
    // States
    selectedMeasurement: string | null,
    useLines: boolean,
    usePoints: boolean,
    // Actions
    setSelectedMeasurement: (id: string) => void,
    setUseLines: (useLines: boolean) => void,
    setUsePoints: (usePoints: boolean) => void,
}

const useVizStore = create<VizWindowState>()(
    devtools(
        persist(
            (set) => ({
                // States
                selectedMeasurement: null,
                useLines: true,
                usePoints: false,
                // Actions
                setSelectedMeasurement: (id: string) => set({selectedMeasurement: id}),
                setUseLines: (useLines: boolean) => set({useLines}),
                setUsePoints: (usePoints: boolean) => set({usePoints}),
            }),
            {
                name: 'viz-storage',
            },
        ),
    ),
)

export default useVizStore
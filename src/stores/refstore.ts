import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'

interface RefState {
    refs: { [key: string]: HTMLDivElement | null };
    addRef: (id: string, ref: HTMLDivElement | null) => void;
    getRef: (id: string) => HTMLDivElement | null;
    removeRef: (id: string) => void;
}

const useRefStore = create<RefState>()(
    devtools(
        persist(
            (set, get) => ({
                // States
                refs: {},
                // Actions
                addRef: (id, ref) => set((state) => {
                    return {refs: {...state.refs, [id]: ref}}
                }),
                getRef: (id) => {
                    const refs = get().refs;
                    console.log(refs)
                    return refs[id]
                },
                removeRef: (id) => set((state) => {
                    const refs = {...state.refs}
                    delete refs[id]
                    return {refs}
                }),

            }),
            {
                name: 'ref-storage',
            },
        ),
    ),
)

export default useRefStore
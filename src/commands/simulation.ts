import {invoke} from "@tauri-apps/api/tauri";

export type InitialConditionsType = {
    [key: string]: number
}

export interface SimulationResult {
    time: number[],
    species: {
        [key: string]: number[]
    },
}

export async function simulateDocument(initialConditions: InitialConditionsType): Promise<SimulationResult[]> {
    try {
        return await invoke('simulate_enzymeml', {initialConditions: initialConditions});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function openSimulation(): Promise<void> {
    try {
        await invoke('open_simulator', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
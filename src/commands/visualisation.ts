import {invoke} from "@tauri-apps/api/tauri";

export type VisData = Map<string, number[]>

export async function openVisualisation(): Promise<void> {
    try {
        await invoke('open_visualisation', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function getMeasurementHashMap(id: string): Promise<VisData> {
    try {
        return await invoke('get_measurement_hashmap', {id: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
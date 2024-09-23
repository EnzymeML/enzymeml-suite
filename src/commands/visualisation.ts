import {invoke} from "@tauri-apps/api/tauri";

export interface VisData {
    id: string,
    data: DataPoint[],
}

interface DataPoint {
    x: number,
    y: number,
}

export async function openVisualisation(): Promise<void> {
    try {
        await invoke('open_visualisation', {});
    } catch (error) {
        throw new Error(error as string);
    }
}

export async function getDataPoints(id: string): Promise<VisData> {
    try {
        return await invoke('get_datapoints', {id: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
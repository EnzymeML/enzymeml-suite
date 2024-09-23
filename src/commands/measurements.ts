import {invoke} from "@tauri-apps/api/tauri";
import {Measurement} from "enzymeml/src";

export async function createMeasurement(): Promise<string> {
    try {
        return await invoke('create_measurement', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listMeasurements(): Promise<[string, string][]> {
    try {
        return await invoke('list_measurements', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function getMeasurement(id: string): Promise<Measurement> {
    try {
        return await invoke('get_measurement', {id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateMeasurement(id: string, data: Measurement): Promise<void> {
    console.log('Updating measurement:', id, data)
    try {
        await invoke('update_measurement', {id: id, data: data});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteMeasurement(id: string): Promise<void> {
    try {
        await invoke('delete_measurement', {id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
import {invoke} from '@tauri-apps/api/tauri';
// @ts-ignore
import {EnzymeMLDocument} from "enzymeml";

export type DBEntries = [string, number];

export interface EnzymeMLState {
    id?: number,
    title: string,
    doc: EnzymeMLDocument,
}

export async function listEntries(): Promise<DBEntries[]> {
    try {
        return await invoke<DBEntries[]>('list_all_entries');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
};

export async function saveEntry(): Promise<void> {
    try {
        await invoke('save');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function newEntry(): Promise<void> {
    try {
        await invoke('new_document');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function exportToJSON(): Promise<string> {
    try {
        return await invoke<string>('export_to_json');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function getState(): Promise<EnzymeMLState> {
    try {
        return await invoke<EnzymeMLState>('get_state');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function exportMeasurements(): Promise<string> {
    try {
        return await invoke<string>('export_measurements');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function importMeasurement(): Promise<number> {
    try {
        return await invoke('import_excel_meas');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
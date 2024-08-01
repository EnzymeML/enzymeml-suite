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
        console.error('Error invoking command:', error);
        return [["Error", 0]];
    }
};

export async function saveEntry(): Promise<void> {
    try {
        await invoke('save');
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function newEntry(): Promise<void> {
    try {
        await invoke('new_document');
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function exportToJSON(): Promise<string> {
    try {
        return await invoke<string>('export_to_json');
    } catch (error) {
        console.error('Error invoking command:', error);
        return '';
    }
}

export async function getState(): Promise<EnzymeMLState> {
    try {
        return await invoke<EnzymeMLState>('get_state');
    } catch (error) {
        throw error;
    }
}
import { invoke } from "@tauri-apps/api/core";
import { Protein } from "enzymeml";

export async function createProtein(): Promise<string> {
    try {
        return await invoke('create_protein', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listProteins(): Promise<[string, string][]> {
    try {
        return await invoke('list_proteins', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function getProtein(id: string): Promise<Protein> {
    try {
        return await invoke('get_protein', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateProtein(id: string, data: Protein): Promise<void> {
    try {
        await invoke('update_protein', { id: id, data: data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteProtein(id: string): Promise<void> {
    try {
        await invoke('delete_protein', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
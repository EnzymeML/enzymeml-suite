import {invoke} from "@tauri-apps/api/tauri";
import {SmallMolecule} from "../../../enzymeml-ts/src";

export async function createSmallMolecule() {
    try {
        await invoke('create_small_mol', {});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function listSmallMolecules(): Promise<[string, string][]> {
    try {
        return await invoke('list_small_mols', {});
    } catch (error) {
        console.error('Error invoking command:', error);
        return [];
    }

}

export async function getSmallMolecule(id: string): Promise<SmallMolecule | undefined> {
    try {
        return await invoke('get_small_mol', {id});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function updateSmallMolecule(id: string, data: SmallMolecule) {
    try {
        await invoke('update_small_mol', {id: id, data: data});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function deleteSmallMolecule(id: string) {
    try {
        await invoke('delete_small_mol', {id});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}
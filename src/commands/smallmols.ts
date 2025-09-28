import { invoke } from "@tauri-apps/api/core";
import { SmallMolecule } from "enzymeml";

export async function createSmallMolecule(): Promise<string> {
    try {
        return await invoke('create_small_mol', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function addSmallMolecules(data: SmallMolecule[]): Promise<void> {
    try {
        await invoke('add_small_mols', { data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function addSmallMolecule(data: SmallMolecule): Promise<void> {
    try {
        await invoke('add_small_mol', { data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listSmallMolecules(): Promise<[string, string][]> {
    try {
        return await invoke('list_small_mols', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function getSmallMolecule(id: string): Promise<SmallMolecule> {
    try {
        return await invoke('get_small_mol', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateSmallMolecule(id: string, data: SmallMolecule): Promise<void> {
    try {
        console.log(data);
        const res = await invoke('update_small_mol', { id: id, data: data });
        console.log(res);
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteSmallMolecule(id: string): Promise<void> {
    try {
        await invoke('delete_small_mol', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

/**
 * Lists all small molecules with their SMILES strings
 * @returns Promise with a record of all small molecules with their SMILES strings
 */
export async function listSmallMoleculesWithSMILES(): Promise<Record<string, string>> {
    try {
        return await invoke('list_small_mol_smiles', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
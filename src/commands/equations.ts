import { Equation } from "enzymeml";
import { invoke } from "@tauri-apps/api/tauri";

export async function listEquations(): Promise<[string, string][]> {
    try {
        return await invoke('list_equations', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function createEquation(): Promise<string> {
    try {
        return await invoke('create_equation', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function updateEquation(id: string, data: Equation): Promise<void> {
    try {
        await invoke('update_equation', { id: id, data: data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function getEquation(id: string): Promise<Equation> {
    try {
        return await invoke('get_equation', { id: id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteEquation(id: string): Promise<void> {
    try {
        await invoke('delete_equation', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deriveModel(): Promise<void> {
    try {
        await invoke('derive_from_reactions', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

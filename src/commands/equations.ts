import {Equation, EquationType} from "enzymeml/src";
import {invoke} from "@tauri-apps/api/tauri";

export async function createEquation(speciesId: string, equationType: EquationType): Promise<void> {
    try {
        await invoke('create_equation', {speciesId: speciesId, equationType: equationType});
    } catch (error) {
        console.error('Error invoking command:', error);
    }

}

export async function updateEquation(id: string, data: Equation): Promise<void> {
    try {
        await invoke('update_equation', {id: id, data: data});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function getEquation(id: string): Promise<Equation> {
    try {
        return await invoke('get_equation', {id: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

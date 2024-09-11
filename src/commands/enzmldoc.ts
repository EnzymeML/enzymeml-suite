import {invoke} from "@tauri-apps/api/tauri";

export async function setTitle(title?: string): Promise<void> {

    if (!title) {
        title = 'EnzymeML Document';
    }

    try {
        await invoke('set_title', {title: title});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listAllSpeciesIds(): Promise<string[]> {
    try {
        return await invoke('get_all_species_ids');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listAllNonConstantSpeciesIds(): Promise<string[]> {
    try {
        return await invoke('get_all_non_constant_species_ids');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function getSpeciesNameByID(id: string): Promise<string> {
    try {
        return await invoke('get_species_name', {speciesId: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
import { invoke } from "@tauri-apps/api/core";
import { Reaction } from "enzymeml";

export async function addReactions(data: Reaction[]): Promise<void> {
    try {
        await invoke('add_reactions', { data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function addReaction(data: Reaction): Promise<void> {
    try {
        await invoke('add_reaction', { data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function createReaction(): Promise<string> {
    try {
        return await invoke('create_reaction', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function listReactions(): Promise<[string, string][]> {
    try {
        return await invoke('list_reactions', {});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function getReaction(id: string): Promise<Reaction> {
    try {
        return await invoke('get_reaction', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateReaction(id: string, data: Reaction): Promise<void> {
    try {
        const kineticLaw = data.kinetic_law;

        if (!kineticLaw?.equation) {
            data.kinetic_law = null
        }

        await invoke('update_reaction', { id: id, data: data });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteReaction(id: string): Promise<void> {
    try {
        await invoke('delete_reaction', { id });
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
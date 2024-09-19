import {invoke} from "@tauri-apps/api/tauri";
import {Reaction} from "../../../enzymeml-ts/src";

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
        return await invoke('get_reaction', {id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateReaction(id: string, data: Reaction): Promise<void> {
    try {
        await invoke('update_reaction', {id: id, data: data});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteReaction(id: string): Promise<void> {
    try {
        await invoke('delete_reaction', {id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
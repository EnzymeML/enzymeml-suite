import {invoke} from "@tauri-apps/api/tauri";
import {Vessel} from "../../../enzymeml-ts/src";

export async function createVessel() {
    try {
        await invoke('create_vessel', {});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function listVessels(): Promise<[string, string][]> {
    try {
        return await invoke('list_vessels', {});
    } catch (error) {
        console.error('Error invoking command:', error);
        return [];
    }

}

export async function getVessel(id: string): Promise<Vessel | undefined> {
    try {
        return await invoke('get_vessel', {id});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function updateVessel(id: string, data: Vessel) {
    try {
        await invoke('update_vessel', {id: id, data: data});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}

export async function deleteVessel(id: string) {
    try {
        await invoke('delete_vessel', {id});
    } catch (error) {
        console.error('Error invoking command:', error);
    }
}
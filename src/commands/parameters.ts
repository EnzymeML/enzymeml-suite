import {invoke} from "@tauri-apps/api/tauri";
import {Parameter} from "enzymeml/src";

export async function listAllParametersIds(): Promise<[string, string][]> {
    try {
        return await invoke('list_parameters');
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function createParameter(name: string): Promise<void> {
    try {
        await invoke('create_parameter', {name: name});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}


export async function getParameter(id: string): Promise<Parameter> {
    try {
        return await invoke('get_parameter', {id: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function updateParameter(id: string, data: Parameter): Promise<void> {
    try {
        await invoke('update_parameter', {id: id, data: data});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function deleteParameter(id: string): Promise<void> {
    try {
        await invoke('delete_parameter', {id: id});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
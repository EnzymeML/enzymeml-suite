import {invoke} from "@tauri-apps/api/tauri";
import {UnitDefinition} from "enzymeml/src";

export enum UnitTypes {
    VOLUME = 'Volume',
    MASS = 'Mass',
    TIME = 'Time',
    MOLES = 'Moles',
    CONCENTRATION = 'Concentration',
    MASS_CONCENTRATION = 'MassConcentration',
    TEMPERATURE = 'Temperature',

}

export type UnitMap = { [key: string]: UnitDefinition }

export async function getUnitGroups(unitTypes: UnitTypes[]): Promise<UnitMap> {
    try {
        return await invoke('get_unit_groups', {unitTypes: unitTypes});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }

}

export async function getUnitGroup(unitType: UnitTypes): Promise<UnitMap> {
    try {
        return await invoke('get_unit_group', {unitType: unitType});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}

export async function getUnitByString(unitString: string): Promise<UnitDefinition> {
    try {
        return await invoke('get_unit', {unit: unitString});
    } catch (error) {
        throw new Error('Error invoking command: ' + error);
    }
}
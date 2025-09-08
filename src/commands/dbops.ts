import { invoke } from "@tauri-apps/api/tauri";

// Interface for DBSmallMolecule based on the Rust model
export interface DBSmallMolecule {
    id: number;
    name: string;
    canonical_smiles?: string;
    inchi?: string;
    inchikey?: string;
    references?: string[];
}

/**
 * Saves or updates a small molecule in the database
 * @param id The ID of the small molecule to save
 * @returns Promise with the number of affected rows
 */
export async function saveMoleculeToDb(id: string): Promise<void> {
    try {
        console.log('Saving molecule to database: ' + id);
        await invoke('save_mol_to_db', { id });
    } catch (error) {
        throw new Error('Error saving molecule to database: ' + error);
    }
}

/**
 * Filters small molecules by name
 * @param name The name to filter by
 * @returns Promise with an array of matching small molecules
 */
export async function filterSmallMolecules(name: string): Promise<DBSmallMolecule[]> {
    try {
        return await invoke('filter_small_mols', { name });
    } catch (error) {
        throw new Error('Error filtering small molecules: ' + error);
    }
}

/**
 * Gets a small molecule by ID
 * @param id The ID of the small molecule to get
 * @returns Promise with the small molecule
 */
export async function getSmallMoleculeById(id: number): Promise<DBSmallMolecule> {
    try {
        return await invoke('get_small_mol_by_id', { id });
    } catch (error) {
        throw new Error('Error getting small molecule by ID: ' + error);
    }
}

/**
 * Gets all small molecules from the database
 * @returns Promise with an array of all small molecules
 */
export async function getAllSmallMolecules(): Promise<DBSmallMolecule[]> {
    try {
        return await invoke('get_all_small_mols', {});
    } catch (error) {
        throw new Error('Error getting all small molecules: ' + error);
    }
}

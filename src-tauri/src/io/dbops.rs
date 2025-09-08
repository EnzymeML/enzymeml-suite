use diesel::prelude::*;
use std::sync::Arc;
use tauri::State;

use crate::{
    db::establish_db_connection, filter_table, get_object, get_row, get_rows, models,
    schema::small_molecules, states::EnzymeMLState, upsert_row,
};

/// Saves or updates a small molecule in the database
///
/// This function retrieves a small molecule from the EnzymeML document state
/// using the provided ID and saves or updates it in the database. The function
/// uses an upsert operation to handle both new insertions and updates of existing
/// records based on the molecule's name.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `id` - The unique identifier of the small molecule to save
///
/// # Returns
/// Result containing the number of affected rows on success, or an error message on failure
#[tauri::command]
pub fn save_mol_to_db(state: State<Arc<EnzymeMLState>>, id: String) -> Result<usize, String> {
    let mol = get_object!(state.doc, small_molecules, id, id);
    if let Ok(mol) = mol {
        upsert_row!(small_molecules, models::DBNewSmallMolecule, name, mol)
    } else {
        Err(format!("Failed to get small molecule with id {}", id))
    }
}

/// Filters small molecules by name
///
/// This function queries the database to find small molecules that match the
/// provided name. It performs a filtered search on the small_molecules table
/// and returns all matching records.
///
/// # Arguments
/// * `name` - The name of the small molecule to search for
///
/// # Returns
/// Result containing a vector of matching small molecules or an error message
#[tauri::command]
pub fn filter_small_mols(name: String) -> Result<Vec<models::DBSmallMolecule>, String> {
    filter_table!(
        small_molecules,         // The table to filter
        models::DBSmallMolecule, // The type to deserialize rows into
        small_molecules::name,   // The column to filter by
        name                     // The value to filter for
    )
}

/// Gets a small molecule by ID
///
/// This function retrieves a specific small molecule from the database using its
/// unique ID. If the molecule has references, they are processed from a comma-separated
/// string into a vector format for easier consumption by the frontend.
///
/// # Arguments
/// * `id` - The unique database ID of the small molecule to retrieve
///
/// # Returns
/// Result containing the requested small molecule or an error message if not found
#[tauri::command]
pub fn get_small_mol_by_id(id: i32) -> Result<models::DBSmallMolecule, String> {
    let row = get_row!(small_molecules, models::DBSmallMolecule, id);
    if let Ok(mut row) = row {
        row.references = row.references.map(|refs| refs.split(',').collect());
        Ok(row)
    } else {
        Err(format!("Failed to get small molecule with id {}", id))
    }
}

/// Gets all small molecules from the database
///
/// This function retrieves all small molecule records from the database and
/// returns them as a vector. This is useful for displaying complete lists
/// or for performing bulk operations on the entire small molecules collection.
///
/// # Returns
/// Result containing a vector of all small molecules or an error message on failure
#[tauri::command]
pub fn get_all_small_mols() -> Result<Vec<models::DBSmallMolecule>, String> {
    get_rows!(small_molecules, models::DBSmallMolecule)
}

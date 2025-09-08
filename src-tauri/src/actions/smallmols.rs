use enzymeml::prelude::{SmallMolecule, SmallMoleculeBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{create_object, delete_object, get_object, update_event, update_object};

/// Creates a new small molecule in the EnzymeML document and adds a corresponding ODE equation
///
/// This function creates a new small molecule using the SmallMoleculeBuilder, assigns it a unique ID,
/// and automatically creates an associated ODE equation for the species. The small molecule is added
/// to the document's small_molecules collection, and the ODE is added to the equations collection.
/// Finally, it emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// The unique ID string of the newly created small molecule
#[tauri::command]
pub fn create_small_mol(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    // Create the object itself
    let mut builder = SmallMoleculeBuilder::default();
    builder.name("New Small Molecule".to_string());
    builder.constant(false);

    let id = create_object!(state.doc, small_molecules, builder, "s", id);

    update_event!(app_handle, "update_small_mols");

    id
}

/// Updates an existing small molecule in the EnzymeML document
///
/// This function replaces an existing small molecule's data with the provided updated data.
/// The small molecule is identified by its ID within the provided data object. After updating
/// the document, it emits an update event for the specific small molecule to notify the frontend.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `data` - The updated small molecule data containing the modifications to apply
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// Result indicating success with empty tuple or failure with error message string
#[tauri::command]
pub fn update_small_mol(
    state: State<Arc<EnzymeMLState>>,
    data: SmallMolecule,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, small_molecules, data, id);

    update_event!(app_handle, &id);

    Ok(())
}

/// Lists all small molecules in the EnzymeML document
///
/// This function retrieves all small molecules from the document and returns a simplified
/// list containing only the ID and name of each small molecule. This is typically used
/// for populating dropdown menus or selection lists in the frontend interface.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
///
/// # Returns
/// Vector of tuples where each tuple contains the ID and name of a small molecule
#[tauri::command]
pub fn list_small_mols(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .small_molecules
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

/// Retrieves a specific small molecule from the EnzymeML document
///
/// This function searches for and returns a complete small molecule object by its unique ID.
/// The returned object contains all properties and data associated with the small molecule,
/// including its name, concentration, and other molecular properties.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `id` - The unique identifier string of the small molecule to retrieve
///
/// # Returns
/// Result containing either the requested SmallMolecule object or an error message if not found
#[tauri::command]
pub fn get_small_mol(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<SmallMolecule, String> {
    get_object!(state.doc, small_molecules, id, id)
}

/// Deletes a small molecule and its associated ODE from the EnzymeML document
///
/// This function removes both the small molecule and its corresponding ODE equation from
/// the document. The small molecule is removed from the small_molecules collection, and
/// the associated ODE is removed from the equations collection using the same species ID.
/// After deletion, it emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `id` - The unique identifier string of the small molecule to delete
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// Result indicating success with empty tuple or failure with error message string
#[tauri::command]
pub fn delete_small_mol(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, small_molecules, id, id);

    // Delete the ODE for the small molecule
    let species_id = id.to_string();
    delete_object!(state.doc, equations, species_id.clone(), species_id);

    update_event!(app_handle, "update_small_mols");

    Ok(())
}

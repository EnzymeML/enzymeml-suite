use enzymeml::prelude::{Protein, ProteinBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{create_object, delete_object, get_object, update_event, update_object};

/// Creates a new protein in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// The ID of the created protein
#[tauri::command]
pub fn create_protein(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    let mut builder = ProteinBuilder::default();
    builder.name("New Protein".to_string());
    builder.constant(true);

    let id = create_object!(state.doc, proteins, builder, "p", id);

    update_event!(app_handle, "update_proteins");

    id
}

/// Updates an existing protein in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `data` - The updated protein data
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn update_protein(
    state: State<Arc<EnzymeMLState>>,
    data: Protein,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, proteins, data, id);

    update_event!(app_handle, &id);

    Ok(())
}

/// Retrieves all proteins from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing the ID and name of each protein
#[tauri::command]
pub fn list_proteins(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .proteins
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

/// Retrieves a specific protein by its ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the protein to retrieve
///
/// # Returns
/// Result containing the protein or an error if not found
#[tauri::command]
pub fn get_protein(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Protein, String> {
    get_object!(state.doc, proteins, id, id)
}

/// Deletes a protein from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the protein to delete
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn delete_protein(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, proteins, id, id);

    update_event!(app_handle, "update_proteins");

    Ok(())
}

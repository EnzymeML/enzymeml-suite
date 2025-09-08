use enzymeml::prelude::{Reaction, ReactionBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{create_object, delete_object, get_object, update_event, update_object};

/// Creates a new reaction in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// The ID of the created reaction
#[tauri::command]
pub fn create_reaction(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    let mut builder = ReactionBuilder::default();
    builder.name("New Reaction".to_string());
    builder.reversible(false);

    let id = create_object!(state.doc, reactions, builder, "r", id);

    update_event!(app_handle, "update_reactions");

    id
}

/// Updates an existing reaction in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `data` - The updated reaction data
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn update_reaction(
    state: State<Arc<EnzymeMLState>>,
    data: Reaction,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, reactions, data, id);

    update_event!(app_handle, &id);

    Ok(())
}

/// Retrieves all reactions from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing the ID and name of each reaction
#[tauri::command]
pub fn list_reactions(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .reactions
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

/// Retrieves a specific reaction by its ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the reaction to retrieve
///
/// # Returns
/// Result containing the reaction or an error if not found
#[tauri::command]
pub fn get_reaction(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Reaction, String> {
    get_object!(state.doc, reactions, id, id)
}

/// Deletes a reaction from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the reaction to delete
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn delete_reaction(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, reactions, id, id);

    update_event!(app_handle, "update_reactions");

    Ok(())
}

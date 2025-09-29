use enzymeml::prelude::{Equation, Reaction, ReactionBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

use crate::actions::equations::process_equation;
use crate::actions::identifiers::REACTION_PREFIX;
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{add_objects, create_object, delete_object, get_object, update_event, update_object};

/// Adds a small molecule to the EnzymeML document
///
/// This function adds a reaction to the document's reactions collection.
/// It emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `object` - The reaction object to add
#[tauri::command]
pub fn add_reaction(
    state: State<Arc<EnzymeMLState>>,
    mut object: Reaction,
    app_handle: AppHandle,
) -> Result<String, String> {
    let mut state_guard = state.doc.lock().unwrap();
    let id = generate_id(
        &state_guard.reactions.iter().map(|s| s.id.clone()).collect(),
        REACTION_PREFIX,
    );

    // Process the kinetic law
    process_kinetic_law(&state, &object.kinetic_law, &app_handle)?;

    object.id = id.clone();
    state_guard.reactions.push(object.clone());
    drop(state_guard);
    update_event!(app_handle, "update_reactions");

    Ok(id)
}

/// Adds multiple reactions to the EnzymeML document
///
/// This function adds multiple reactions to the document's reactions collection.
/// It emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `data` - The vector of reaction objects to add
#[tauri::command]
pub fn add_reactions(
    state: State<Arc<EnzymeMLState>>,
    mut data: Vec<Reaction>,
    app_handle: AppHandle,
) -> Result<Vec<String>, String> {
    let mut existing_ids: Vec<String> = state
        .doc
        .lock()
        .unwrap()
        .reactions
        .iter()
        .map(|s| s.id.clone())
        .collect();

    let mut ids = Vec::with_capacity(data.len());
    let objects: Vec<Reaction> = data
        .iter_mut()
        .map(|o| {
            // Process the kinetic law
            if let Err(e) = process_kinetic_law(&state, &o.kinetic_law, &app_handle) {
                return Err(format!("Could not process equation: {}", e));
            }

            let id = generate_id(&existing_ids, REACTION_PREFIX);
            ids.push(id.clone());
            existing_ids.push(id.clone());
            o.id = id;
            Ok(o.clone())
        })
        .collect::<Result<Vec<Reaction>, String>>()?;

    add_objects!(state.doc, reactions, objects);
    update_event!(app_handle, "update_reactions");

    Ok(ids)
}

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

    let id = create_object!(state.doc, reactions, builder, REACTION_PREFIX, id);

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
    // Process the kinetic law
    process_kinetic_law(&state, &data.kinetic_law, &app_handle)?;

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

/// Processes a kinetic law to extract and create necessary parameters
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `kinetic_law` - The kinetic law to process
///
/// # Returns
/// Result indicating success or failure
fn process_kinetic_law(
    state: &State<Arc<EnzymeMLState>>,
    kinetic_law: &Option<Equation>,
    app_handle: &AppHandle,
) -> Result<(), String> {
    kinetic_law.as_ref().map_or(Ok(()), |law| {
        process_equation(state, law).map_err(|e| e.to_string())?;
        update_event!(app_handle, "update_parameters");
        Ok(())
    })
}

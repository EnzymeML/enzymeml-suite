use std::sync::Arc;

use enzymeml_rs::prelude::{Reaction, ReactionBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_event, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn create_reaction(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> String {
    let id = create_object!(
        state.doc, reactions,
        ReactionBuilder, "r", id
    );

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_reactions");
    
    id
}

#[tauri::command]
pub fn update_reaction(
    state: State<Arc<EnzymeMLState>>,
    data: Reaction,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, reactions, data, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, &id);

    Ok(())
}

#[tauri::command]
pub fn list_reactions(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.reactions
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

#[tauri::command]
pub fn get_reaction(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Reaction, String> {
    get_object!(state.doc, reactions, id, id)
}

#[tauri::command]
pub fn delete_reaction(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, reactions, id, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_reactions");

    Ok(())
}
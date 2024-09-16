use std::sync::Arc;

use enzymeml_rs::prelude::{Protein, ProteinBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_event, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn create_protein(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> String {
    let id = create_object!(
        state.doc, proteins,
        ProteinBuilder, "p", id
    );

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_proteins");
    update_event!(app_handle, "update_nav");
    
    id
}

#[tauri::command]
pub fn update_protein(
    state: State<Arc<EnzymeMLState>>,
    data: Protein,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, proteins, data, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, &id);
    update_event!(app_handle, "update_nav");

    Ok(())
}

#[tauri::command]
pub fn list_proteins(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.proteins
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

#[tauri::command]
pub fn get_protein(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Protein, String> {
    get_object!(state.doc, proteins, id, id)
}

#[tauri::command]
pub fn delete_protein(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, proteins, id, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_proteins");
    update_event!(app_handle, "update_nav");

    Ok(())
}
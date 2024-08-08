use std::sync::Arc;

use enzymeml_rs::enzyme_ml::{Vessel, VesselBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn create_vessel(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) {
    create_object!(
        state.doc, vessels,
        VesselBuilder, "v", id
    );

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_vessels", ())
        .expect("Failed to emit event");
}

#[tauri::command]
pub fn update_vessel(
    state: State<Arc<EnzymeMLState>>,
    data: Vessel,
    app_handle: AppHandle,
) -> Result<(), String> {
    update_object!(state.doc, vessels, data, id);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_vessels", ())
        .expect("Failed to emit event");

    Ok(())
}

#[tauri::command]
pub fn list_vessels(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.vessels
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

#[tauri::command]
pub fn get_vessel(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Vessel, String> { 
    get_object!(state.doc, vessels, id, id)
}

#[tauri::command]
pub fn delete_vessel(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, vessels, id, id);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_vessels", ())
        .expect("Failed to emit event");

    Ok(())
}
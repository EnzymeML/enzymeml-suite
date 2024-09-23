use enzymeml::prelude::{Parameter, ParameterBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

use crate::states::EnzymeMLState;
use crate::{delete_object, get_object, update_event, update_object};

#[tauri::command]
pub fn list_parameters(state: State<Arc<EnzymeMLState>>) -> Vec<String> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.parameters.iter().map(|s| s.id.clone()).collect()
}

#[tauri::command]
pub fn create_parameter(state: State<Arc<EnzymeMLState>>, name: String, app_handle: AppHandle) {
    let mut doc = state.doc.lock().unwrap();

    // Check if there is already a parameter with the same name
    if doc.parameters.iter().any(|p| p.id == name) {
        return;
    }

    // Create the parameter
    let parameter = ParameterBuilder::default()
        .name(name.clone())
        .id(name.clone())
        .symbol(name.clone())
        .build()
        .expect("Failed to build parameter");

    // Add the parameter to the document
    doc.parameters.push(parameter);

    // Notify the frontend
    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_parameters");
}

#[tauri::command]
pub fn get_parameter(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Parameter, String> {
    get_object!(state.doc, parameters, id, id)
}

#[tauri::command]
pub fn update_parameter(
    state: State<Arc<EnzymeMLState>>,
    data: Parameter,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id: String = update_object!(state.doc, parameters, data, id);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, &id);

    Ok(())
}

#[tauri::command]
pub fn delete_parameter(state: State<Arc<EnzymeMLState>>, id: &str, app_handle: AppHandle) {
    delete_object!(state.doc, parameters, id, id);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_document");
}

use std::sync::Arc;

use enzymeml::prelude::{Parameter, ParameterBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_event, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn list_parameters(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.parameters.iter().map(|s| (s.id.clone(), s.name.clone())).collect()
}

#[tauri::command]
pub fn create_parameter(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let id = create_object!(state.doc, parameters, ParameterBuilder, "q", id);

    // Notify the frontend
    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_parameters");

    Ok(id)
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
    
    // Check if the parameter exists
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

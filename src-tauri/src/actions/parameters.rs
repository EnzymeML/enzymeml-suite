use std::sync::Arc;

use enzymeml::prelude::{Parameter, ParameterBuilder};
use tauri::{AppHandle, Manager, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{create_object, delete_object, get_object, update_event, update_object};

/// Retrieves all parameters from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing the ID and name of each parameter
#[tauri::command]
pub fn list_parameters(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .parameters
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

/// Creates a new parameter in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing the ID of the created parameter or an error
#[tauri::command]
pub fn create_parameter(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let mut builder = ParameterBuilder::default();
    builder.name("New Parameter".to_string());
    builder.symbol("".to_string());

    let id = create_object!(state.doc, parameters, builder, "q", id);

    // Notify the frontend
    update_event!(app_handle, "update_parameters");

    Ok(id)
}

/// Retrieves a specific parameter by its ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the parameter to retrieve
///
/// # Returns
/// Result containing the parameter or an error if not found
#[tauri::command]
pub fn get_parameter(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Parameter, String> {
    get_object!(state.doc, parameters, id, id)
}

/// Updates an existing parameter in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `data` - The updated parameter data
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
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
pub fn partial_update_parameter(
    state: State<Arc<EnzymeMLState>>,
    pid: &str,
    key: &str,
    value: f64,
    app_handle: AppHandle,
) -> Result<(), String> {
    println!("Partial update parameter: {} {}", pid, key);
    let mut state = state.doc.lock().unwrap();
    let parameter = state.parameters.iter_mut().find(|p| p.id == pid).unwrap();
    match key {
        "value" => parameter.value = Some(value),
        "initial_value" => parameter.initial_value = Some(value),
        "upper_bound" => parameter.upper_bound = Some(value),
        "lower_bound" => parameter.lower_bound = Some(value),
        _ => return Err(format!("Invalid key: {}", key)),
    }

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, &pid);
    Ok(())
}

/// Deletes a parameter from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the parameter to delete
/// * `app_handle` - Handle to the Tauri application for event emission
#[tauri::command]
pub fn delete_parameter(state: State<Arc<EnzymeMLState>>, id: &str, app_handle: AppHandle) {
    delete_object!(state.doc, parameters, id, id);

    update_event!(app_handle, "update_parameters");
}

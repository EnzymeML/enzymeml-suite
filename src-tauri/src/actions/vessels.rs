use enzymeml::prelude::{Vessel, VesselBuilder};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::unit::UnitDefinitions;
use crate::{create_object, delete_object, get_object, update_event, update_object};

/// Creates a new vessel in the EnzymeML document
///
/// This function creates a new vessel using the VesselBuilder, assigns it a unique ID,
/// and adds it to the document's vessels collection. After creation, it emits an update
/// event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// The unique ID string of the newly created vessel
#[tauri::command]
pub fn create_vessel(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    let mut builder = VesselBuilder::default();
    builder.name("New Vessel".to_string());
    builder.volume(1.0);
    builder.unit(UnitDefinitions::get_unit("ml").unwrap());

    let id = create_object!(state.doc, vessels, builder, "v", id);

    update_event!(app_handle, "update_vessels");

    id
}

/// Updates an existing vessel in the EnzymeML document
///
/// This function replaces an existing vessel's data with the provided updated data.
/// The vessel is identified by its ID within the provided data object. After updating
/// the document, it emits an update event for the specific vessel to notify the frontend.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `data` - The updated vessel data containing the modifications to apply
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// Result indicating success with empty tuple or failure with error message string
#[tauri::command]
pub fn update_vessel(
    state: State<Arc<EnzymeMLState>>,
    data: Vessel,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, vessels, data, id);

    update_event!(app_handle, &id);

    Ok(())
}

/// Retrieves a list of all vessels in the EnzymeML document
///
/// This function returns a simplified list of all vessels containing only their
/// essential identifiers. Each vessel is represented as a tuple containing the
/// vessel's unique ID and its display name.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
///
/// # Returns
/// Vector of tuples where each tuple contains (vessel_id, vessel_name)
#[tauri::command]
pub fn list_vessels(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .vessels
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

/// Retrieves a specific vessel from the EnzymeML document
///
/// This function searches for and returns a complete vessel object by its unique ID.
/// The returned object contains all properties and data associated with the vessel,
/// including its name, volume, and other vessel properties.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `id` - The unique identifier string of the vessel to retrieve
///
/// # Returns
/// Result containing either the requested Vessel object or an error message if not found
#[tauri::command]
pub fn get_vessel(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Vessel, String> {
    get_object!(state.doc, vessels, id, id)
}

/// Deletes a vessel from the EnzymeML document
///
/// This function removes a vessel from the document's vessels collection by its unique ID.
/// After deletion, it emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `id` - The unique identifier string of the vessel to delete
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// Result indicating success with empty tuple or failure with error message string
#[tauri::command]
pub fn delete_vessel(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, vessels, id, id);

    update_event!(app_handle, "update_vessels");

    Ok(())
}

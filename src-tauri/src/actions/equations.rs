use std::sync::Arc;

use enzymeml_rs::enzyme_ml::Equation;
use tauri::{AppHandle, Manager, State};

use crate::{get_object, update_object};
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn update_equation(
    state: State<Arc<EnzymeMLState>>,
    data: Equation,
    app_handle: AppHandle,
) -> Result<(), String> {
    update_object!(state.doc, equations, data, species_id);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_equations", ())
        .expect("Failed to emit event");

    Ok(())
}

#[tauri::command]
pub fn get_equation(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Equation, String> {
    let id = id.to_string();
    get_object!(state.doc, equations, Some(id.clone()), species_id)
}
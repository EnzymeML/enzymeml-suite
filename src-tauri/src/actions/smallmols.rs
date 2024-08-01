use std::sync::{Arc, MutexGuard};

use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, SmallMolecule, SmallMoleculeBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_by_id, get_by_id, update_by_id};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn create_small_mol(
    state: State<Arc<EnzymeMLState>>,
    id: Option<&str>,
    app_handle: AppHandle,
) {
    create_object!(state.doc, small_molecules, SmallMoleculeBuilder, id);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_small_mols", ())
        .expect("Failed to emit event");
}

#[tauri::command]
pub fn update_small_mol(
    state: State<Arc<EnzymeMLState>>,
    data: SmallMolecule,
    app_handle: AppHandle,
) -> Result<(), String> {
    update_by_id!(state.doc, small_molecules, data);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_small_mols", ())
        .expect("Failed to emit event");

    Ok(())
}

#[tauri::command]
pub fn list_small_mols(state: State<Arc<EnzymeMLState>>) -> Vec<String> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc.small_molecules.iter().map(|s| s.id.clone()).collect()
}

#[tauri::command]
pub fn get_small_mol(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<SmallMolecule, String> {
    get_by_id!(state.doc, small_molecules, id)
}

#[tauri::command]
pub fn delete_small_mol(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    delete_by_id!(state.doc, small_molecules, id);

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");

    app_handle
        .emit_all("update_small_mols", ())
        .expect("Failed to emit event");

    Ok(())
}

fn get_id(id: Option<&str>, state_doc: &mut MutexGuard<EnzymeMLDocument>) -> String {
    match id {
        Some(id) => id.to_string(),
        None => {
            // Extract the existing small molecule IDs, given it exists
            let ids = state_doc
                .small_molecules
                .iter()
                .map(|s| s.id.clone())
                .collect();

            // Generate a new unique ID
            generate_id(&ids, "s")
        }
    }
}
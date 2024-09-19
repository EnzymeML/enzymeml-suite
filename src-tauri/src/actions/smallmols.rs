use std::sync::Arc;

use enzymeml_rs::enzyme_ml::{EquationBuilder, EquationType, SmallMolecule, SmallMoleculeBuilder};
use tauri::{AppHandle, Manager, State};

use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{create_object, delete_object, get_object, update_event, update_object};

#[tauri::command]
pub fn create_small_mol(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    // Create the object itself
    let id = create_object!(state.doc, small_molecules, SmallMoleculeBuilder, "s", id);

    let ode = EquationBuilder::default()
        .species_id(id.clone())
        .equation_type(EquationType::Ode)
        .build()
        .expect("Failed to build ODE");

    state.doc.lock().unwrap().equations.push(ode);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_small_mols");

    id
}

#[tauri::command]
pub fn update_small_mol(
    state: State<Arc<EnzymeMLState>>,
    data: SmallMolecule,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, small_molecules, data, id);

    update_event!(app_handle, &id);
    update_event!(app_handle, "update_nav");

    Ok(())
}

#[tauri::command]
pub fn list_small_mols(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .small_molecules
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

#[tauri::command]
pub fn get_small_mol(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<SmallMolecule, String> {
    get_object!(state.doc, small_molecules, id, id)
}

#[tauri::command]
pub fn delete_small_mol(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, small_molecules, id, id);

    // Delete the ODE for the small molecule
    let species_id = id.to_string();
    delete_object!(state.doc, equations, Some(species_id.clone()), species_id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_small_mols");

    Ok(())
}

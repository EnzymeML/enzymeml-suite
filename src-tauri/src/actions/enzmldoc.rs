use std::error::Error;
use std::sync::{Arc, MutexGuard};

use diesel::RunQueryDsl;
use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, EnzymeMLDocumentBuilder};
use tauri::{AppHandle, Manager, State};

use crate::db::establish_db_connection;
use crate::models::NewDocument;
use crate::schema::documents;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn set_title(
    state: State<Arc<EnzymeMLState>>,
    title: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut state_title = state.title.lock().unwrap();
    let mut state_doc = state.doc.lock().unwrap();

    state_doc.name = title.to_string();
    *state_title = title.to_string();

    app_handle
        .emit_all("update_document", ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn create_new_document(title: &str) -> Result<i32, Box<dyn Error>> {
    let mut connection = establish_db_connection();
    let doc = EnzymeMLDocumentBuilder::default().name(title).build()?;

    let content = serde_json::to_string_pretty(&doc)?;
    let new_document = NewDocument {
        title,
        content: content.as_str(),
    };

    let id: i32 = diesel::insert_into(documents::table)
        .values(&new_document)
        .returning(documents::id)
        .get_result(&mut connection)?;

    Ok(id)
}

#[tauri::command]
pub fn get_all_species_ids(state: State<Arc<EnzymeMLState>>) -> Vec<String> {
    let doc = state.doc.lock().unwrap();
    extract_species_ids(&doc)
}

pub fn extract_species_ids(doc: &MutexGuard<EnzymeMLDocument>) -> Vec<String> {
    doc.small_molecules
        .iter()
        .map(|s| s.id.clone())
        .chain(doc.proteins.iter().map(|s| s.id.clone()))
        .chain(doc.complexes.iter().map(|s| s.id.clone()))
        .collect()
}

#[tauri::command]
pub fn get_all_species(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    let doc = state.doc.lock().unwrap();
    get_all_species_ids_and_names(doc)
}

#[tauri::command]
pub fn get_species_name(
    state: State<Arc<EnzymeMLState>>,
    species_id: &str,
) -> Result<String, String> {
    let state_doc = state.doc.lock().unwrap();

    // Combine all species into one vector
    let all_species = get_all_species_ids_and_names(state_doc);

    // Find the species with the given ID
    let species = all_species.iter().find(|(id, _)| id == species_id);

    match species {
        Some((_, name)) => Ok(name.clone()),
        None => Err(format!("Species with ID {} not found", species_id)),
    }
}

fn get_all_species_ids_and_names(state_doc: MutexGuard<EnzymeMLDocument>) -> Vec<(String, String)> {
    let all_species = state_doc
        .small_molecules
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .chain(
            state_doc
                .proteins
                .iter()
                .map(|s| (s.id.clone(), s.name.clone())),
        )
        .chain(
            state_doc
                .complexes
                .iter()
                .map(|s| (s.id.clone(), s.name.clone())),
        )
        .collect::<Vec<(String, String)>>();
    all_species
}

#[tauri::command]
pub fn get_all_non_constant_species_ids(state: State<Arc<EnzymeMLState>>) -> Vec<String> {
    let state_doc = state.doc.lock().unwrap();
    state_doc
        .small_molecules
        .iter()
        .filter(|s| !s.constant)
        .map(|s| s.id.clone())
        .chain(
            state_doc
                .proteins
                .iter()
                .filter(|s| !s.constant)
                .map(|s| s.id.clone()),
        )
        .collect()
}

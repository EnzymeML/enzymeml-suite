use diesel::RunQueryDsl;
use enzymeml::prelude::{EnzymeMLDocument, EnzymeMLDocumentBuilder};
use std::error::Error;
use std::sync::{Arc, MutexGuard};
use tauri::{AppHandle, Emitter, State};

use crate::db::establish_db_connection;
use crate::models::NewDocument;
use crate::schema::documents;
use crate::states::EnzymeMLState;
use crate::{update_event, update_report};

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct Stats {
    pub small_molecules: usize,
    pub proteins: usize,
    pub reactions: usize,
    pub vessels: usize,
    pub measurements: usize,
}

/// Sets the title of the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `title` - The new title for the document
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
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
        .emit("update_document", ())
        .map_err(|e| e.to_string())?;

    update_report!(state, app_handle);

    Ok(())
}

/// Creates a new EnzymeML document and saves it to the database
///
/// # Arguments
/// * `title` - The title for the new document
///
/// # Returns
/// Result containing the database ID of the created document or an error
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

/// Creates a new EnzymeML document and replaces the current document in state
///
/// This function replaces the current EnzymeML document in the application state
/// with the provided document. It emits an update event to notify the frontend
/// of the document change.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `enzmldoc` - The new EnzymeML document to set as the current document
/// * `app_handle` - Handle to the Tauri application for event emission to the frontend
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn create_document(
    state: State<Arc<EnzymeMLState>>,
    enzmldoc: EnzymeMLDocument,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut state_doc = state.doc.lock().unwrap();
    *state_doc = enzmldoc;

    update_event!(app_handle, "update_document");
    update_report!(state, app_handle);

    Ok(())
}

/// Retrieves all species IDs from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of all species IDs (small molecules, proteins, and complexes)
#[tauri::command]
pub fn get_all_species_ids(state: State<Arc<EnzymeMLState>>) -> Vec<String> {
    let doc = state.doc.lock().unwrap();
    extract_species_ids(&doc)
}

/// Extracts species IDs from an EnzymeML document
///
/// # Arguments
/// * `doc` - Reference to the locked EnzymeML document
///
/// # Returns
/// Vector of all species IDs (small molecules, proteins, and complexes)
pub fn extract_species_ids(doc: &MutexGuard<EnzymeMLDocument>) -> Vec<String> {
    doc.small_molecules
        .iter()
        .map(|s| s.id.clone())
        .chain(doc.proteins.iter().map(|s| s.id.clone()))
        .chain(doc.complexes.iter().map(|s| s.id.clone()))
        .collect()
}

/// Retrieves all species with their IDs and names from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing the ID and name of each species
#[tauri::command]
pub fn get_all_species(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    let doc = state.doc.lock().unwrap();
    get_all_species_ids_and_names(doc)
}

/// Retrieves the name of a specific species by its ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `species_id` - The ID of the species to look up
///
/// # Returns
/// Result containing the species name or an error if not found
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

/// Helper function to extract all species IDs and names from an EnzymeML document
///
/// # Arguments
/// * `state_doc` - Reference to the locked EnzymeML document
///
/// # Returns
/// Vector of tuples containing the ID and name of each species
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

/// Retrieves all non-constant species IDs from the EnzymeML document
/// Non-constant species are those that can change concentration during simulation
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of non-constant species IDs (small molecules and proteins only)
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

/// Retrieves statistics about the current EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Stats struct containing counts of all entity types in the document
#[tauri::command]
pub fn get_stats(state: State<Arc<EnzymeMLState>>) -> Stats {
    let state_doc = state.doc.lock().unwrap();
    Stats {
        small_molecules: state_doc.small_molecules.len(),
        proteins: state_doc.proteins.len(),
        reactions: state_doc.reactions.len(),
        vessels: state_doc.vessels.len(),
        measurements: state_doc.measurements.len(),
    }
}

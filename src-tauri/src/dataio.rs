#![allow(clippy::needless_pass_by_value)]

use std::error::Error;
use std::path::PathBuf;
use std::sync::Arc;

use diesel::prelude::*;
use enzymeml_rs::enzyme_ml::EnzymeMLDocument;
use tauri::{AppHandle, Manager, State};
use tauri::api::dialog::blocking::FileDialogBuilder;

use crate::{models, update_event};
use crate::db::establish_connection;
use crate::docutils::{deserialize_doc, serialize_doc};
use crate::models::Document;
use crate::schema;
use crate::states::{EnzymeMLState, ExposedEnzymeMLState};

// State functions
#[tauri::command]
pub fn get_state(state: State<'_, Arc<EnzymeMLState>>) -> ExposedEnzymeMLState {
    ExposedEnzymeMLState::from(state.inner())
}

#[tauri::command]
pub async fn export_measurements(state: State<'_, Arc<EnzymeMLState>>) -> Result<PathBuf, String> {
    let dialog_result = FileDialogBuilder::new()
        .set_title("Save File")
        .set_file_name("measurements.xlsx")
        .save_file();

    match dialog_result {
        Some(path) => {
            let state_doc = state.doc.lock().unwrap();
            state_doc
                .to_excel(path.clone(), false)
                .expect("Failed to export to Excel");

            open::that(path.clone()).map_err(|err| err.to_string())?;
            Ok(path)
        }
        None => Err("No file selected".to_string()),
    }
}

#[tauri::command]
pub async fn import_excel_meas(
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<usize, String> {
    let dialog_result = FileDialogBuilder::new()
        .set_title("Open File")
        .add_filter("Excel Files", &["xlsx"])
        .pick_file();

    match dialog_result {
        Some(path) => {
            let mut state_doc = state.doc.lock().unwrap();
            let prev_amnt_meas = state_doc.measurements.len();
            state_doc
                .add_from_excel(path, true)
                .map_err(|err| err.to_string())?;

            update_event!(app_handle, "update_measurements");

            Ok(state_doc.measurements.len() - prev_amnt_meas)
        }
        None => Err("No file selected".to_string()),
    }
}

#[tauri::command]
pub async fn export_to_json(state: State<'_, Arc<EnzymeMLState>>) -> Result<PathBuf, String> {
    let dialog_result = FileDialogBuilder::new()
        .set_title("Save File")
        .set_file_name("enzmldoc_test.json")
        .save_file();

    match dialog_result {
        Some(path) => {
            let state_doc = state.doc.lock().unwrap();
            let json = serialize_doc(&state_doc).expect("Failed to serialize document");
            std::fs::write(&path, json).expect("Failed to write file");
            Ok(path)
        }
        None => Err("No file selected".to_string()),
    }
}

#[tauri::command]
pub fn new_document(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) {
    // Extract the guarded state values
    let mut state_doc = state.doc.lock().unwrap();
    let mut state_title = state.title.lock().unwrap();
    let mut state_id = state.id.lock().unwrap();

    // Create a new document
    *state_title = "New Document".to_string();
    *state_doc = EnzymeMLDocument::default();
    *state_id = None;

    // Notify the frontend
    app_handle
        .emit_all("update_document", ())
        .expect("Failed to emit event");
}

#[tauri::command]
pub fn save(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> Result<i32, String> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();
    let state_title = state.title.lock().unwrap();
    let mut state_id = state.id.lock().unwrap();

    if let Some(id) = *state_id {
        app_handle
            .emit_all("update_document", ())
            .expect("Failed to emit event");
        update_document(id, &state_doc).map_err(|err| err.to_string())
    } else {
        let id = insert_document(&state_title, &state_doc).map_err(|err| err.to_string())?;
        *state_id = Some(id);
        app_handle
            .emit_all("update_document", ())
            .expect("Failed to emit event");
        Ok(id)
    }
}

#[tauri::command]
pub fn load(id: i32, state: State<Arc<EnzymeMLState>>) -> Result<(), String> {
    // Extract the guarded state values
    let mut state_id = state.id.lock().unwrap();
    let mut state_doc = state.doc.lock().unwrap();
    let mut state_title = state.title.lock().unwrap();

    // Load the document
    let entry = retrieve_document_by_id(id).map_err(|err| err.to_string())?;
    let doc = deserialize_doc(entry.content.as_str()).map_err(|err| err.to_string())?;

    // Update the state
    *state_id = Some(entry.id);
    *state_title = entry.title;
    *state_doc = doc;

    Ok(())
}

#[tauri::command]
pub fn list_all_entries() -> Result<Vec<(String, i32)>, String> {
    // Retrieve all documents from the database
    let entries = retrieve_all_documents().map_err(|err| err.to_string())?;
    Ok(entries
        .iter()
        .map(|entry| (entry.title.clone(), entry.id))
        .collect())
}

// Non-state functions
fn insert_document(title: &str, enzmldoc: &EnzymeMLDocument) -> QueryResult<i32> {
    let mut connection = establish_connection();

    // Serialize document to JSON
    let json = serialize_doc(enzmldoc).expect("Failed to serialize document");
    let content = json.as_str();

    // Insert document into database
    diesel::insert_into(schema::documents::table)
        .values(&models::NewDocument { title, content })
        .returning(schema::documents::id)
        .get_result(&mut connection)
}

fn update_document(id: i32, enzmldoc: &EnzymeMLDocument) -> Result<i32, Box<dyn Error>> {
    let mut connection = establish_connection();

    // Retrieve the document from the database
    let entry = retrieve_document_by_id(id)?;

    // Serialize document to JSON
    let json = serialize_doc(enzmldoc).expect("Failed to serialize document");
    let content = json.as_str();

    diesel::update(&entry)
        .set(schema::documents::content.eq(content))
        .execute(&mut connection)?;

    Ok(entry.id)
}

pub fn retrieve_all_documents() -> QueryResult<Vec<Document>> {
    let mut connection = establish_connection();
    schema::documents::table.load::<Document>(&mut connection)
}

pub fn retrieve_document_by_id(id: i32) -> QueryResult<Document> {
    let mut connection = establish_connection();
    schema::documents::table
        .filter(schema::documents::id.eq(id))
        .first::<Document>(&mut connection)
}

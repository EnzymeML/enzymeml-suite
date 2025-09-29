#![allow(clippy::needless_pass_by_value)]

use diesel::prelude::*;
use enzymeml::prelude::EnzymeMLDocument;
use std::error::Error;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;

use crate::db::establish_connection;
use crate::docutils::{deserialize_doc, serialize_doc};
use crate::models::Document;
use crate::schema;
use crate::states::{EnzymeMLState, ExposedEnzymeMLState};
use crate::{models, update_event};

/// Functions for managing application state and document I/O operations

/// Gets the current application state
///
/// Retrieves the current state of the EnzymeML document for frontend consumption.
/// This function converts the internal state representation into a format that
/// can be safely exposed to the frontend interface.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// An exposed version of the EnzymeML state for frontend use
#[tauri::command]
pub fn get_state(state: State<'_, Arc<EnzymeMLState>>) -> ExposedEnzymeMLState {
    ExposedEnzymeMLState::from(state.inner())
}

/// Exports measurement data to an Excel file
///
/// Opens a file dialog allowing the user to choose where to save measurement data
/// as an Excel file. The exported file contains all measurement data from the current
/// EnzymeML document in a structured format. After successful export, the file is
/// automatically opened using the system's default Excel application.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Result containing either the saved file path or an error message
#[tauri::command]
pub async fn export_measurements(
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<PathBuf, String> {
    let dialog_result = app_handle
        .dialog()
        .file()
        .set_file_name("measurements.xlsx")
        .set_title("Export Measurements")
        .blocking_save_file();

    match dialog_result {
        Some(path) => {
            let state_doc = state.doc.lock().unwrap();
            let path = PathBuf::from(path.as_path().unwrap());
            state_doc
                .to_excel(&path, false, true)
                .expect("Failed to export to Excel");

            open::that(&path).map_err(|err| err.to_string())?;
            Ok(path)
        }
        None => Err("No file selected".to_string()),
    }
}

/// Imports measurement data from an Excel file
///
/// Opens a file dialog allowing the user to select an Excel file containing measurement
/// data to import into the current EnzymeML document. The function parses the Excel
/// file and adds all valid measurements to the document. After successful import,
/// an update event is emitted to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing either the number of imported measurements or an error message
#[tauri::command]
pub async fn import_excel_meas(
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<usize, String> {
    let dialog_result = app_handle
        .dialog()
        .file()
        .set_title("Import Measurements")
        .add_filter("Excel Files", &["xlsx"])
        .blocking_pick_file();

    match dialog_result {
        Some(path) => {
            let mut state_doc = state.doc.lock().unwrap();
            let prev_amnt_meas = state_doc.measurements.len();
            let path = PathBuf::from(path.as_path().unwrap());
            state_doc
                .add_from_excel(path, true)
                .map_err(|err| err.to_string())?;

            update_event!(app_handle, "update_measurements");

            Ok(state_doc.measurements.len() - prev_amnt_meas)
        }
        None => Err("No file selected".to_string()),
    }
}

/// Exports the EnzymeML document to a JSON file
///
/// Opens a file dialog allowing the user to save the current EnzymeML document as
/// a JSON file. The entire document structure including all measurements, vessels,
/// species, and other data is serialized into a human-readable JSON format that
/// can be stored, shared, or imported later.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Result containing either the saved file path or an error message
#[tauri::command]
pub async fn export_to_json(
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<PathBuf, String> {
    let title = {
        let state_doc = state.doc.lock().unwrap();
        state_doc.name.clone().replace(" ", "_").to_lowercase()
    };

    let dialog_result = app_handle
        .dialog()
        .file()
        .set_title("Save Document")
        .set_file_name(format!("{}.json", title))
        .blocking_save_file();

    match dialog_result {
        Some(path) => {
            let state_doc = state.doc.lock().unwrap();
            let json = serialize_doc(&state_doc).expect("Failed to serialize document");
            let path = PathBuf::from(path.as_path().unwrap());
            std::fs::write(&path, json).expect("Failed to write file");
            Ok(path)
        }
        None => Err("No file selected".to_string()),
    }
}

/// Loads an EnzymeML document from a JSON file
///
/// Opens a file dialog allowing the user to select and load a previously saved
/// EnzymeML document from a JSON file. The loaded document completely replaces
/// the current document in memory. After successful loading, an update event
/// is emitted to refresh the entire frontend interface.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub async fn load_json(
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let dialog_result = app_handle
        .dialog()
        .file()
        .set_title("Open EnzymeML Document")
        .add_filter("EnzymeML Files", &["json"])
        .blocking_pick_file();

    match dialog_result {
        Some(path) => {
            let mut state_doc = state.doc.lock().unwrap();
            let path = PathBuf::from(path.as_path().unwrap());
            let json = std::fs::read_to_string(path).map_err(|err| err.to_string())?;
            let doc = deserialize_doc(json.as_str()).map_err(|err| err.to_string())?;
            *state_doc = doc;

            update_event!(app_handle, "update_document");

            Ok(())
        }
        None => Err("No file selected".to_string()),
    }
}

/// Loads a JSON document from a specific file path (for drag and drop)
///
/// Loads an EnzymeML document from a specified file path without opening a file dialog.
/// This function is designed for drag-and-drop functionality where the file path
/// is already known. The document content is read, deserialized, and loaded into
/// the application state. An update event is emitted to refresh the frontend.
///
/// # Arguments
/// * `file_path` - The path to the JSON file to load
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub async fn load_json_from_path(
    file_path: String,
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let path = PathBuf::from(&file_path);

    // Validate file extension
    if let Some(extension) = path.extension() {
        if extension != "json" {
            return Err("Only JSON files are supported for EnzymeML documents".to_string());
        }
    } else {
        return Err("File must have a .json extension".to_string());
    }

    // Read and parse the file
    let json = std::fs::read_to_string(&path)
        .map_err(|err| format!("Failed to read file {}: {}", file_path, err))?;

    let doc = deserialize_doc(json.as_str())
        .map_err(|err| format!("Failed to parse EnzymeML document: {}", err))?;

    // Update the state
    let mut state_doc = state.doc.lock().unwrap();
    *state_doc = doc;

    // Notify the frontend
    update_event!(app_handle, "update_document");

    Ok(())
}

/// Imports measurements from an Excel file at a specific path (for drag and drop)
///
/// Imports measurement data from an Excel file at a specified path without opening
/// a file dialog. This function is designed for drag-and-drop functionality.
/// The measurements are added to the current EnzymeML document.
///
/// # Arguments
/// * `file_path` - The path to the Excel file to import
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing either the number of imported measurements or an error message
#[tauri::command]
pub async fn import_excel_from_path(
    file_path: String,
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<usize, String> {
    let path = PathBuf::from(&file_path);

    // Validate file extension
    if let Some(extension) = path.extension() {
        if extension != "xlsx" {
            return Err(
                "Only Excel files (.xlsx) are supported for measurement imports".to_string(),
            );
        }
    } else {
        return Err("File must have a .xlsx extension".to_string());
    }

    let mut state_doc = state.doc.lock().unwrap();
    let prev_amnt_meas = state_doc.measurements.len();

    state_doc
        .add_from_excel(path, true)
        .map_err(|err| format!("Failed to import Excel file: {}", err))?;

    update_event!(app_handle, "update_measurements");

    Ok(state_doc.measurements.len() - prev_amnt_meas)
}

/// Handles file drop events by processing dropped files
///
/// Processes files dropped into the application window. Supports JSON files (EnzymeML documents)
/// and Excel files (.xlsx for measurement data). The function validates file extensions,
/// loads the appropriate content, and emits notifications about the results.
///
/// # Arguments
/// * `file_paths` - Array of file paths that were dropped
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing a summary of the processing results
#[tauri::command]
pub async fn handle_file_drop(
    file_paths: Vec<String>,
    state: State<'_, Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<String, String> {
    if file_paths.is_empty() {
        return Err("No files provided".to_string());
    }

    let mut results = Vec::new();

    for file_path in file_paths {
        let path = std::path::Path::new(&file_path);

        // Get file extension
        let extension = path
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_lowercase());

        match extension.as_deref() {
            Some("json") => {
                match load_json_from_path(file_path.clone(), state.clone(), app_handle.clone())
                    .await
                {
                    Ok(()) => {
                        let file_name = path
                            .file_name()
                            .and_then(|name| name.to_str())
                            .unwrap_or("Unknown");
                        results.push(format!("✅ Loaded EnzymeML document: {}", file_name));

                        // Emit navigation event to go to home
                        app_handle.emit("navigate_to", "/").ok();
                    }
                    Err(e) => {
                        results.push(format!("❌ Failed to load {}: {}", file_path, e));
                    }
                }
            }
            Some("xlsx") => {
                match import_excel_from_path(file_path.clone(), state.clone(), app_handle.clone())
                    .await
                {
                    Ok(count) => {
                        let file_name = path
                            .file_name()
                            .and_then(|name| name.to_str())
                            .unwrap_or("Unknown");
                        results.push(format!(
                            "✅ Imported {} measurements from: {}",
                            count, file_name
                        ));

                        // Emit navigation event to go to measurements
                        app_handle.emit("navigate_to", "/measurements").ok();
                    }
                    Err(e) => {
                        results.push(format!("❌ Failed to import {}: {}", file_path, e));
                    }
                }
            }
            _ => {
                results.push(format!(
                    "❌ Unsupported file type: {} (only .json and .xlsx files are supported)",
                    file_path
                ));
            }
        }
    }

    Ok(results.join("\n"))
}

/// Creates a new empty EnzymeML document
///
/// Initializes a fresh, empty EnzymeML document in the application state, replacing
/// any existing document. The new document is given a default title and contains
/// no experimental data. The document ID is reset to None, indicating it hasn't
/// been saved to the database yet. An update event is emitted to refresh the frontend.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
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
        .emit("update_document", ())
        .expect("Failed to emit event");
}

/// Saves the current EnzymeML document to the database
///
/// Persists the current document to the local database. If the document already
/// has an ID (was previously saved), it updates the existing record. If it's a
/// new document, it creates a new database entry and assigns an ID. After saving,
/// an update event is emitted to refresh the frontend interface.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing either the document ID or an error message
#[tauri::command]
pub fn save(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> Result<i32, String> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();
    let state_title = state.title.lock().unwrap();
    let mut state_id = state.id.lock().unwrap();

    if let Some(id) = *state_id {
        app_handle
            .emit("update_document", ())
            .expect("Failed to emit event");
        update_document(id, &state_doc).map_err(|err| err.to_string())
    } else {
        let id = insert_document(&state_title, &state_doc).map_err(|err| err.to_string())?;
        *state_id = Some(id);
        app_handle
            .emit("update_document", ())
            .expect("Failed to emit event");
        Ok(id)
    }
}

/// Loads an EnzymeML document from the database
///
/// Retrieves a previously saved document from the local database using its ID
/// and loads it into the application state. This replaces any currently loaded
/// document with the retrieved one, updating the document title and ID accordingly.
///
/// # Arguments
/// * `id` - The ID of the document to load
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn load(
    id: i32,
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
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

    app_handle
        .emit("update_document", ())
        .expect("Failed to emit event");

    Ok(())
}

/// Lists all EnzymeML documents in the database
///
/// Retrieves a list of all documents stored in the local database, returning
/// their titles and IDs. This is used to populate document selection interfaces
/// in the frontend, allowing users to see and choose from their saved documents.
///
/// # Returns
/// Result containing either a vector of (title, id) tuples or an error message
#[tauri::command]
pub fn list_all_entries() -> Result<Vec<(String, i32)>, String> {
    // Retrieve all documents from the database
    let entries = retrieve_all_documents().map_err(|err| err.to_string())?;
    Ok(entries
        .iter()
        .map(|entry| (entry.title.clone(), entry.id))
        .collect())
}

/// Inserts a new document into the database
///
/// Creates a new database record for an EnzymeML document. The document is
/// serialized to JSON format before being stored. Returns the auto-generated
/// ID of the newly created database record.
///
/// # Arguments
/// * `title` - The title of the document
/// * `enzmldoc` - The EnzymeML document to insert
///
/// # Returns
/// QueryResult containing either the inserted document ID or an error
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

/// Updates an existing document in the database
///
/// Modifies an existing database record with new document content. The document
/// is first serialized to JSON format, then the database record is updated with
/// the new content while preserving the original title and ID.
///
/// # Arguments
/// * `id` - The ID of the document to update
/// * `enzmldoc` - The updated EnzymeML document
///
/// # Returns
/// Result containing either the updated document ID or an error
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

/// Retrieves all documents from the database
///
/// Fetches all EnzymeML document records from the database, including their
/// titles, IDs, and content. This function is used internally by other functions
/// that need to access or list multiple documents.
///
/// # Returns
/// QueryResult containing either a vector of Documents or an error
pub fn retrieve_all_documents() -> QueryResult<Vec<Document>> {
    let mut connection = establish_connection();
    schema::documents::table.load::<Document>(&mut connection)
}

/// Retrieves a specific document from the database by ID
///
/// Fetches a single EnzymeML document record from the database using its unique
/// ID. This is used when loading a specific document into the application or
/// when updating an existing document.
///
/// # Arguments
/// * `id` - The ID of the document to retrieve
///
/// # Returns
/// QueryResult containing either the requested Document or an error
pub fn retrieve_document_by_id(id: i32) -> QueryResult<Document> {
    let mut connection = establish_connection();
    schema::documents::table
        .filter(schema::documents::id.eq(id))
        .first::<Document>(&mut connection)
}

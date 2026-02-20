use enzymeml::prelude::EnzymeMLDocument;
use notebookx::NotebookFormat;
use rocket::http::{ContentType, Status};
use rocket::serde::json::Json;
use rocket::{get, put, routes, Build, Rocket, State};
use rocket_cors::AllowedOrigins;
use serde::{Serialize, Serializer};
use serde_json::Value;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

use crate::actions::jupyter::{JupyterTemplate, JUPYTER_TEMPLATES, JUPYTER_TEMPLATE_METADATA};
use crate::docutils::deserialize_doc;
use crate::io::dataio::{retrieve_all_documents, retrieve_document_by_id};
use crate::states::EnzymeMLState;

/// Creates and configures a Rocket web server instance
///
/// Sets up a Rocket server with CORS enabled for localhost connections, configured
/// to run on port 13452. The server is initialized with application state and routes
/// for document management operations.
///
/// # Arguments
/// * `state` - Shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application
///
/// # Returns
/// A configured Rocket build instance ready to launch
pub fn create_rocket(state: Arc<EnzymeMLState>, app_handle: Arc<AppHandle>) -> Rocket<Build> {
    // Configure CORS
    let allowed_origins = AllowedOrigins::some_regex(&["http://localhost:.*"]);
    let cors = rocket_cors::CorsOptions::default()
        .allowed_origins(allowed_origins)
        .to_cors()
        .expect("Error creating CORS");

    let figment = rocket::Config::figment()
        .merge(("port", 13452))
        .merge(("address", "127.0.0.1"));

    rocket::custom(figment)
        .attach(cors)
        .manage(state)
        .manage(app_handle)
        .mount(
            "/",
            routes![
                get_docs,
                get_current_doc,
                get_doc_by_id,
                update_document,
                get_jupyter_templates,
                get_jupyter_template
            ],
        )
}

/// Standard API response structure
///
/// Provides a consistent response format for all API endpoints, including
/// status code, optional data payload, and optional error messages.
#[derive(serde::Serialize)]
struct APIResponse {
    status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<ResponseTypes>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

/// Enumeration of possible response data types
///
/// Allows the API to return different types of data while maintaining
/// a consistent response structure across all endpoints.
enum ResponseTypes {
    Document(EnzymeMLDocResponse),
    Generic(Value),
}

impl Serialize for ResponseTypes {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            ResponseTypes::Document(doc) => doc.serialize(serializer),
            ResponseTypes::Generic(value) => value.serialize(serializer),
        }
    }
}

/// Response structure for EnzymeML document data
///
/// Contains the document title, serialized content, and optional database ID
/// for transmission to API clients.
#[derive(serde::Serialize)]
struct EnzymeMLDocResponse {
    title: String,
    content: Value,
    id: Option<i32>,
}

impl EnzymeMLDocResponse {
    /// Creates a new EnzymeML document response
    ///
    /// Constructs a response object with the document title, serialized content,
    /// and optional database ID for API transmission.
    ///
    /// # Arguments
    /// * `title` - The document title
    /// * `content` - The EnzymeML document to serialize
    /// * `id` - Optional database ID of the document
    ///
    /// # Returns
    /// A new EnzymeMLDocResponse instance
    fn new(title: String, content: &EnzymeMLDocument, id: Option<i32>) -> Self {
        EnzymeMLDocResponse {
            title,
            content: serde_json::to_value(content).unwrap(),
            id,
        }
    }
}

/// Retrieves all documents from the database
///
/// Returns a list of all available EnzymeML documents with their IDs and titles.
/// This endpoint provides an overview of all stored documents without their full content.
#[get("/docs")]
fn get_docs() -> (Status, (ContentType, String)) {
    let entries = retrieve_all_documents();

    match entries {
        Ok(entries) => {
            let data = entries
                .iter()
                .map(|doc| {
                    serde_json::json!({
                        "id": doc.id,
                        "title": doc.title,
                    })
                })
                .collect::<Vec<Value>>();

            let response = APIResponse {
                status: Status::Ok,
                data: ResponseTypes::Generic(serde_json::to_value(data).unwrap()).into(),
                message: None,
            };

            (
                Status::Ok,
                (ContentType::JSON, serde_json::to_string(&response).unwrap()),
            )
        }
        Err(e) => {
            let response = APIResponse {
                status: Status::InternalServerError,
                data: None,
                message: Some(e.to_string()),
            };

            (
                Status::InternalServerError,
                (ContentType::JSON, serde_json::to_string(&response).unwrap()),
            )
        }
    }
}

/// Retrieves the currently loaded document from application state
///
/// Returns the EnzymeML document that is currently loaded in the application's
/// memory state, including its title, content, and database ID if available.
#[get("/docs/:current")]
fn get_current_doc(state: &State<Arc<EnzymeMLState>>) -> (Status, (ContentType, String)) {
    let state_doc = state.doc.lock().unwrap();
    let state_title = state.title.lock().unwrap();
    let state_id = state.id.lock().unwrap();

    let data = EnzymeMLDocResponse::new(state_title.clone(), &state_doc, *state_id);
    let response = APIResponse {
        status: Status::Ok,
        data: ResponseTypes::Document(data).into(),
        message: None,
    };

    (
        Status::Ok,
        (ContentType::JSON, serde_json::to_string(&response).unwrap()),
    )
}

/// Retrieves a specific document by its database ID
///
/// Fetches and deserializes a specific EnzymeML document from the database
/// using its unique identifier, returning the complete document data.
///
/// # Arguments
/// * `id` - The database ID of the document to retrieve
#[get("/docs/<id>")]
fn get_doc_by_id(id: i32) -> (Status, (ContentType, String)) {
    let doc = retrieve_document_by_id(id);

    match doc {
        Ok(doc) => {
            let enzmldoc = deserialize_doc(doc.content.as_str()).unwrap();
            let data = EnzymeMLDocResponse::new(doc.title, &enzmldoc, Some(doc.id));
            let response = APIResponse {
                status: Status::Ok,
                data: ResponseTypes::Document(data).into(),
                message: None,
            };

            (
                Status::Ok,
                (ContentType::JSON, serde_json::to_string(&response).unwrap()),
            )
        }
        Err(e) => {
            let response = APIResponse {
                status: Status::NotFound,
                data: None,
                message: Some(e.to_string()),
            };

            (
                Status::NotFound,
                (ContentType::JSON, serde_json::to_string(&response).unwrap()),
            )
        }
    }
}

/// Updates the currently loaded document in application state
///
/// Replaces the current document in memory with the provided EnzymeML document
/// and signals the change to the frontend application via Tauri events.
///
/// # Arguments
/// * `enzmldoc` - The new EnzymeML document data in JSON format
/// * `state` - The shared application state to update
/// * `app_handle` - Handle for emitting events to the frontend
#[put("/docs/:current", format = "application/json", data = "<enzmldoc>")]
pub fn update_document(
    enzmldoc: Json<EnzymeMLDocument>,
    state: &State<Arc<EnzymeMLState>>,
    app_handle: &State<Arc<AppHandle>>,
) -> (Status, (ContentType, String)) {
    let mut state_doc = state.doc.lock().unwrap();
    let app_handle = app_handle.app_handle();
    let enzmldoc = enzmldoc.into_inner();

    // Perform the update
    *state_doc = enzmldoc;

    // Communicate the change to the Tauri app
    if let Some(value) = signal_change_to_frontend(app_handle) {
        return value;
    }

    // If the update was successful, return a success response
    let response = APIResponse {
        status: Status::Ok,
        data: None,
        message: "Updated document.".to_string().into(),
    };

    (
        Status::Ok,
        (ContentType::JSON, serde_json::to_string(&response).unwrap()),
    )
}

/// Signals document changes to the frontend application
///
/// Emits an update event to notify the Tauri frontend that the document
/// has been modified. Returns an error response if the event emission fails.
///
/// # Arguments
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Optional error response if event emission fails, None on success
fn signal_change_to_frontend(app_handle: &AppHandle) -> Option<(Status, (ContentType, String))> {
    match app_handle.emit("update_document", true) {
        Ok(_) => {}
        Err(e) => {
            let response = APIResponse {
                status: Status::InternalServerError,
                data: None,
                message: Some(e.to_string()),
            };

            return Some((
                Status::InternalServerError,
                (ContentType::JSON, serde_json::to_string(&response).unwrap()),
            ));
        }
    }
    None
}

/// Retrieves all available Jupyter notebook templates
///
/// Returns a JSON array containing metadata for all available Jupyter notebook
/// templates. Each template includes information such as name, description,
/// and other relevant metadata for client-side display.
///
/// # Returns
/// JSON response containing a vector of JupyterTemplate metadata
#[get("/jupyter/templates")]
fn get_jupyter_templates() -> Json<Vec<JupyterTemplate>> {
    let metadata = JUPYTER_TEMPLATE_METADATA.to_vec();
    Json(metadata)
}

/// Retrieves a specific Jupyter notebook template by name
///
/// Fetches the specified template from the template registry, parses it as
/// an IPython notebook, and converts it to percent script format for easier
/// integration with external tools and editors.
///
/// # Arguments
/// * `template_name` - The name identifier of the template to retrieve
///
/// # Returns
/// * `Ok((Status, (ContentType, String)))` - Success response with the template
///   content as a percent-formatted script
/// * `Err(String)` - Error message if template not found or parsing fails
///
/// # Errors
/// * Template not found in the registry
/// * Failed to parse the notebook format
/// * Failed to serialize to percent format
#[get("/jupyter/templates/<template_id>")]
fn get_jupyter_template(template_id: &str) -> Result<(Status, (ContentType, String)), String> {
    let metadata = JUPYTER_TEMPLATE_METADATA
        .iter()
        .find(|t| t.id == template_id)
        .ok_or(format!("Template {template_id} not found"))?;
    let template = JUPYTER_TEMPLATES
        .get(metadata.template_path.as_str())
        .ok_or(format!("Template {} not found", metadata.name))?;

    let notebook = NotebookFormat::Ipynb
        .parse(template)
        .map_err(|e| format!("Failed to parse notebook: {e}"))?;

    let script = NotebookFormat::Percent
        .serialize(&notebook)
        .map_err(|e| format!("Failed to serialize notebook: {e}"))?;

    Ok((Status::Ok, (ContentType::Text, script)))
}

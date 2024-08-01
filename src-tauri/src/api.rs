use std::sync::Arc;

use enzymeml_rs::enzyme_ml::EnzymeMLDocument;
use rocket::{Build, get, put, Rocket, routes, State};
use rocket::http::{ContentType, Status};
use rocket::serde::json::Json;
use rocket_cors::AllowedOrigins;
use serde::{Serialize, Serializer};
use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::dataio::{retrieve_all_documents, retrieve_document_by_id};
use crate::docutils::deserialize_doc;
use crate::states::EnzymeMLState;

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
            routes![get_docs, get_current_doc, get_doc_by_id, update_document],
        )
}

#[derive(serde::Serialize)]
struct APIResponse {
    status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<ResponseTypes>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

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

#[derive(serde::Serialize)]
struct EnzymeMLDocResponse {
    title: String,
    content: Value,
    id: Option<i32>,
}

impl EnzymeMLDocResponse {
    fn new(title: String, content: &EnzymeMLDocument, id: Option<i32>) -> Self {
        EnzymeMLDocResponse {
            title,
            content: serde_json::to_value(content).unwrap(),
            id,
        }
    }
}

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
    if let Some(value) = signal_change_to_frontend(&app_handle) {
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

fn signal_change_to_frontend(app_handle: &AppHandle) -> Option<(Status, (ContentType, String))> {
    match app_handle.emit_all("update_document", true) {
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

use std::sync::{Arc, Mutex};

use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, EnzymeMLDocumentBuilder};
use enzymeml_rs::prelude::Parameter;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct EnzymeMLState {
    pub title: Mutex<String>,
    pub doc: Mutex<EnzymeMLDocument>,
    pub id: Mutex<Option<i32>>,
    pub param_buffer: Mutex<Vec<Parameter>>,
}

impl Default for EnzymeMLState {
    fn default() -> Self {
        EnzymeMLState {
            title: Mutex::new("New Document".to_string()),
            doc: Mutex::new(
                EnzymeMLDocumentBuilder::default()
                    .name("New document")
                    .build()
                    .unwrap(),
            ),
            id: Mutex::new(None),
            param_buffer: Mutex::new(Vec::new()),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ExposedEnzymeMLState {
    pub title: String,
    pub doc: EnzymeMLDocument,
    pub id: Option<i32>,
}

impl From<&Arc<EnzymeMLState>> for ExposedEnzymeMLState {
    fn from(state: &Arc<EnzymeMLState>) -> Self {
        let title = state.title.lock().unwrap();
        let doc = state.doc.lock().unwrap();
        let id = state.id.lock().unwrap();

        ExposedEnzymeMLState {
            title: title.clone(),
            doc: doc.clone(),
            id: *id,
        }
    }
}

impl EnzymeMLState {
    pub fn testing() -> Self {
        let enzmldoc: EnzymeMLDocument = serde_json::from_str(include_str!("../enzymeml.json")).unwrap();
        EnzymeMLState {
            title: Mutex::new("Test Document".to_string()),
            doc: Mutex::new(enzmldoc),
            id: Mutex::new(None),
            param_buffer: Mutex::new(Vec::new()),
        }
    }
}
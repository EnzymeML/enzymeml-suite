use std::sync::{Arc, Mutex};

use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, EnzymeMLDocumentBuilder};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct EnzymeMLState {
    pub title: Mutex<String>,
    pub doc: Mutex<EnzymeMLDocument>,
    pub id: Mutex<Option<i32>>,
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

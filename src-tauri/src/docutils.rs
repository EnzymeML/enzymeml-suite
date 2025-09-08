use enzymeml::prelude::EnzymeMLDocument;
use serde_json::Error;

pub fn deserialize_doc(json: &str) -> Result<EnzymeMLDocument, Error> {
    serde_json::from_str(json)
}

pub fn serialize_doc(document: &EnzymeMLDocument) -> Result<String, String> {
    serde_json::to_string_pretty(document).map_err(|err| err.to_string())
}

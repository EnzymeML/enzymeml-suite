use std::error::Error;

use diesel::RunQueryDsl;
use enzymeml_rs::enzyme_ml::EnzymeMLDocumentBuilder;

use crate::db::establish_db_connection;
use crate::models::NewDocument;
use crate::schema::documents;

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

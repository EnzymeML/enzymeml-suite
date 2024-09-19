use super::schema::documents;
use diesel::prelude::*;

#[derive(Queryable, Identifiable, AsChangeset, Selectable, Debug)]
#[diesel(table_name = documents)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Document {
    pub id: i32,
    pub title: String,
    pub content: String,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = documents)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct NewDocument<'a> {
    pub title: &'a str,
    pub content: &'a str,
}

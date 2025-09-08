use diesel::deserialize::{self, FromSql};
use diesel::serialize::{self, IsNull, Output, ToSql};
use diesel::sql_types::Text;
use diesel::sqlite::{Sqlite, SqliteValue};
use serde::{Deserialize, Serialize};

/// A wrapper type for storing arrays of strings in SQLite
///
/// This type allows storing Vec<String> in SQLite by serializing/deserializing to JSON.
/// It implements the necessary Diesel traits for database operations.
#[derive(Debug, Serialize, Deserialize)]
pub struct StringArray(pub Vec<String>);

/// Internal wrapper to allow using StringArray with Diesel's SQL type system
///
/// This wrapper implements the necessary traits to use StringArray as a Text column.
#[derive(Debug, diesel::expression::AsExpression, diesel::deserialize::FromSqlRow)]
#[diesel(sql_type = Text)]
pub struct StringArrayWrapper(pub StringArray);

impl ToSql<Text, Sqlite> for StringArray {
    /// Converts the StringArray to SQL by serializing to JSON
    ///
    /// Serializes the internal Vec<String> to a JSON string representation
    /// that can be stored in a SQLite TEXT column. The serialization process
    /// converts the vector to a JSON array format.
    ///
    /// # Arguments
    /// * `out` - Output buffer to write the SQL value to
    ///
    /// # Returns
    /// Result indicating success or serialization error
    fn to_sql(&self, out: &mut Output<Sqlite>) -> serialize::Result {
        let json = serde_json::to_string(&self.0)
            .map_err(|err| Box::new(err) as Box<dyn std::error::Error + Send + Sync>)?;
        out.set_value(json);
        Ok(IsNull::No)
    }
}

impl FromSql<Text, Sqlite> for StringArray {
    /// Converts from SQL by deserializing from JSON
    ///
    /// Deserializes a JSON string from SQLite back into a Vec<String> representation.
    /// The JSON string is expected to be in array format and contain only string values.
    /// This allows reconstruction of the original string vector from the database.
    ///
    /// # Arguments
    /// * `bytes` - Raw bytes from SQLite containing the JSON string
    ///
    /// # Returns
    /// Result containing the deserialized StringArray or error
    fn from_sql(bytes: SqliteValue<'_, '_, '_>) -> deserialize::Result<Self> {
        let text = <String as FromSql<Text, Sqlite>>::from_sql(bytes)?;
        let vec = serde_json::from_str(&text)
            .map_err(|err| Box::new(err) as Box<dyn std::error::Error + Send + Sync>)?;
        Ok(StringArray(vec))
    }
}

//! Macros for database operations
//!
//! This module contains macros for filtering and getting rows from the database.
//! The macros are used to simplify common database operations and reduce code duplication.

/// Filters a database table by a given column value using LIKE pattern matching
///
/// This macro performs a database query to filter rows from the specified table
/// where the given column contains the provided value. The filtering uses SQL LIKE
/// pattern matching with wildcards on both sides of the search term.
///
/// # Arguments
/// * `$table` - The database table to filter
/// * `$type` - The type to deserialize the filtered rows into
/// * `$id_prop` - The column expression to filter by
/// * `$id` - The value to search for within the column
///
/// # Returns
/// Result containing a vector of filtered rows or an error string
#[macro_export]
macro_rules! filter_table {
    ($table:ident, $type:ty, $id_prop:expr, $id:expr) => {{
        let mut connection = establish_db_connection();
        $table::table
            .filter($id_prop.like(format!("%{}%", $id)))
            .load::<$type>(&mut connection)
            .map_err(|e| e.to_string())
    }};
}

/// Gets a single row from a database table by its primary key
///
/// This macro performs a database query to retrieve a specific row from the
/// specified table using the primary key value. The query uses Diesel's find
/// method which is optimized for primary key lookups.
///
/// # Arguments
/// * `$table` - The database table to query
/// * `$type` - The type to deserialize the row into
/// * `$id` - The primary key value to search for
///
/// # Returns
/// Result containing the found row or an error string
#[macro_export]
macro_rules! get_row {
    ($table:ident, $type:ty, $id:expr) => {{
        let mut connection = establish_db_connection();
        $table::table
            .find($id)
            .first::<$type>(&mut connection)
            .map_err(|e| e.to_string())
    }};
}

/// Gets all rows from a database table
///
/// This macro performs a database query to retrieve all rows from the specified
/// table without any filtering. It loads the entire table contents into a vector
/// of the specified type.
///
/// # Arguments
/// * `$table` - The database table to query
/// * `$type` - The type to deserialize the rows into
///
/// # Returns
/// Result containing a vector of all rows or an error string
#[macro_export]
macro_rules! get_rows {
    ($table:ident, $type:ty) => {{
        let mut connection = establish_db_connection();
        $table::table
            .load::<$type>(&mut connection)
            .map_err(|e| e.to_string())
    }};
}

/// Inserts or updates a row in a database table using upsert logic
///
/// This macro performs an upsert operation (insert or update) on the specified
/// table. If a row with the same value in the specified column already exists,
/// it updates that row; otherwise, it inserts a new row. The data is first
/// converted to the appropriate new type before being inserted.
///
/// # Arguments
/// * `$table` - The database table to insert/update into
/// * `$newtype` - The type to convert the data into before insertion
/// * `$col` - The column name to use for conflict resolution
/// * `$data` - The data to insert or update
///
/// # Returns
/// Result containing the number of affected rows or an error string
#[macro_export]
macro_rules! upsert_row {
    ($table:ident, $newtype:ty, $col:ident, $data:expr) => {{
        let mut connection = establish_db_connection();
        let new_row = <$newtype>::from(&$data);

        diesel::insert_into($table::table)
            .values(&new_row)
            .on_conflict($table::$col)
            .do_update()
            .set(&new_row)
            .execute(&mut connection)
            .map_err(|e| e.to_string())
    }};
}

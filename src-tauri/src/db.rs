//! Database management module for the EnzymeML application
//!
//! This module handles all database operations including initialization,
//! connection management, and migrations. It uses SQLite as the database
//! backend and diesel for ORM functionality.

use std::fs;
use std::path::Path;

use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

/// Initializes the database by creating the database file if it doesn't exist
/// and running any pending migrations.
///
/// This function should be called when the application starts to ensure
/// the database is properly set up.
///
/// # Panics
/// * If the database file cannot be created
/// * If the database directory cannot be created
/// * If migrations fail to run
pub fn init() {
    if !db_file_exists() {
        create_db_file();
    }
    create_db_file();

    run_migrations();
}

/// Establishes a connection to the SQLite database.
///
/// # Returns
/// * `SqliteConnection` - A connection to the database
///
/// # Panics
/// * If the connection cannot be established
pub fn establish_db_connection() -> SqliteConnection {
    let db_path = get_db_path().clone();

    SqliteConnection::establish(db_path.as_str())
        .unwrap_or_else(|_| panic!("Error connecting to {}", db_path))
}

/// Runs any pending database migrations.
///
/// This function applies any new migrations that haven't been run yet
/// to keep the database schema up to date.
///
/// # Panics
/// * If the database connection cannot be established
/// * If migrations fail to execute
fn run_migrations() {
    let mut connection = establish_connection();
    connection.run_pending_migrations(MIGRATIONS).unwrap();
}

/// Establishes a connection to the SQLite database with the sqlite:// prefix.
///
/// # Returns
/// * `SqliteConnection` - A connection to the database
///
/// # Panics
/// * If the connection cannot be established
pub fn establish_connection() -> SqliteConnection {
    let db_path = "sqlite://".to_string() + get_db_path().as_str();

    SqliteConnection::establish(&db_path)
        .unwrap_or_else(|_| panic!("Error connecting to {}", db_path))
}

/// Creates the SQLite database file and its parent directory if they don't exist.
///
/// This function ensures that the necessary directory structure exists
/// and creates an empty database file.
///
/// # Panics
/// * If the parent directory cannot be created
/// * If the database file cannot be created
fn create_db_file() {
    let db_path = get_db_path();
    let db_dir = Path::new(&db_path).parent().unwrap();

    if !db_dir.exists() {
        fs::create_dir_all(db_dir).unwrap();
    }

    fs::File::create(db_path).unwrap();
}

/// Checks if the database file exists.
///
/// # Returns
/// * `bool` - true if the database file exists, false otherwise
fn db_file_exists() -> bool {
    let db_path = get_db_path();
    Path::new(&db_path).exists()
}

/// Gets the path to the SQLite database file.
///
/// Constructs the full path to the database file in the user's
/// configuration directory.
///
/// # Returns
/// * `String` - The full path to the database file
///
/// # Panics
/// * If the home directory cannot be determined
/// * If the home directory path cannot be converted to a string
fn get_db_path() -> String {
    let home_dir = dirs::home_dir().unwrap();
    home_dir.to_str().unwrap().to_string() + "/.config/enzymeml/db.sqlite"
}

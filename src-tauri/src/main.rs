// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use tauri::async_runtime::spawn;
use tauri::Manager;

use crate::actions::{equations, smallmols, vessels};
use crate::api::create_rocket;
use crate::states::EnzymeMLState;

// use tauri::Manager;

pub(crate) mod api;
mod dataio;
mod db;
mod docutils;
mod models;
mod schema;
pub mod states;

pub mod actions {
    pub mod macros;
    pub mod enzmldoc;
    pub mod smallmols;
    pub mod vessels;
    pub mod utils;
    pub mod equations;
}

#[tokio::main]
async fn main() {
    // Initialize state and clone for both tauri and warp
    let app_state = Arc::new(EnzymeMLState::default());
    let rocket_state = Arc::clone(&app_state);
    let tauri_state = Arc::clone(&app_state);

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }

            // Initialize the database.
            db::init();

            // Initialize the Rocket server.
            let app_handle = app.handle().clone();
            spawn(async move {
                create_rocket(rocket_state, Arc::new(app_handle))
                    .launch()
                    .await
                    .expect("Rocket failed to launch");
            });

            Ok(())
        })
        .manage(tauri_state)
        .invoke_handler(tauri::generate_handler![
            dataio::save,
            dataio::load,
            dataio::list_all_entries,
            dataio::new_document,
            dataio::export_to_json,
            dataio::get_state,
            smallmols::create_small_mol,
            smallmols::get_small_mol,
            smallmols::update_small_mol,
            smallmols::delete_small_mol,
            smallmols::list_small_mols,
            vessels::create_vessel,
            vessels::get_vessel,
            vessels::update_vessel,
            vessels::delete_vessel,
            vessels::list_vessels,
            equations::update_equation,
            equations::get_equation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

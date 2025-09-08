// Prevents additi pub(crate) pub(crate)onal console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use tauri::async_runtime::spawn;
use tauri::Manager;

use crate::actions::{
    enzmldoc, equations, measurements, parameters, proteins, reactions, simulation, smallmols,
    units, vessels, windows,
};
use crate::api::create_rocket;
use crate::states::EnzymeMLState;

pub(crate) mod api;
mod db;
mod docutils;
mod models;
mod schema;
pub mod states;
pub mod unit;

pub mod io {
    pub mod dataio;
    pub mod dbops;
    pub mod macros;
    pub mod stringarray;
}

pub mod actions {
    pub mod enzmldoc;
    pub mod equations;
    pub mod macros;
    pub mod measurements;
    pub mod parameters;
    pub mod proteins;
    pub mod reactions;
    pub mod simulation;
    pub mod smallmols;
    pub mod units;
    pub mod utils;
    pub mod vessels;
    pub mod windows;
}

#[tokio::main]
async fn main() {
    // Initialize state and clone for both tauri and warp
    // Fetch env variable TESTING to determine if we are in testing mode

    let app_state = Arc::new(EnzymeMLState::default());
    let rocket_state = Arc::clone(&app_state);
    let tauri_state = Arc::clone(&app_state);

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            // Initialize the database.
            db::init();

            // Initialize the Stronghold plugin.
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            println!("Salt path: {:?}", salt_path);

            // Initialize the Rocket server.
            let app_handle = app.handle().clone();

            app_handle.plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            spawn(async move {
                create_rocket(rocket_state, Arc::new(app_handle))
                    .launch()
                    .await
                    .expect("Rocket failed to launch");
            });

            Ok(())
        })
        .plugin(tauri_plugin_cors_fetch::init())
        .manage(tauri_state)
        .invoke_handler(tauri::generate_handler![
            // Data IO
            io::dataio::save,
            io::dataio::load,
            io::dataio::list_all_entries,
            io::dataio::new_document,
            io::dataio::export_to_json,
            io::dataio::get_state,
            io::dataio::export_measurements,
            io::dataio::import_excel_meas,
            io::dataio::load_json,
            // Database
            io::dbops::save_mol_to_db,
            io::dbops::filter_small_mols,
            io::dbops::get_all_small_mols,
            io::dbops::get_small_mol_by_id,
            // EnzymeML Document
            enzmldoc::get_all_species_ids,
            enzmldoc::get_all_non_constant_species_ids,
            enzmldoc::get_species_name,
            enzmldoc::set_title,
            enzmldoc::get_all_species,
            // Units
            units::get_unit,
            units::get_unit_group,
            units::get_unit_groups,
            // Small Molecules
            smallmols::create_small_mol,
            smallmols::get_small_mol,
            smallmols::update_small_mol,
            smallmols::delete_small_mol,
            smallmols::list_small_mols,
            // Vessels
            vessels::create_vessel,
            vessels::get_vessel,
            vessels::update_vessel,
            vessels::delete_vessel,
            vessels::list_vessels,
            // Proteins
            proteins::create_protein,
            proteins::get_protein,
            proteins::update_protein,
            proteins::delete_protein,
            proteins::list_proteins,
            // Reactions
            reactions::create_reaction,
            reactions::get_reaction,
            reactions::update_reaction,
            reactions::delete_reaction,
            reactions::list_reactions,
            // Equations
            equations::update_equation,
            equations::get_equation,
            equations::delete_equation,
            equations::create_equation,
            equations::list_equations,
            equations::derive_from_reactions,
            // Parameters
            parameters::list_parameters,
            parameters::create_parameter,
            parameters::get_parameter,
            parameters::update_parameter,
            parameters::partial_update_parameter,
            parameters::delete_parameter,
            // Simulation
            simulation::simulate_enzymeml,
            // Measurements
            measurements::create_measurement,
            measurements::get_measurement,
            measurements::get_datapoints,
            measurements::update_measurement,
            measurements::delete_measurement,
            measurements::list_measurements,
            // Windows
            windows::open_visualisation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

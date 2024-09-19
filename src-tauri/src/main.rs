// Prevents additi pub(crate) pub(crate)onal console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use tauri::async_runtime::spawn;
use tauri::Manager;

use crate::actions::{enzmldoc, equations, measurements, parameters, proteins, reactions, simulation, smallmols, vessels, windows};
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
    pub mod enzmldoc;
    pub mod equations;
    pub mod macros;
    pub mod measurements;
    pub mod parameters;
    pub mod proteins;
    pub mod reactions;
    pub mod simulation;
    pub mod smallmols;
    pub mod utils;
    pub mod vessels;
    pub mod windows;
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
            // Data IO
            dataio::save,
            dataio::load,
            dataio::list_all_entries,
            dataio::new_document,
            dataio::export_to_json,
            dataio::get_state,
            dataio::export_meas_template,
            dataio::import_excel_meas,
            // EnzymeML Document
            enzmldoc::get_all_species_ids,
            enzmldoc::get_all_non_constant_species_ids,
            enzmldoc::get_species_name,
            enzmldoc::set_title,
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
            // Parameters
            parameters::list_parameters,
            parameters::create_parameter,
            parameters::get_parameter,
            parameters::update_parameter,
            parameters::delete_parameter,
            // Simulation
            simulation::simulate_enzymeml,
            // Measurements
            measurements::create_measurement,
            measurements::get_measurement,
            measurements::get_measurement_hashmap,
            measurements::update_measurement,
            measurements::delete_measurement,
            measurements::list_measurements,
            // Windows
            windows::open_simulator,
            windows::open_visualisation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

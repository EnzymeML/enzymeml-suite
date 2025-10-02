// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use tauri::async_runtime::spawn;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

use crate::actions::utils::get_config_store_path;
use crate::actions::{
    enzmldoc, equations, jupyter, measurements, parameters, proteins, reactions, simulation,
    smallmols, units, vessels, windows,
};
use crate::api::create_rocket;
use crate::states::{EnzymeMLState, JupyterState};
use specta_typescript::Typescript;
use tauri_specta::{collect_commands, collect_events, Builder, Commands, Events};

/// API module for handling HTTP endpoints and server functionality
pub(crate) mod api;
/// Database initialization and connection handling
mod db;
/// Document utilities for EnzymeML document operations
mod docutils;
/// Data models and structures used throughout the application
mod models;
/// Database schema definitions
mod schema;
/// Application state management
pub mod states;
/// Unit definitions and conversions
pub mod unit;

/// Input/output operations and data handling
pub mod io {
    /// Data input/output operations
    pub mod dataio;
    /// Database operations
    pub mod dbops;
    /// Utility macros for I/O operations
    pub mod macros;
    /// String array handling utilities
    pub mod stringarray;
}

/// Tauri command actions for frontend-backend communication
pub mod actions {
    /// EnzymeML document management commands
    pub mod enzmldoc;
    /// Equation handling and management
    pub mod equations;
    /// ID generation and management utilities
    pub mod identifiers;
    /// Jupyter notebook integration commands
    pub mod jupyter;
    /// Utility macros for action implementations
    pub mod macros;
    /// Measurement data handling commands
    pub mod measurements;
    /// Parameter management commands
    pub mod parameters;
    /// Protein entity management commands
    pub mod proteins;
    /// Reaction entity management commands
    pub mod reactions;
    /// Simulation execution and management
    pub mod simulation;
    /// Small molecule entity management commands
    pub mod smallmols;
    /// Unit definition and conversion commands
    pub mod units;
    /// Utility functions for action implementations
    pub mod utils;
    /// Vessel entity management commands
    pub mod vessels;
    /// Window management commands
    pub mod windows;
}

#[tokio::main]
async fn main() {
    let _ = fix_path_env::fix();

    // Initialize state and clone for both tauri and warp
    // Fetch env variable TESTING to determine if we are in testing mode

    let app_state = Arc::new(EnzymeMLState::default());
    let jupyter_state = Arc::new(JupyterState::default());
    let rocket_state = Arc::clone(&app_state);
    let tauri_state = Arc::clone(&app_state);

    // Jupyter commands
    if cfg!(debug_assertions) {
        generate_bindings(
            collect_commands![
                jupyter::get_jupyter_sessions,
                jupyter::kill_jupyter,
                jupyter::start_jupyter,
                jupyter::detect_python_installations,
                jupyter::list_detected_pythons,
                jupyter::get_selected_python,
                jupyter::set_selected_python,
                jupyter::add_python_env,
                jupyter::list_custom_python_envs,
                jupyter::install_jupyter_lab,
                jupyter::is_jupyter_lab_installed,
                jupyter::get_jupyter_template_metadata,
                jupyter::add_template_to_project,
                jupyter::open_project_folder,
            ],
            collect_events![jupyter::JupyterInstallOutput, jupyter::JupyterInstallStatus,],
            "../src/commands/jupyter.ts",
        );
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_cors_fetch::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(debug_assertions)] // only include this code on debug builds
                {
                    window.open_devtools();
                    window.close_devtools();
                }
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

            // Initialize the JSON store.
            let store_path = get_config_store_path().expect("Failed to get config store path");
            app.store(store_path)?;

            Ok(())
        })
        .manage(tauri_state)
        .manage(jupyter_state)
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
            io::dataio::load_json_from_path,
            io::dataio::import_excel_from_path,
            io::dataio::handle_file_drop,
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
            enzmldoc::create_document,
            enzmldoc::get_stats,
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
            smallmols::list_small_mol_smiles,
            smallmols::add_small_mol,
            smallmols::add_small_mols,
            // Vessels
            vessels::create_vessel,
            vessels::get_vessel,
            vessels::update_vessel,
            vessels::delete_vessel,
            vessels::list_vessels,
            vessels::add_vessel,
            vessels::add_vessels,
            // Proteins
            proteins::create_protein,
            proteins::get_protein,
            proteins::update_protein,
            proteins::delete_protein,
            proteins::list_proteins,
            proteins::add_protein,
            proteins::add_proteins,
            // Reactions
            reactions::create_reaction,
            reactions::get_reaction,
            reactions::update_reaction,
            reactions::delete_reaction,
            reactions::list_reactions,
            reactions::add_reaction,
            reactions::add_reactions,
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
            measurements::add_measurement,
            measurements::add_measurements,
            // Windows
            windows::open_visualisation,
            // Jupyter
            jupyter::start_jupyter,
            jupyter::get_jupyter_sessions,
            jupyter::kill_jupyter,
            jupyter::detect_python_installations,
            jupyter::list_detected_pythons,
            jupyter::get_selected_python,
            jupyter::set_selected_python,
            jupyter::add_python_env,
            jupyter::list_custom_python_envs,
            jupyter::install_jupyter_lab,
            jupyter::is_jupyter_lab_installed,
            jupyter::get_jupyter_template_metadata,
            jupyter::add_template_to_project,
            jupyter::open_project_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn generate_bindings(commands: Commands<tauri::Wry>, events: Events, path: &str) {
    let builder = Builder::<tauri::Wry>::new()
        .commands(commands)
        .events(events);

    builder
        .export(Typescript::default(), path)
        .expect("Failed to export typescript bindings");
}

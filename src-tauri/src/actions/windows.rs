use std::sync::Arc;

use tauri::{Manager, State};

use crate::states::EnzymeMLState;

#[tauri::command]
pub async fn open_simulator(app: tauri::AppHandle) {
    let file_path = "index_simulation.html";
    let _settings_window = tauri::WindowBuilder::new(
        &app,
        "Simulation", /* the unique window label */
        tauri::WindowUrl::App(file_path.into()),
    )
    .title("Settings")
    .build()
    .unwrap();
    // #[cfg(debug_assertions)] // only include this code on debug builds
    // {
    //     let window = app.get_window("Simulation").unwrap();
    //     window.open_devtools();
    //     window.close_devtools();
    // }
}

#[tauri::command]
pub fn open_visualisation(
    state: State<Arc<EnzymeMLState>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let state_doc = state.doc.lock().unwrap();

    if state_doc.measurements.is_empty() {
        return Err("No measurements found".to_string());
    }

    let file_path = "index_visualisation.html";
    let _settings_window = tauri::WindowBuilder::new(
        &app,
        "Visualisation", /* the unique window label */
        tauri::WindowUrl::App(file_path.into()),
    )
    .title("Visualisation")
    .decorations(false)
    .transparent(true)
    .resizable(true)
    .inner_size(1000_f64, 600_f64)
    .build()
    .unwrap();

    #[cfg(debug_assertions)] // only include this code on debug builds
    {
        let window = app.get_window("Visualisation").unwrap();
        window.open_devtools();
        window.close_devtools();
    }

    Ok(())
}

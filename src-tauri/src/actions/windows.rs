// use tauri::Manager;

/// Opens a new visualization window for the EnzymeML application
///
/// This function creates a new Tauri window dedicated to displaying visualizations
/// of the EnzymeML data. The window is configured with specific properties including
/// no decorations, transparency support, and a fixed initial size. The window loads
/// the visualization HTML file and is set to be resizable for user convenience.
///
/// # Arguments
/// * `app` - Handle to the Tauri application for window creation and management
///
/// # Returns
/// Result indicating success with empty tuple or failure with error message string
#[tauri::command]
pub async fn open_visualisation(app: tauri::AppHandle) -> Result<(), String> {
    let file_path = "viswindow/index.html";
    let _settings_window = tauri::WebviewWindowBuilder::new(
        &app,
        "visualisation", /* the unique window label */
        tauri::WebviewUrl::App(file_path.into()),
    )
    .title("Visualisation")
    .closable(true)
    .decorations(false)
    .transparent(true)
    .resizable(true)
    .inner_size(1000_f64, 600_f64)
    .build()
    .map_err(|e| e.to_string())?;

    // #[cfg(debug_assertions)] // only include this code on debug builds
    // {
    //     let window = app.get_window("visualisation").unwrap();
    //     window.open_devtools();
    //     window.close_devtools();
    // }

    Ok(())
}

use tauri::Manager;

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

    #[cfg(debug_assertions)] // only include this code on debug builds
    {
        let window = app.get_window("Simulation").unwrap();
        window.open_devtools();
        window.close_devtools();
    }
}

#[tauri::command]
pub async fn open_visualisation(app: tauri::AppHandle) {
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
        .build()
        .unwrap();

    #[cfg(debug_assertions)] // only include this code on debug builds
    {
        let window = app.get_window("Visualisation").unwrap();
        window.open_devtools();
        window.close_devtools();
    }
}

use std::{collections::HashMap, net::TcpListener, path::PathBuf, sync::Arc};

use python_launcher::all_executables;
use regex::Regex;
use specta;
use std::fs::create_dir_all;
use std::process::Command;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::{process::CommandEvent, ShellExt};
use tauri_plugin_store::StoreExt;

use crate::actions::utils::get_config_store_path;
use crate::states::{EnzymeMLState, JupyterSessionInfo, JupyterState, PythonInstallation};

const PYTHON_VERSION_REGEX: &str = r"Python (\d+\.\d+\.\d+(?:\.\w+)?)";
const PYTHON_ENVS_KEY: &str = "custom_python_envs";
const PROJECTS_DIR: &str = "enzymeml-suite/projects";

/// Macro for embedding Jupyter notebook templates at compile time
///
/// This macro simplifies the process of including Jupyter notebook template files
/// into the application binary. It takes a template name and HashMap reference,
/// then inserts the template content (loaded via `include_str!`) into the HashMap
/// with the given name as the key.
///
/// # Arguments
/// * `$name` - The name/key to use for the template in the HashMap
/// * `$templates` - A mutable reference to the HashMap to insert the template into
macro_rules! jupyter_template {
    ($name:expr, $templates:expr) => {
        $templates.insert(
            $name,
            include_str!(concat!(
                "../../../jupyter-templates/",
                concat!($name, ".ipynb")
            )),
        );
    };
}

#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub struct JupyterInstallOutput {
    status: JupyterInstallStatus,
    output: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub enum JupyterInstallStatus {
    Success,
    Error,
    Output,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, Clone)]
pub struct JupyterTemplate {
    name: String,
    description: String,
    template_path: String,
    repository: String,
    category: String,
}

// Static HashMap containing all Jupyter templates embedded at compile time
//
// The templates are loaded from the jupyter-templates directory and made available
// as a runtime-queryable HashMap where keys are template names (with .ipynb extension)
// and values are the notebook content as strings.
lazy_static::lazy_static! {
    // Static HashMap containing all raw Jupyter templates (with .ipynb extension) embedded at compile time
    static ref JUPYTER_TEMPLATES: HashMap<&'static str, &'static str> = {
        let mut templates = HashMap::new();

        jupyter_template!("Basic", templates);
        jupyter_template!("BayesianInference", templates);
        jupyter_template!("COPASI", templates);
        jupyter_template!("NeuralODE", templates);
        jupyter_template!("ParameterEstimation", templates);
        jupyter_template!("PySCeS", templates);
        jupyter_template!("SurrogateBayesianInference", templates);
        jupyter_template!("UniversalODE", templates);
        jupyter_template!("Visualisation", templates);
        templates
    };

    // Static vector containing all Jupyter template metadata embedded at compile time
    static ref JUPYTER_TEMPLATE_METADATA: Vec<JupyterTemplate> = {
        let raw_templates = include_str!("../../../jupyter-templates/_templates.json");
        serde_json::from_str(raw_templates).expect("Failed to parse jupyter templates JSON")
    };

}

/// Detects all available Python installations on the system
///
/// This function uses the python_launcher crate to find all Python executables
/// and ranks them by priority (anaconda > homebrew > others). It stores the
/// detected installations in the JupyterState and automatically selects the
/// highest priority one if no selection has been made. Also loads custom Python
/// environments from the config store.
///
/// # Arguments
/// * `app` - The Tauri application handle for accessing the store
/// * `jupyter_state` - The shared Jupyter state for storing detected Pythons
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Vec<PythonInstallation>)` with all detected Python installations
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn detect_python_installations(
    app: AppHandle,
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<Vec<PythonInstallation>, String> {
    let mut installations = Vec::new();

    // Detect all Python executables using python_launcher
    for (_, path) in all_executables().into_iter() {
        let path_str = path.to_string_lossy().to_string();

        // Get version for this Python
        if let Ok(output) = Command::new(&path).arg("--version").output() {
            if output.status.success() {
                let version_output = String::from_utf8_lossy(&output.stdout);
                if let Some(caps) = Regex::new(PYTHON_VERSION_REGEX)
                    .unwrap()
                    .captures(&version_output)
                {
                    let version = caps[1].to_string();
                    let (source, priority) = determine_python_source(&path_str);

                    installations.push(PythonInstallation {
                        path: path_str,
                        version,
                        source,
                        priority,
                        is_custom: false,
                    });
                }
            }
        }
    }

    // Load and merge custom Python environments from the config store
    load_custom_python_envs(&app, &mut installations);

    // Sort by priority (lower is better)
    installations.sort_by_key(|p| p.priority);

    // Store detected installations
    *jupyter_state.detected_pythons.lock().unwrap() = installations.clone();

    // Auto-select the best one if none is selected yet
    let mut selected = jupyter_state.selected_python_path.lock().unwrap();
    if selected.is_none() && !installations.is_empty() {
        *selected = Some(installations[0].path.clone());
    }

    Ok(installations)
}

/// Lists all detected Python installations
///
/// # Arguments
/// * `jupyter_state` - The shared Jupyter state containing detected Pythons
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Vec<PythonInstallation>)` with all detected Python installations
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn list_detected_pythons(
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<Vec<PythonInstallation>, String> {
    Ok(jupyter_state.detected_pythons.lock().unwrap().clone())
}

/// Gets the currently selected Python installation path
///
/// # Arguments
/// * `jupyter_state` - The shared Jupyter state containing the selected Python
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Option<String>)` with the selected Python path if set
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn get_selected_python(
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<Option<String>, String> {
    Ok(jupyter_state.selected_python_path.lock().unwrap().clone())
}

/// Sets the preferred Python installation path
///
/// # Arguments
/// * `jupyter_state` - The shared Jupyter state to update
/// * `path` - The path to the Python executable to use
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the path is set successfully
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn set_selected_python(
    jupyter_state: State<'_, Arc<JupyterState>>,
    path: String,
) -> Result<(), String> {
    // Verify the path exists in detected pythons
    let detected = jupyter_state.detected_pythons.lock().unwrap();
    if !detected.iter().any(|p| p.path == path) {
        return Err(format!(
            "Python path not found in detected installations: {}",
            path
        ));
    }
    drop(detected);

    // Update the in-memory state
    *jupyter_state.selected_python_path.lock().unwrap() = Some(path);

    Ok(())
}

/// Adds a custom Python environment to the config store
///
/// This function validates a Python executable path, extracts its version information,
/// and persists it to the config store's `custom_python_envs` array. The custom
/// environment will be merged with auto-detected installations on subsequent detections.
/// The newly added Python environment is automatically selected as the active Python.
///
/// # Arguments
/// * `app` - The Tauri application handle for executing shell commands and accessing the store
/// * `jupyter_state` - The shared Jupyter state for managing Python installations
/// * `path` - The path to the Python executable to add
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the Python environment is added and persisted successfully
/// - `Err(String)` if the operation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - The provided path is a directory instead of an executable file
/// - The Python executable cannot be verified (invalid Python installation)
/// - The version cannot be parsed from the Python output
/// - The config store cannot be accessed or saved
#[tauri::command]
#[specta::specta]
pub async fn add_python_env(
    app: AppHandle,
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<(), String> {
    // Let the user point to the python env
    let file_path = app
        .dialog()
        .file()
        .set_title("Pick a Python installation")
        .blocking_pick_file()
        .ok_or_else(|| "No file has been selected.".to_string())?;

    let path = file_path
        .as_path()
        .ok_or_else(|| "Could not convert 'FilePath' into path.".to_string())?;

    // Check if the given path is in fact a valid Python installation
    if path.is_dir() {
        return Err("The provided path is a directory, but a Python executable file is required. Please specify the full path to the Python executable (e.g., /path/to/python or /path/to/python.exe)".to_string());
    }

    let check = app.shell().command(&path).arg("--version").output().await;

    match check {
        Ok(output) => {
            if !output.status.success() {
                return Err("No valid Python version detected. Are you sure the binary provided is a Python installation?".to_string());
            }

            // Parse version from output
            let version_output = String::from_utf8_lossy(&output.stdout);
            let version = if let Some(caps) = Regex::new(PYTHON_VERSION_REGEX)
                .unwrap()
                .captures(&version_output)
            {
                caps[1].to_string()
            } else {
                return Err(format!(
                    "Failed to parse Python version from output: {}",
                    version_output
                ));
            };

            let path_str = path.to_string_lossy().to_string();
            let (source, priority) = determine_python_source(&path_str);

            let new_installation = PythonInstallation {
                path: path_str.clone(),
                version,
                source,
                priority,
                is_custom: true,
            };

            // Add the path to detected pythons if it's not already there
            let mut detected = jupyter_state.detected_pythons.lock().unwrap();
            if !detected.iter().any(|p| p.path == path_str) {
                detected.push(new_installation.clone());
            }
            drop(detected);

            // Persist to the config store's custom_python_envs array
            save_custom_python_env(&app, &new_installation)?;

            // Select this Python as the active one
            *jupyter_state.selected_python_path.lock().unwrap() = Some(path_str);
        }
        Err(e) => {
            return Err(format!("Failed to verify Python installation: {}", e));
        }
    }

    Ok(())
}

/// Retrieves all custom Python environments from the configuration store
///
/// This function accesses the application's configuration store to retrieve the list
/// of custom Python environments that have been manually added by the user. These
/// custom environments are stored separately from auto-detected Python installations
/// and persist across application restarts. If no custom environments have been
/// configured yet, the function initializes an empty array in the store for future use.
///
/// # Arguments
/// * `app` - The Tauri application handle used for accessing the configuration store
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Vec<PythonInstallation>)` with all custom Python environments from the store
/// - `Err(String)` if the operation fails, containing a descriptive error message
///
/// # Errors
/// Returns an error if:
/// - The configuration store cannot be accessed or opened
/// - The stored custom Python environments data is corrupted or cannot be parsed
/// - The store cannot be saved when initializing an empty array
#[tauri::command]
#[specta::specta]
pub async fn list_custom_python_envs(app: AppHandle) -> Result<Vec<PythonInstallation>, String> {
    let store = app
        .store(get_config_store_path()?)
        .map_err(|e| format!("Could not open store: {}", e))?;

    match store.get(PYTHON_ENVS_KEY) {
        Some(custom_pythons) => {
            // Parse the stored custom Python environments
            serde_json::from_value::<Vec<PythonInstallation>>(custom_pythons.clone())
                .map_err(|e| format!("Failed to parse custom Python environments: {}", e))
        }
        None => {
            // Key doesn't exist, initialize it with an empty array
            let empty_vec: Vec<PythonInstallation> = Vec::new();
            store.set(PYTHON_ENVS_KEY, serde_json::to_value(&empty_vec).unwrap());
            store
                .save()
                .map_err(|e| format!("Failed to save store: {}", e))?;
            Ok(empty_vec)
        }
    }
}

/// Loads custom Python environments from the config store and merges them with detected installations
///
/// # Arguments
/// * `app` - The Tauri application handle for accessing the store
/// * `installations` - Mutable reference to the installations vector to merge into
fn load_custom_python_envs(app: &AppHandle, installations: &mut Vec<PythonInstallation>) {
    let Ok(store_path) = get_config_store_path() else {
        return;
    };
    let Ok(store) = app.store(store_path) else {
        return;
    };
    let Some(custom_pythons) = store.get(PYTHON_ENVS_KEY) else {
        return;
    };

    let Ok(custom_envs): Result<Vec<PythonInstallation>, _> =
        serde_json::from_value(custom_pythons.clone())
    else {
        return;
    };

    for env in custom_envs {
        // Skip if already detected
        if installations.iter().any(|p| p.path == env.path) {
            continue;
        }

        installations.push(env);
    }
}

/// Saves a custom Python environment to the config store
///
/// # Arguments
/// * `app` - The Tauri application handle for accessing the store
/// * `installation` - The Python installation to save
///
/// # Returns
/// A `Result` indicating success or failure
fn save_custom_python_env(
    app: &AppHandle,
    installation: &PythonInstallation,
) -> Result<(), String> {
    let store_path = get_config_store_path()?;
    let store = app
        .store(store_path)
        .map_err(|e| format!("Failed to access store: {}", e))?;

    // Get existing custom Python environments or create new vec
    let mut custom_envs: Vec<PythonInstallation> = store
        .get(PYTHON_ENVS_KEY)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Check if this path is already in custom_envs
    let already_exists = custom_envs.iter().any(|env| env.path == installation.path);

    // Add to custom_envs if not already present
    if !already_exists {
        custom_envs.push(installation.clone());
        store.set(PYTHON_ENVS_KEY, serde_json::to_value(&custom_envs).unwrap());
        store
            .save()
            .map_err(|e| format!("Failed to save store: {}", e))?;
    }

    Ok(())
}

/// Determines the source and priority of a Python installation based on its path
///
/// # Arguments
/// * `path` - The path to the Python executable
///
/// # Returns
/// A tuple of (source_name, priority) where lower priority is better
fn determine_python_source(path: &str) -> (String, u8) {
    let path_lower = path.to_lowercase();

    // Anaconda/Miniconda (highest priority)
    if path_lower.contains("anaconda")
        || path_lower.contains("miniconda")
        || path_lower.contains("conda")
    {
        return ("anaconda".to_string(), 1);
    }

    // Homebrew (second priority)
    if path_lower.contains("homebrew")
        || path_lower.contains("/opt/homebrew")
        || path_lower.contains("/usr/local")
    {
        return ("homebrew".to_string(), 2);
    }

    // Python.org installations
    if path_lower.contains("python.framework") || path_lower.contains("programs/python") {
        return ("python.org".to_string(), 3);
    }

    // System Python (lowest priority)
    if path_lower.contains("/usr/bin")
        || path_lower.contains("/bin")
        || path_lower.contains("system32")
    {
        return ("system".to_string(), 4);
    }

    // Unknown/other
    ("other".to_string(), 5)
}

/// Checks if JupyterLab is installed on the system
///
/// This function executes the `jupyter lab --version` command using the selected
/// Python installation to determine if JupyterLab is available.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for executing shell commands
/// * `jupyter_state` - The shared Jupyter state containing selected Python path
///
/// # Returns
/// A `Result` containing:
/// - `Ok(true)` if JupyterLab is installed and accessible
/// - `Ok(false)` if JupyterLab is not found or command fails
/// - `Err(String)` if the shell command cannot be executed
#[tauri::command]
#[specta::specta]
pub async fn is_jupyter_lab_installed(
    app_handle: tauri::AppHandle,
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<bool, String> {
    let selected_python = jupyter_state.selected_python_path.lock().unwrap().clone();

    if selected_python.is_none() {
        return Ok(false);
    }

    let python_path = selected_python.unwrap();

    // Try jupyter-lab --version using selected Python's environment
    let jupyter_lab_check = app_handle
        .shell()
        .command("jupyter-lab")
        .arg("--version")
        .envs(setup_jupyter_env(&python_path))
        .output()
        .await;

    if let Ok(output) = jupyter_lab_check {
        if output.status.success() {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Installs JupyterLab using pip with the selected Python installation
///
/// This function executes the `python -m pip install jupyterlab jupyter ipywidgets` command
/// using the selected Python installation to install JupyterLab and its dependencies.
/// The installation process is streamed and emits events to the frontend for real-time progress updates.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for executing shell commands and emitting events
/// * `jupyter_state` - The shared Jupyter state containing selected Python path
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if JupyterLab is installed successfully
/// - `Err(String)` if the installation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - No Python is selected
/// - The pip command cannot be executed (pip not found in PATH)
/// - The installation process fails (e.g., network issues, permission problems)
/// - JupyterLab package cannot be found or installed
/// - Insufficient disk space or system resources
#[tauri::command]
#[specta::specta]
pub async fn install_jupyter_lab(
    app_handle: tauri::AppHandle,
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<(), String> {
    let selected_python = jupyter_state.selected_python_path.lock().unwrap().clone();

    if selected_python.is_none() {
        return Err(
            "No Python installation selected. Please select a Python installation first."
                .to_string(),
        );
    }

    let python_path = selected_python.unwrap();

    // Emit initial status
    app_handle
        .emit(
            "jupyter-install",
            JupyterInstallOutput {
                status: JupyterInstallStatus::Output,
                output: format!("Starting JupyterLab installation with {}...", python_path),
            },
        )
        .ok();

    let (mut rx, _child) = app_handle
        .shell()
        .command(&python_path)
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("jupyterlab")
        .arg("jupyter")
        .arg("ipywidgets")
        .arg("--break-system-packages")
        .arg("--user")
        .envs(setup_jupyter_env(&python_path))
        .spawn()
        .map_err(|e| format!("spawn failed: {e}"))?;

    // Handle command output

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                let line = String::from_utf8_lossy(&line);
                app_handle
                    .emit(
                        "jupyter-install",
                        JupyterInstallOutput {
                            status: JupyterInstallStatus::Output,
                            output: line.to_string(),
                        },
                    )
                    .ok();
            }
            CommandEvent::Terminated(payload) => {
                if payload.code == Some(0) {
                    app_handle
                        .emit(
                            "jupyter-install",
                            JupyterInstallOutput {
                                status: JupyterInstallStatus::Success,
                                output: "JupyterLab installed successfully".to_string(),
                            },
                        )
                        .ok();
                } else {
                    app_handle
                        .emit(
                            "jupyter-install",
                            JupyterInstallOutput {
                                status: JupyterInstallStatus::Error,
                                output: format!(
                                    "Installation failed with exit code: {:?}",
                                    payload.code
                                ),
                            },
                        )
                        .ok();
                }
                break;
            }
            CommandEvent::Error(error) => {
                app_handle
                    .emit(
                        "jupyter-install",
                        JupyterInstallOutput {
                            status: JupyterInstallStatus::Error,
                            output: error.to_string(),
                        },
                    )
                    .ok();
            }
            _ => {}
        }
    }

    Ok(())
}

/// Retrieves all active Jupyter Lab sessions
///
/// This function returns a list of all currently running Jupyter Lab sessions
/// managed by the application. Each session contains information about the
/// session ID, URL, and port number.
///
/// # Arguments
/// * `jupyter_state` - The shared Jupyter state containing session information
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Vec<JupyterSessionInfo>)` with details of all active sessions
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn get_jupyter_sessions(
    jupyter_state: State<'_, Arc<JupyterState>>,
) -> Result<Vec<JupyterSessionInfo>, String> {
    Ok(jupyter_state.get_sessions())
}

/// Opens the project folder in the system file explorer
///
/// This function opens the project folder in the system file explorer.
/// If the project folder does not exist, it creates it.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for opening the project folder
/// * `enzmldoc_state` - The shared EnzymeML document state containing document metadata
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the project folder is opened successfully
/// - `Err(String)` if the operation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - The project folder does not exist
/// - The project folder cannot be created
/// - The project folder cannot be opened
#[tauri::command]
#[specta::specta]
pub fn open_project_folder(
    app_handle: tauri::AppHandle,
    enzmldoc_state: State<'_, Arc<EnzymeMLState>>,
) -> Result<(), String> {
    let project_path = get_project_path(&enzmldoc_state);

    if !project_path.exists() {
        create_dir_all(&project_path)
            .map_err(|e| format!("failed to create project folder: {e}"))?;
    }

    app_handle
        .opener()
        .open_path(project_path.to_str().unwrap(), None::<&str>)
        .map_err(|e| format!("failed to open project folder: {e}"))?;
    Ok(())
}

/// Terminates a specific Jupyter Lab session by ID
///
/// This function kills the child process associated with the given session ID,
/// effectively stopping the Jupyter Lab server. The session is identified by
/// its unique string identifier. After successful termination, emits a
/// `jupyter_update` event to notify the frontend.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for emitting events
/// * `jupyter_state` - The shared Jupyter state managing active sessions
/// * `id` - The unique identifier of the session to terminate
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the session is terminated successfully
/// - `Err(String)` if the operation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - No session with the given ID exists
/// - The child process cannot be killed
/// - The process has already been terminated
/// - Event emission fails
#[tauri::command]
#[specta::specta]
pub fn kill_jupyter(
    app_handle: tauri::AppHandle,
    jupyter_state: State<'_, Arc<JupyterState>>,
    id: String,
) -> Result<(), String> {
    jupyter_state
        .kill_child(&id)
        .map_err(|e| format!("failed to kill child: {e}"))?;

    // Emit update signal after successfully killing the session
    app_handle
        .emit("jupyter_update", ())
        .map_err(|e| format!("failed to emit jupyter_update event: {e}"))?;

    Ok(())
}

/// Starts a Jupyter Lab server with optional template
///
/// This function spawns a new Jupyter Lab process on an available port.
/// The server is configured to run in a dedicated directory for the current
/// EnzymeML document, ensuring each document has its own workspace.
/// The directory structure follows: `~/enzymeml-suite/projects/{document_name}/`
///
/// If a template is specified, it will be written to the project directory
/// before starting the server (only if the file doesn't already exist).
///
/// # Arguments
/// * `app_handle` - Handle to the Tauri application for shell command execution
/// * `template` - Optional template name to create in the project directory
/// * `jupyter_state` - The shared Jupyter state for managing server information
/// * `enzmldoc_state` - The shared EnzymeML document state containing document metadata
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the Jupyter Lab server starts successfully
/// - `Err(String)` if the operation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - The jupyter command fails to spawn
/// - Jupyter is not installed on the system
/// - Directory creation fails
/// - Template writing fails
/// - The child process cannot be managed properly
#[tauri::command]
#[specta::specta]
pub async fn start_jupyter(
    app_handle: tauri::AppHandle,
    template: Option<String>,
    jupyter_state: State<'_, Arc<JupyterState>>,
    enzmldoc_state: State<'_, Arc<EnzymeMLState>>,
) -> Result<(), String> {
    // Get the name of the enzymeml document and sanitize it for filesystem use
    // Replace spaces with underscores and convert to lowercase for consistency
    let name = enzmldoc_state
        .title
        .lock()
        .unwrap()
        .clone()
        .replace(" ", "_")
        .to_lowercase();

    // Create the Jupyter working directory structure
    // Path: ~/enzymeml-suite/projects/{document_name}/
    let jupyter_dir = get_project_path(&enzmldoc_state);
    if !jupyter_dir.exists() {
        create_dir_all(&jupyter_dir).unwrap();
    }

    // Create a template file in the Jupyter directory if a template is specified
    // Only write the file if it doesn't already exist to avoid overwriting user changes
    if let Some(template_name) = template {
        write_template(&template_name, &enzmldoc_state)?;
    }

    // Get the selected Python path
    let selected_python = jupyter_state.selected_python_path.lock().unwrap().clone();
    if selected_python.is_none() {
        return Err(
            "No Python installation selected. Please select a Python installation first."
                .to_string(),
        );
    }
    let python_path = selected_python.unwrap();

    // Spawn the Jupyter Lab process with the specified configuration
    // - Uses the sanitized document name as the working directory
    // - Disables port retries to fail fast if port is occupied
    let port = get_next_available_port();
    let (mut rx, child) = app_handle
        .shell()
        .command("jupyter-lab")
        .arg("--ServerApp.port_retries=0")
        .arg("--ServerApp.root_dir")
        .arg(&jupyter_dir)
        .arg("--port")
        .arg(port.to_string())
        .current_dir(&jupyter_dir)
        .envs(setup_jupyter_env(&python_path))
        .spawn()
        .map_err(|e| format!("spawn failed: {e}"))?;

    // Process the command output streams
    // This loop handles both stdout and stderr from the Jupyter process
    let mut child = Some(child);
    while let Some(line) = rx.recv().await {
        match line {
            CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                let line = String::from_utf8_lossy(&line);
                if parse_output_and_create_session(
                    &jupyter_state,
                    &line,
                    port,
                    name.clone(),
                    &mut child,
                )
                .is_ok()
                {
                    return Ok(());
                }
            }
            CommandEvent::Terminated(payload) => {
                if payload.code == Some(0) {
                    return Ok(());
                } else {
                    return Err(format!("failed to spawn jupyter lab: {:?}", payload.code));
                }
            }
            CommandEvent::Error(error) => {
                return Err(format!("failed to spawn jupyter lab: {error}"));
            }
            _ => {}
        }
    }

    Ok(())
}

/// Retrieves all Jupyter template metadata
///
/// This function returns a vector containing all Jupyter template metadata
/// embedded at compile time. The metadata includes the template name, description,
/// template path, repository, and category.
///
/// # Returns
/// A `Result` containing:
/// - `Ok(Vec<JupyterTemplate>)` with all available template metadata
/// - `Err(String)` if the operation fails
#[tauri::command]
#[specta::specta]
pub fn get_jupyter_template_metadata() -> Result<Vec<JupyterTemplate>, String> {
    Ok(JUPYTER_TEMPLATE_METADATA.to_vec())
}

/// Adds a template to the current project directory
///
/// This function writes a specified Jupyter template to the current project's
/// directory. The template is only written if it doesn't already exist to
/// avoid overwriting user modifications.
///
/// # Arguments
/// * `template_name` - The name of the template to add to the project
/// * `state` - The shared EnzymeML state containing project information
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the template is added successfully
/// - `Err(String)` if the operation fails, containing the error message
#[tauri::command]
#[specta::specta]
pub async fn add_template_to_project(
    template_name: &str,
    state: State<'_, Arc<EnzymeMLState>>,
) -> Result<(), String> {
    write_template(template_name, &state)?;
    Ok(())
}

/// Writes a template file to the project directory
///
/// This helper function retrieves a template from the embedded templates
/// collection and writes it to the current project directory. The file
/// is only written if it doesn't already exist.
///
/// # Arguments
/// * `template_name` - The name of the template to write
/// * `state` - The shared EnzymeML state containing project information
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if the template is written successfully
/// - `Err(String)` if the operation fails
fn write_template(
    template_name: &str,
    state: &State<'_, Arc<EnzymeMLState>>,
) -> Result<(), String> {
    let template_content = JUPYTER_TEMPLATES
        .get(template_name)
        .ok_or(format!("Failed to get template content: {template_name}"))?;

    let template_metadata = JUPYTER_TEMPLATE_METADATA
        .iter()
        .find(|t| t.template_path == template_name)
        .ok_or(format!("Failed to get template metadata: {template_name}"))?;

    let project_path = get_project_path(state);

    if !project_path.exists() {
        create_dir_all(&project_path).map_err(|e| format!("Failed to create project path: {e}"))?;
    }

    let template_file_path = project_path.join(format!("{}.ipynb", template_metadata.name));
    if !template_file_path.exists() {
        std::fs::write(&template_file_path, template_content)
            .map_err(|e| format!("Failed to write template file: {e}"))?;
    }

    Ok(())
}

/// Parses Jupyter Lab output and creates a session when URL is found
///
/// This helper function monitors the output from a spawned Jupyter Lab process,
/// looking for the server URL that indicates the server has started successfully.
/// When found, it creates a new session entry in the Jupyter state with the
/// associated child process handle.
///
/// # Arguments
/// * `jupyter_state` - The shared Jupyter state for session management
/// * `line` - A line of output from the Jupyter Lab process
/// * `port` - The port number the Jupyter server is running on
/// * `name` - The name/identifier for this Jupyter session
/// * `child` - Mutable reference to the optional child process handle
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if URL was found and session created successfully
/// - `Err(String)` if no URL is found in the output line or child process is unavailable
fn parse_output_and_create_session(
    jupyter_state: &State<'_, Arc<JupyterState>>,
    line: &str,
    port: u16,
    name: String,
    child: &mut Option<tauri_plugin_shell::process::CommandChild>,
) -> Result<(), String> {
    if let Some(url) = jupyter_state.get_url_from_stdout(line) {
        if let Some(child_process) = child.take() {
            let id = format!("{}:{}", name, port);
            jupyter_state.add_session_with_child(id, url, port, child_process);
            Ok(())
        } else {
            Err("Child process already taken".to_string())
        }
    } else {
        Err(format!("no URL found in output: {}", line))
    }
}

/// Finds the next available port starting from 8888
///
/// This function iterates through port numbers starting from 8888 until
/// it finds one that is not currently in use.
///
/// # Returns
/// The first available port number as a u16
fn get_next_available_port() -> u16 {
    let mut port = 8888;
    while is_port_occupied(port) {
        port += 1;
    }
    port
}

/// Checks if a specific port is currently occupied
///
/// This function attempts to bind to the specified port to determine
/// if it's available for use.
///
/// # Arguments
/// * `port` - The port number to check
///
/// # Returns
/// `true` if the port is occupied, `false` if it's available
fn is_port_occupied(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_err()
}

/// Gets the project directory path for the current EnzymeML document
///
/// This function constructs the path to the project directory based on the
/// current document title. The path follows the pattern:
/// `~/enzymeml-suite/projects/{sanitized_document_name}/`
///
/// # Arguments
/// * `state` - The shared EnzymeML state containing document information
///
/// # Returns
/// A `PathBuf` representing the project directory path
fn get_project_path(state: &State<'_, Arc<EnzymeMLState>>) -> PathBuf {
    let name = state.title.lock().unwrap().replace(" ", "_").to_lowercase();
    let id = state.id.lock().unwrap();

    let folder_name = match *id {
        Some(id) => format!("{}-{}", name, id),
        None => name,
    };

    dirs::home_dir()
        .unwrap()
        .join(PROJECTS_DIR)
        .join(folder_name)
}

/// Helper to add a path to the candidates list if it exists
fn push_if_exists(list: &mut Vec<PathBuf>, p: PathBuf) {
    if p.exists() {
        list.push(p);
    }
}

/// Sets up the environment for Jupyter commands by ensuring Python and its packages are in PATH
///
/// This function creates a comprehensive PATH that includes the selected Python installation
/// and common locations where Jupyter might be installed (user site-packages, conda, homebrew, etc.)
///
/// # Arguments
/// * `python_path` - The path to the selected Python executable
///
/// # Returns
/// A vector of (key, value) tuples to be used as environment variables
fn setup_jupyter_env(python_path: &str) -> Vec<(&'static str, String)> {
    use std::collections::HashSet;

    let current_path = std::env::var("PATH").unwrap_or_default();
    let mut cands: Vec<PathBuf> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    // Add the directory containing the selected Python first
    let python_dir = PathBuf::from(python_path).parent().map(|p| p.to_path_buf());
    if let Some(dir) = python_dir {
        push_if_exists(&mut cands, dir.clone());

        // Add common script/bin directories relative to Python
        #[cfg(target_os = "windows")]
        {
            push_if_exists(&mut cands, dir.join("Scripts"));
        }
        #[cfg(not(target_os = "windows"))]
        {
            push_if_exists(&mut cands, dir.join("bin"));
        }
    }

    let home = dirs::home_dir().unwrap_or_else(|| {
        #[cfg(target_os = "windows")]
        {
            PathBuf::from("C:\\")
        }
        #[cfg(not(target_os = "windows"))]
        {
            PathBuf::from("/")
        }
    });

    #[cfg(target_os = "windows")]
    {
        let userprofile = std::env::var("USERPROFILE")
            .ok()
            .map(PathBuf::from)
            .unwrap_or_else(|| home.clone());

        // User Conda environments
        for root in ["anaconda3", "miniconda3", "mambaforge"] {
            let base = userprofile.join(root);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.join("Library").join("bin"));
            push_if_exists(&mut cands, base.clone());
        }

        // User pip scripts
        push_if_exists(
            &mut cands,
            userprofile
                .join("AppData")
                .join("Roaming")
                .join("Python")
                .join("Scripts"),
        );
        push_if_exists(&mut cands, userprofile.join(".local").join("bin"));

        // Python.org per-user installs
        if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
            let lad = PathBuf::from(local_appdata);
            for vers in ["Python313", "Python312", "Python311", "Python310"] {
                let base = lad.join("Programs").join("Python").join(vers);
                push_if_exists(&mut cands, base.join("Scripts"));
                push_if_exists(&mut cands, base.clone());
            }
        }

        // ProgramData Anaconda (machine-wide)
        for base_str in ["C:\\ProgramData\\Anaconda3", "C:\\ProgramData\\Miniconda3"] {
            let base = PathBuf::from(base_str);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.join("Library").join("bin"));
            push_if_exists(&mut cands, base.clone());
        }

        // Global python.org installs
        for base_str in [
            "C:\\Python313",
            "C:\\Python312",
            "C:\\Python311",
            "C:\\Python310",
        ] {
            let base = PathBuf::from(base_str);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.clone());
        }

        // System paths
        for sys in ["C:\\Windows\\System32", "C:\\Windows"] {
            push_if_exists(&mut cands, PathBuf::from(sys));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // User Conda (highest priority)
        for root in ["anaconda3", "miniconda3", "mambaforge", "miniforge3"] {
            let base = home.join(root);
            push_if_exists(&mut cands, base.join("condabin"));
            push_if_exists(&mut cands, base.join("bin"));
            push_if_exists(&mut cands, base.clone());
        }

        // User local bin (pip install --user)
        push_if_exists(&mut cands, home.join(".local").join("bin"));

        // Homebrew (macOS)
        #[cfg(target_os = "macos")]
        {
            push_if_exists(&mut cands, PathBuf::from("/opt/homebrew/bin")); // Apple Silicon
            push_if_exists(&mut cands, PathBuf::from("/opt/homebrew/sbin"));
            push_if_exists(&mut cands, PathBuf::from("/usr/local/bin")); // Intel
            push_if_exists(&mut cands, PathBuf::from("/usr/local/sbin"));

            // Python.org Frameworks (macOS)
            for v in ["3.13", "3.12", "3.11", "3.10"] {
                push_if_exists(
                    &mut cands,
                    PathBuf::from(format!(
                        "/Library/Frameworks/Python.framework/Versions/{}/bin",
                        v
                    )),
                );
            }
        }

        // Linux common paths
        #[cfg(target_os = "linux")]
        {
            push_if_exists(&mut cands, PathBuf::from("/usr/local/bin"));
            push_if_exists(&mut cands, PathBuf::from("/usr/local/sbin"));
        }

        // System bins (all Unix-like)
        push_if_exists(&mut cands, PathBuf::from("/usr/bin"));
        push_if_exists(&mut cands, PathBuf::from("/bin"));
        push_if_exists(&mut cands, PathBuf::from("/usr/sbin"));
        push_if_exists(&mut cands, PathBuf::from("/sbin"));
    }

    // Dedup preserving order
    let mut dedup: Vec<String> = Vec::new();
    for p in cands {
        let s = p.to_string_lossy().to_string();
        if seen.insert(s.clone()) {
            dedup.push(s);
        }
    }

    // Build final PATH with platform-specific separator
    #[cfg(target_os = "windows")]
    let separator = ";";
    #[cfg(not(target_os = "windows"))]
    let separator = ":";

    let joined = if current_path.is_empty() {
        dedup.join(separator)
    } else if dedup.is_empty() {
        current_path
    } else {
        format!("{}{}{}", dedup.join(separator), separator, current_path)
    };

    vec![("PATH", joined)]
}

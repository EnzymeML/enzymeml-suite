use std::{collections::HashMap, net::TcpListener, path::PathBuf, sync::Arc};

use regex::Regex;
use specta;
use std::fs::create_dir_all;
use tauri::{Emitter, State};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

#[cfg(target_os = "windows")]
use std::collections::HashSet;

use crate::states::{EnzymeMLState, JupyterSessionInfo, JupyterState};

const PYTHON_VERSION_REGEX: &str = r"Python (\d+\.\d+\.\d+)";
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

#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct PythonVersion {
    status: String,
    version: Option<String>,
    error: Option<String>,
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

/// Retrieves the Python version installed on the system
///
/// This function executes the `python3 --version` command (or `python` on Windows)
/// to determine the currently installed Python version. It parses the output using
/// a regex pattern to extract the version number.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for executing shell commands
///
/// # Returns
/// A `Result` containing:
/// - `Ok(PythonVersion)` with status "ok" and version string if Python is found and parsed successfully
/// - `Ok(PythonVersion)` with status "error" and error message if Python is found but version parsing fails
/// - `Ok(PythonVersion)` with status "not_found" if Python is not found or command execution fails
/// - `Err(String)` if the shell command cannot be executed
#[tauri::command]
#[specta::specta]
pub async fn get_python_version(app_handle: tauri::AppHandle) -> Result<PythonVersion, String> {
    let command = if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    };

    let output = app_handle
        .shell()
        .command(command)
        .arg("--version")
        .envs(setup_jupyter_env())
        .output()
        .await
        .map_err(|e| format!("Failed to get python version: {e}"))?;

    if output.status.success() {
        // If no match, read the stdout and look for the version
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(caps) = Regex::new(PYTHON_VERSION_REGEX).unwrap().captures(&stdout) {
            return Ok(PythonVersion {
                status: "ok".to_string(),
                version: Some(caps[1].to_string()),
                error: None,
            });
        }

        // If no match, turn the stderr into a string and return the error
        let stderr = String::from_utf8_lossy(&output.stderr);

        // If no match, return the error
        return Ok(PythonVersion {
            status: "error".to_string(),
            version: None,
            error: Some(stderr.to_string()),
        });
    }

    Ok(PythonVersion {
        status: "not_found".to_string(),
        version: None,
        error: None,
    })
}

/// Checks if JupyterLab is installed on the system
///
/// This function executes the `jupyter lab --version` command to determine
/// if JupyterLab is available in the system PATH.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for executing shell commands
///
/// # Returns
/// A `Result` containing:
/// - `Ok(true)` if JupyterLab is installed and accessible
/// - `Ok(false)` if JupyterLab is not found or command fails
/// - `Err(String)` if the shell command cannot be executed
#[tauri::command]
#[specta::specta]
pub async fn is_jupyter_lab_installed(app_handle: tauri::AppHandle) -> Result<bool, String> {
    // Method 1: Try jupyter lab --version
    let jupyter_lab_check = app_handle
        .shell()
        .command("jupyter-lab")
        .arg("--version")
        .envs(setup_jupyter_env())
        .output()
        .await;

    if let Ok(output) = jupyter_lab_check {
        if output.status.success() {
            return Ok(true);
        }
    }

    Ok(true)
}

/// Installs JupyterLab using pip
///
/// This function executes the `pip install jupyterlab jupyter ipywidgets` command
/// to install JupyterLab and its dependencies on the system. The installation
/// process is streamed and emits events to the frontend for real-time progress updates.
///
/// # Arguments
/// * `app_handle` - The Tauri application handle for executing shell commands and emitting events
///
/// # Returns
/// A `Result` containing:
/// - `Ok(())` if JupyterLab is installed successfully
/// - `Err(String)` if the installation fails, containing the error message
///
/// # Errors
/// Returns an error if:
/// - The pip command cannot be executed (pip not found in PATH)
/// - The installation process fails (e.g., network issues, permission problems)
/// - JupyterLab package cannot be found or installed
/// - Insufficient disk space or system resources
#[tauri::command]
#[specta::specta]
pub async fn install_jupyter_lab(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Emit initial status
    app_handle
        .emit(
            "jupyter-install",
            JupyterInstallOutput {
                status: JupyterInstallStatus::Output,
                output: "Starting JupyterLab installation with python3 -m pip...".to_string(),
            },
        )
        .ok();

    let (mut rx, _child) = app_handle
        .shell()
        .command("python")
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("jupyterlab")
        .arg("jupyter")
        .arg("ipywidgets")
        .arg("--break-system-packages")
        .arg("--user")
        .envs(setup_jupyter_env())
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
        .envs(setup_jupyter_env())
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

fn push_if_exists(list: &mut Vec<PathBuf>, p: PathBuf) {
    if p.exists() {
        list.push(p);
    }
}

fn setup_jupyter_env() -> Vec<(&'static str, String)> {
    let current_path = std::env::var("PATH").unwrap_or_default();

    #[cfg(target_os = "windows")]
    {
        let mut cands: Vec<PathBuf> = Vec::new();
        let mut seen: HashSet<String> = HashSet::new();

        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("C:\\"));
        let userprofile = std::env::var("USERPROFILE")
            .ok()
            .map(PathBuf::from)
            .unwrap_or_else(|| home.clone());

        // 1) User Conda
        for root in ["anaconda3", "miniconda3"] {
            let base = userprofile.join(root);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.clone());
        }

        // 2) User pip/pipx style scripts
        // pip user scripts (python.org per-user) sometimes land here:
        push_if_exists(
            &mut cands,
            userprofile
                .join("AppData")
                .join("Roaming")
                .join("Python")
                .join("Scripts"),
        );
        // pipx default (varies, this covers common case)
        push_if_exists(&mut cands, userprofile.join(".local").join("bin"));

        // 3) python.org per-user installs
        if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
            let lad = PathBuf::from(local_appdata);
            for vers in ["Python313", "Python312", "Python311"] {
                let base = lad.join("Programs").join("Python").join(vers);
                push_if_exists(&mut cands, base.join("Scripts"));
                push_if_exists(&mut cands, base.clone());
            }
        }

        // 4) ProgramData Anaconda (machine-wide)
        for base in ["C:\\ProgramData\\Anaconda3"] {
            let base = PathBuf::from(base);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.clone());
        }

        // 5) Global python.org installs
        for base in ["C:\\Python313", "C:\\Python312", "C:\\Python311"] {
            let base = PathBuf::from(base);
            push_if_exists(&mut cands, base.join("Scripts"));
            push_if_exists(&mut cands, base.clone());
        }

        // 6) System
        for sys in ["C:\\Windows\\System32", "C:\\Windows"] {
            push_if_exists(&mut cands, PathBuf::from(sys));
        }

        // Dedup preserving order
        let mut dedup: Vec<String> = Vec::new();
        for p in cands {
            let s = p.to_string_lossy().to_string();
            if seen.insert(s.clone()) {
                dedup.push(s);
            }
        }

        // Build final PATH
        let joined = if current_path.is_empty() {
            dedup.join(";")
        } else if dedup.is_empty() {
            current_path
        } else {
            format!("{};{}", dedup.join(";"), current_path)
        };

        return vec![("PATH", joined)];
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::collections::HashSet;

        let mut cands: Vec<PathBuf> = Vec::new();
        let mut seen: HashSet<String> = HashSet::new();

        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"));

        // 1) User Conda (highest priority)
        for root in ["anaconda3", "miniconda3"] {
            let base = home.join(root);
            push_if_exists(&mut cands, base.join("condabin"));
            push_if_exists(&mut cands, base.join("bin"));
            push_if_exists(&mut cands, base.clone());
        }

        // 2) pipx / user-local bin
        push_if_exists(&mut cands, home.join(".local").join("bin"));

        // 3) Homebrew
        push_if_exists(&mut cands, PathBuf::from("/opt/homebrew/bin")); // Apple Silicon
        push_if_exists(&mut cands, PathBuf::from("/opt/homebrew/sbin"));
        push_if_exists(&mut cands, PathBuf::from("/usr/local/bin")); // Intel / older
        push_if_exists(&mut cands, PathBuf::from("/usr/local/sbin"));

        // 4) Python.org Frameworks
        for v in ["3.13", "3.12", "3.11"] {
            push_if_exists(
                &mut cands,
                PathBuf::from(format!(
                    "/Library/Frameworks/Python.framework/Versions/{v}/bin"
                )),
            );
        }

        // 5) System bins
        push_if_exists(&mut cands, PathBuf::from("/usr/bin"));
        push_if_exists(&mut cands, PathBuf::from("/bin"));

        // Dedup preserving order
        let mut dedup: Vec<String> = Vec::new();
        for p in cands {
            let s = p.to_string_lossy().to_string();
            if seen.insert(s.clone()) {
                dedup.push(s);
            }
        }

        // Build final PATH
        let joined = if current_path.is_empty() {
            dedup.join(":")
        } else if dedup.is_empty() {
            current_path
        } else {
            format!("{}:{}", dedup.join(":"), current_path)
        };

        vec![("PATH", joined)]
    }
}

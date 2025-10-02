use enzymeml::prelude::{EnzymeMLDocument, EnzymeMLDocumentBuilder, Parameter};
use regex::Regex;
use std::sync::{Arc, Mutex};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct EnzymeMLState {
    pub title: Mutex<String>,
    pub doc: Mutex<EnzymeMLDocument>,
    pub id: Mutex<Option<i32>>,
    pub param_buffer: Mutex<Vec<Parameter>>,
}

impl Default for EnzymeMLState {
    fn default() -> Self {
        EnzymeMLState {
            title: Mutex::new("Document Title".to_string()),
            doc: Mutex::new(
                EnzymeMLDocumentBuilder::default()
                    .name("Document Title")
                    .build()
                    .unwrap(),
            ),
            id: Mutex::new(None),
            param_buffer: Mutex::new(Vec::new()),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ExposedEnzymeMLState {
    pub title: String,
    pub doc: EnzymeMLDocument,
    pub id: Option<i32>,
}

impl From<&Arc<EnzymeMLState>> for ExposedEnzymeMLState {
    fn from(state: &Arc<EnzymeMLState>) -> Self {
        let title = state.title.lock().unwrap();
        let doc = state.doc.lock().unwrap();
        let id = state.id.lock().unwrap();

        ExposedEnzymeMLState {
            title: title.clone(),
            doc: doc.clone(),
            id: *id,
        }
    }
}
/// Represents a detected Python installation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct PythonInstallation {
    /// Path to the Python executable
    pub path: String,
    /// Version string (e.g., "3.11.5")
    pub version: String,
    /// Source/type of installation (e.g., "anaconda", "homebrew", "system")
    pub source: String,
    /// Priority rank (lower is better: anaconda=1, homebrew=2, others=3)
    pub priority: u8,
    /// Is a custom python installation
    pub is_custom: bool,
}

/// State management for Jupyter Lab sessions
///
/// This struct maintains a thread-safe collection of active Jupyter Lab sessions
/// that can be accessed and modified from multiple threads.
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct JupyterState {
    /// Thread-safe vector of active Jupyter sessions
    pub sessions: Mutex<Vec<JupyterSession>>,
    /// Thread-safe vector of detected Python installations
    pub detected_pythons: Mutex<Vec<PythonInstallation>>,
    /// Thread-safe path to the selected/preferred Python executable
    pub selected_python_path: Mutex<Option<String>>,
}

/// Represents an active Jupyter Lab session
///
/// Contains the necessary information to identify and connect to a running
/// Jupyter Lab instance, including its unique ID, URL, and port number.
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct JupyterSession {
    /// Unique identifier for the Jupyter session
    pub id: String,
    /// URL where the Jupyter Lab instance is accessible
    pub url: String,
    /// Port number on which the Jupyter Lab instance is running
    pub port: u16,
    /// Live, in-memory handle to the spawned child process.
    ///
    /// **Important**: this is intentionally `Option<CommandChild>` and is kept
    /// inside the session so the OS handle remains alive while the app runs.
    /// This field is not clonable/serializable and therefore is not exposed
    /// via the `get_sessions` / `get_session` helpers below.
    #[serde(skip)]
    pub child: Option<tauri_plugin_shell::process::CommandChild>,
}

impl JupyterState {
    // Regex string for the Jupyter Lab URL
    pub const JUPYTER_LAB_URL_REGEX: &str = r"http://localhost:(\d+)/lab\?token=([a-f0-9]+)";

    /// Regex string for the Jupyter Lab URL
    ///
    /// # Arguments
    /// * `stdout` - The stdout of the Jupyter Lab process
    ///
    /// # Returns
    /// The URL of the Jupyter Lab instance if it is found, None otherwise
    pub fn get_url_from_stdout(&self, stdout: &str) -> Option<String> {
        Regex::new(Self::JUPYTER_LAB_URL_REGEX)
            .unwrap()
            .captures(stdout)
            .map(|caps| caps[0].to_string())
    }

    /// Adds a new Jupyter session to the state
    ///
    /// # Arguments
    /// * `session` - The JupyterSession to add to the collection
    ///
    /// # Panics
    /// Panics if the mutex is poisoned (should not happen in normal operation)
    pub fn add_session(&self, session: JupyterSession) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.push(session);
    }

    /// Convenience: create and insert a serializable session with its live child.
    ///
    /// This atomically stores the `CommandChild` inside the session so the
    /// handle is never dropped between spawn and insertion. Call this immediately
    /// after `spawn()`.
    pub fn add_session_with_child(
        &self,
        id: String,
        url: String,
        port: u16,
        child: tauri_plugin_shell::process::CommandChild,
    ) {
        let session = JupyterSession {
            id,
            url,
            port,
            child: Some(child),
        };
        let mut sessions = self.sessions.lock().unwrap();
        sessions.push(session);
    }

    /// Retrieves all active Jupyter sessions
    ///
    /// # Returns
    /// A vector containing clones of serializable session info for UI/IPC.
    ///
    /// # Panics
    /// Panics if the mutex is poisoned (should not happen in normal operation)
    ///
    /// Note: this returns a lightweight, clonable `JupyterSessionInfo` that
    /// omits the non-serializable `child` handle.
    pub fn get_sessions(&self) -> Vec<JupyterSessionInfo> {
        let sessions = self.sessions.lock().unwrap();
        sessions
            .iter()
            .map(|s| JupyterSessionInfo {
                id: s.id.clone(),
                url: s.url.clone(),
                port: s.port,
            })
            .collect()
    }

    /// Finds a Jupyter session by its URL
    ///
    /// # Arguments
    /// * `url` - The URL to search for among active sessions
    ///
    /// # Returns
    /// Some(JupyterSessionInfo) if a session with the given URL is found, None otherwise
    ///
    /// # Panics
    /// Panics if the mutex is poisoned (should not happen in normal operation)
    pub fn get_session(&self, url: String) -> Option<JupyterSessionInfo> {
        let sessions = self.sessions.lock().unwrap();
        sessions
            .iter()
            .find(|session| session.url == url)
            .map(|s| JupyterSessionInfo {
                id: s.id.clone(),
                url: s.url.clone(),
                port: s.port,
            })
    }

    // ----------------------------------------------------------------
    // Child-control helpers (operate on the child stored inside the session)
    // ----------------------------------------------------------------

    /// Take ownership of the live child handle stored inside the session.
    ///
    /// Useful for killing the process or otherwise manipulating the child.
    /// Returns the taken `CommandChild` if there was one.
    pub fn take_child_from_session(
        &self,
        id: &str,
    ) -> Option<tauri_plugin_shell::process::CommandChild> {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(pos) = sessions.iter().position(|s| s.id == id) {
            sessions[pos].child.take()
        } else {
            None
        }
    }

    /// Kill the live child process for the given session id (best-effort).
    ///
    /// Returns Ok(()) if we attempted to kill the process, Err if no child was found
    /// or if `kill()` returned an error.
    pub fn kill_child(&self, id: &str) -> Result<(), String> {
        if let Some(mut session) = self.remove_session_by_id(id) {
            if let Some(child) = session.child.take() {
                child
                    .kill()
                    .map_err(|e| format!("failed to kill child for {}: {e}", id))?;
            }
            Ok(())
        } else {
            Err(format!("no session found for id {}", id))
        }
    }

    /// Remove a session by id and return its serializable info.
    ///
    /// If there is a live child handle it is **taken** out and returned inside
    /// the removed session (so the caller can decide what to do with it).
    pub fn remove_session_by_id(&self, id: &str) -> Option<JupyterSession> {
        let mut sessions = self.sessions.lock().unwrap();
        sessions
            .iter()
            .position(|s| s.id == id)
            .map(|pos| sessions.remove(pos))
    }
}

/// Lightweight, serializable view of a session (omits the live child handle).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct JupyterSessionInfo {
    pub id: String,
    pub url: String,
    pub port: u16,
}

impl JupyterSession {
    /// Creates a new JupyterSession with the given ID, URL, and port
    ///
    /// # Arguments
    /// * `id` - The unique identifier for the Jupyter session
    /// * `url` - The URL where the Jupyter Lab instance is accessible
    /// * `port` - The port number on which the Jupyter Lab instance is running
    pub fn new(id: String, url: String, port: u16) -> Self {
        JupyterSession {
            id,
            url,
            port,
            child: None,
        }
    }
}

impl Default for JupyterState {
    /// Creates a new JupyterState with an empty session collection
    ///
    /// # Returns
    /// A new JupyterState instance with no active sessions
    fn default() -> Self {
        JupyterState {
            sessions: Mutex::new(Vec::new()),
            detected_pythons: Mutex::new(Vec::new()),
            selected_python_path: Mutex::new(None),
        }
    }
}

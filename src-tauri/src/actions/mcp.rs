//! MCP (Model Context Protocol) client registration actions
//!
//! This module provides Tauri commands for registering the EnzymeML MCP server
//! with various AI clients that support the Model Context Protocol.

use crate::mcp::get_mcp_path;
use serde::{Deserialize, Serialize};
use specta;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

/// Event payload for MCP installation progress updates
#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub struct McpInstallOutput {
    pub status: McpInstallStatus,
    pub output: String,
}

/// Status enum for MCP installation events
#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub enum McpInstallStatus {
    Success,
    Error,
    Output,
}

/// Event payload for MCP registration progress updates
#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub struct McpRegisterOutput {
    pub status: McpRegisterStatus,
    pub output: String,
}

/// Status enum for MCP registration events
#[derive(Debug, serde::Serialize, serde::Deserialize, specta::Type, tauri_specta::Event, Clone)]
pub enum McpRegisterStatus {
    Success,
    Error,
    Output,
}

/// Checks if the MCP server binary is installed on the system
///
/// This command checks whether the MCP server binary exists at the expected
/// installation path in the user's configuration directory.
///
/// # Returns
/// * `Ok(true)` if the binary is installed
/// * `Ok(false)` if the binary is not installed
/// * `Err(String)` if there was an error checking the installation
#[tauri::command]
#[specta::specta]
pub fn is_mcp_binary_installed() -> Result<bool, String> {
    let mcp_path = get_mcp_path();
    Ok(mcp_path.exists())
}

/// Checks if the EnzymeML MCP server is already registered with the specified AI client
///
/// This command checks whether the EnzymeML MCP server is already configured
/// in the specified AI client's MCP configuration file.
///
/// # Arguments
/// * `client_type` - The type of AI client to check (Claude Desktop or Cursor)
///
/// # Returns
/// * `Ok(true)` if the EnzymeML server is already registered
/// * `Ok(false)` if the EnzymeML server is not registered or config doesn't exist
/// * `Err(String)` if there was an error reading the configuration
#[tauri::command]
#[specta::specta]
pub fn is_mcp_registered(client_type: ClientType) -> Result<bool, String> {
    let path = client_type.get_path();

    // If config file doesn't exist, EnzymeML is not registered
    if !path.exists() {
        return Ok(false);
    }

    // Read and parse existing config
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read configuration: {}", e))?;

    let registration: MCPRegistration = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse configuration: {}", e))?;

    // Check if EnzymeMLSuite is registered
    Ok(registration.mcp_servers.contains_key("EnzymeMLSuite"))
}

/// Registers the EnzymeML MCP server with the specified AI client
///
/// This command registers the EnzymeML MCP server binary with AI clients like
/// Claude Desktop or Cursor, enabling them to interact with EnzymeML documents
/// and data through the Model Context Protocol.
///
/// The function reads the client's existing MCP configuration, adds the EnzymeML
/// server to it, and writes the updated configuration back to the client's
/// configuration file.
///
/// # Arguments
/// * `client_type` - The type of AI client to register with (Claude Desktop or Cursor)
///
/// # Returns
/// * `Ok(())` if the registration was successful
/// * `Err(String)` if there was an error during registration
///
/// # Errors
/// * Returns error if the client configuration directory cannot be created
/// * Returns error if the existing configuration cannot be read or parsed
/// * Returns error if the updated configuration cannot be written
#[tauri::command]
#[specta::specta]
pub fn register_mcp(app: AppHandle, client_type: ClientType) -> Result<(), String> {
    let path = client_type.get_path();
    let mcp_path = get_mcp_path();

    // For Claude Desktop, require its config directory to already exist
    // (i.e., Claude has been launched at least once).
    if matches!(&client_type, ClientType::ClaudeDesktop) {
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                let error_msg = "Claude Desktop config directory not found. Please ensure Claude Desktop is installed and has been run at least once to initialize its config.".to_string();
                app.emit(
                    "mcp-register-output",
                    McpRegisterOutput {
                        status: McpRegisterStatus::Error,
                        output: error_msg.clone(),
                    },
                )
                .ok();
                return Err(error_msg);
            }
        }
    }

    // Create parent directory if it doesn't exist (for non-Claude clients)
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| {
                let error_msg = format!("Failed to create directory: {}", e);
                app.emit(
                    "mcp-register-output",
                    McpRegisterOutput {
                        status: McpRegisterStatus::Error,
                        output: error_msg.clone(),
                    },
                )
                .ok();
                error_msg
            })?;
        }
    }

    // Read existing config or create empty one
    let mut registration: MCPRegistration = if path.exists() {
        let content = std::fs::read_to_string(&path).map_err(|e| {
            let error_msg = format!("Failed to read configuration: {}", e);
            app.emit(
                "mcp-register-output",
                McpRegisterOutput {
                    status: McpRegisterStatus::Error,
                    output: error_msg.clone(),
                },
            )
            .ok();
            error_msg
        })?;
        serde_json::from_str(&content).map_err(|e| {
            let error_msg = format!("Failed to parse configuration: {}", e);
            app.emit(
                "mcp-register-output",
                McpRegisterOutput {
                    status: McpRegisterStatus::Error,
                    output: error_msg.clone(),
                },
            )
            .ok();
            error_msg
        })?
    } else {
        MCPRegistration {
            mcp_servers: HashMap::new(),
        }
    };

    // Add the new tool
    registration.mcp_servers.insert(
        "EnzymeMLSuite".to_string(),
        MCPTool {
            command: mcp_path.display().to_string(),
            args: vec![],
            env: HashMap::new(),
        },
    );

    // Write the updated registration
    std::fs::write(
        &path,
        serde_json::to_string_pretty(&registration).map_err(|e| {
            let error_msg = format!("Failed to write configuration: {}", e);
            app.emit(
                "mcp-register-output",
                McpRegisterOutput {
                    status: McpRegisterStatus::Error,
                    output: error_msg.clone(),
                },
            )
            .ok();
            error_msg
        })?,
    )
    .map_err(|e| {
        let error_msg = format!("Failed to write file: {}", e);
        app.emit(
            "mcp-register-output",
            McpRegisterOutput {
                status: McpRegisterStatus::Error,
                output: error_msg.clone(),
            },
        )
        .ok();
        error_msg
    })?;

    let success_msg = format!(
        "MCP server registered successfully with {}",
        format_client_name(&client_type)
    );
    app.emit(
        "mcp-register-output",
        McpRegisterOutput {
            status: McpRegisterStatus::Success,
            output: success_msg.clone(),
        },
    )
    .ok();

    Ok(())
}

/// Helper function to format client type name for display
fn format_client_name(client_type: &ClientType) -> String {
    match client_type {
        ClientType::ClaudeDesktop => "Claude Desktop",
        ClientType::Cursor => "Cursor",
    }
    .to_string()
}

/// Represents the structure of an MCP client configuration file
///
/// This struct defines the JSON structure used by MCP clients to store
/// their server registrations. The `mcpServers` field contains a map
/// of server names to their configuration details.
#[derive(Serialize, Deserialize)]
pub(crate) struct MCPRegistration {
    /// Map of MCP server names to their configuration
    #[serde(rename = "mcpServers")]
    pub(crate) mcp_servers: HashMap<String, MCPTool>,
}

/// Configuration details for an individual MCP server
///
/// This struct represents the configuration needed to run an MCP server,
/// including the command to execute, command-line arguments, and environment
/// variables.
#[derive(Serialize, Deserialize)]
pub(crate) struct MCPTool {
    /// The command/path to the MCP server executable
    command: String,
    /// Command-line arguments to pass to the server (defaults to empty)
    #[serde(default)]
    args: Vec<String>,
    /// Environment variables to set when running the server (defaults to empty)
    #[serde(default)]
    env: HashMap<String, String>,
}

/// Supported AI client types for MCP server registration
///
/// This enum represents the different AI clients that support the Model Context
/// Protocol and can be configured to use the EnzymeML MCP server.
#[derive(Debug, Serialize, Deserialize, specta::Type, Clone)]
pub enum ClientType {
    /// Anthropic's Claude Desktop application
    ClaudeDesktop,
    /// Cursor AI code editor
    Cursor,
}

impl ClientType {
    /// Returns the configuration file path for the specified client type
    ///
    /// Each AI client stores its MCP configuration in a different location
    /// depending on the operating system. This method returns the appropriate
    /// path for the client's configuration file.
    ///
    /// # Returns
    /// * `PathBuf` - The path to the client's MCP configuration file
    ///
    /// # Platform-specific behavior
    /// * **macOS**: Uses `~/Library/Application Support/` for Claude, `~/.cursor/` for Cursor
    /// * **Windows**: Uses `%APPDATA%/Claude/` for Claude, `%USERPROFILE%/.cursor/` for Cursor  
    /// * **Linux**: Uses `~/.config/Claude/` for Claude, `~/.cursor/` for Cursor
    pub fn get_path(&self) -> PathBuf {
        #[cfg(target_os = "macos")]
        {
            match self {
                ClientType::ClaudeDesktop => dirs::home_dir()
                    .unwrap()
                    .join("Library/Application Support/Claude/claude_desktop_config.json"),
                ClientType::Cursor => dirs::home_dir().unwrap().join(".cursor/mcp.json"),
            }
        }

        #[cfg(target_os = "windows")]
        {
            match self {
                ClientType::ClaudeDesktop => {
                    // Try %USERPROFILE%\AppData\Claude\claude_desktop_config.json first
                    let primary_path = dirs::home_dir()
                        .unwrap()
                        .join("AppData/Claude/claude_desktop_config.json");

                    if primary_path.exists() {
                        primary_path
                    } else {
                        // Fallback to %USERPROFILE%\AppData\Roaming\Claude\claude_desktop_config.json
                        dirs::home_dir()
                            .unwrap()
                            .join("AppData/Roaming/Claude/claude_desktop_config.json")
                    }
                }
                ClientType::Cursor => {
                    // %USERPROFILE%\.cursor\mcp.json
                    dirs::home_dir().unwrap().join(".cursor/mcp.json")
                }
            }
        }

        #[cfg(target_os = "linux")]
        {
            match self {
                ClientType::ClaudeDesktop => {
                    // $XDG_CONFIG_HOME/Claude/claude_desktop_config.json
                    // fallback: ~/.config/Claude/claude_desktop_config.json
                    std::env::var_os("XDG_CONFIG_HOME")
                        .map(PathBuf::from)
                        .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
                        .join("Claude/claude_desktop_config.json")
                }
                ClientType::Cursor => dirs::home_dir().unwrap().join(".cursor/mcp.json"),
            }
        }
    }
}

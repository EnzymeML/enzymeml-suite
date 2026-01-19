use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_store::StoreExt;

use crate::actions::mcp::{McpInstallOutput, McpInstallStatus};
use crate::mcp;

/// Installs the MCP server binary to the user's configuration directory
///
/// This command allows the user to manually trigger the installation of the MCP server
/// binary, which enables Claude integration. The binary is copied from the application's
/// resources to the user's config directory and made executable.
///
/// # Arguments
/// * `app` - The Tauri application handle used to access resource paths
///
/// # Returns
/// Result containing either a success message with the installation path or an error message
#[tauri::command]
#[specta::specta]
pub fn install_mcp_server(app: AppHandle) -> Result<String, String> {
    // Emit initial status
    app.emit(
        "mcp-install-output",
        McpInstallOutput {
            status: McpInstallStatus::Output,
            output: "Starting MCP server installation...".to_string(),
        },
    )
    .ok();

    app.emit(
        "mcp-install-output",
        McpInstallOutput {
            status: McpInstallStatus::Output,
            output: "Resolving resource path...".to_string(),
        },
    )
    .ok();

    let resource_path = app
        .path()
        .resolve("mcp", tauri::path::BaseDirectory::Resource)
        .map_err(|e| {
            let error_msg = format!("Failed to resolve resource path: {}", e);
            app.emit(
                "mcp-install-output",
                McpInstallOutput {
                    status: McpInstallStatus::Error,
                    output: error_msg.clone(),
                },
            )
            .ok();
            error_msg
        })?;

    app.emit(
        "mcp-install-output",
        McpInstallOutput {
            status: McpInstallStatus::Output,
            output: format!("Resource path: {}", resource_path.display()),
        },
    )
    .ok();

    app.emit(
        "mcp-install-output",
        McpInstallOutput {
            status: McpInstallStatus::Output,
            output: "Copying MCP server binary...".to_string(),
        },
    )
    .ok();

    mcp::install(resource_path).map_err(|e| {
        let error_msg = format!("Failed to install MCP server: {}", e);
        app.emit(
            "mcp-install-output",
            McpInstallOutput {
                status: McpInstallStatus::Error,
                output: error_msg.clone(),
            },
        )
        .ok();
        error_msg
    })?;

    let mcp_path = mcp::get_mcp_path();
    let success_msg = format!(
        "MCP server installed successfully at: {}",
        mcp_path.display()
    );

    app.emit(
        "mcp-install-output",
        McpInstallOutput {
            status: McpInstallStatus::Success,
            output: success_msg.clone(),
        },
    )
    .ok();

    Ok(success_msg)
}

/// Retrieves the stored OpenAI API token from the secure store
///
/// This command fetches the OpenAI API token that was previously saved by the user.
/// The token is stored securely using Tauri's store plugin.
///
/// # Arguments
/// * `app` - The Tauri application handle used to access the store
///
/// # Returns
/// Result containing either the token string (or empty string if not set) or an error message
#[tauri::command]
#[specta::specta]
pub fn get_openai_token(app: AppHandle) -> Result<String, String> {
    let store_path = crate::actions::utils::get_config_store_path()
        .map_err(|e| format!("Failed to get config store path: {}", e))?;

    let store = app
        .store(store_path)
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let token = store
        .get("openai_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or("".to_string())
        .to_string();

    Ok(token)
}

/// Saves the OpenAI API token to the secure store
///
/// This command stores the OpenAI API token securely using Tauri's store plugin.
/// The token will be persisted across application sessions.
///
/// # Arguments
/// * `app` - The Tauri application handle used to access the store
/// * `token` - The OpenAI API token to store
///
/// # Returns
/// Result containing either a success message or an error message
#[tauri::command]
#[specta::specta]
pub fn set_openai_token(app: AppHandle, token: String) -> Result<String, String> {
    let store_path = crate::actions::utils::get_config_store_path()
        .map_err(|e| format!("Failed to get config store path: {}", e))?;

    let store = app
        .store(store_path)
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("openai_token", serde_json::json!(token));

    store
        .save()
        .map_err(|e| format!("Failed to persist store: {}", e))?;

    Ok("Token saved successfully".to_string())
}

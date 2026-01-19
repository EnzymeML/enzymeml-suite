//! MCP (Model Context Protocol) server management module for the EnzymeML application
//!
//! This module handles the installation and management of the EnzymeML MCP server binary.
//! The MCP server enables integration with AI assistants and other tools that support
//! the Model Context Protocol, allowing them to interact with EnzymeML documents and data.

use sha2::{Digest, Sha256};
use std::fs::Permissions;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;

const APPLE_SILICON_MCP: &str = "enzymeml-mcp-aarch64-apple-darwin/enzymeml-mcp";
const APPLE_INTEL_MCP: &str = "enzymeml-mcp-x86_64-apple-darwin/enzymeml-mcp";
const WINDOWS_MCP: &str = "enzymeml-mcp-x86_64-pc-windows-msvc/enzymeml-mcp.exe";
const LINUX_AARCH64_MCP: &str = "enzymeml-mcp-aarch64-unknown-linux-gnu/enzymeml-mcp";
const LINUX_AMD64_MCP: &str = "enzymeml-mcp-x86_64-unknown-linux-gnu/enzymeml-mcp";

/// Computes the SHA-256 hash of a file.
///
/// # Arguments
/// * `path` - The path to the file to hash
///
/// # Returns
/// * `Ok([u8; 32])` - The SHA-256 hash as a byte array
/// * `Err(String)` - An error message if the file could not be read or hashed
fn compute_file_hash(path: &PathBuf) -> Result<[u8; 32], String> {
    let contents = std::fs::read(path).map_err(|e| format!("Failed to read file: {}", e))?;
    let mut hasher = Sha256::new();
    hasher.update(&contents);
    let hash = hasher.finalize();
    Ok(hash.into())
}

/// Installs the MCP server by copying the appropriate binary from resources
/// to the user's configuration directory and making it executable.
///
/// This function ensures that the MCP server binary is available for use by
/// external tools and AI assistants that support the Model Context Protocol.
/// If the binary already exists, it verifies the hash matches the resource binary.
/// If the hashes differ, it overwrites the existing binary with the resource version.
///
/// # Arguments
/// * `resource_path` - The path to the application's resource directory containing MCP binaries
///
/// # Returns
/// * `Ok(())` if the MCP server was successfully installed
/// * `Err(String)` if there was an error during installation
///
/// # Panics
/// * If the MCP binary does not exist in the resources directory
pub fn install(resource_path: PathBuf) -> Result<(), String> {
    let mcp_path = get_mcp_path();
    let resource_path = resource_path.join(resource_mcp_name());

    if !resource_path.exists() {
        // This should never happen, but if it does, panic
        panic!("MCP binary does not exist in resources");
    }

    if mcp_path.exists() {
        // MCP binary already exists, check if hash matches
        let existing_hash = compute_file_hash(&mcp_path)?;
        let resource_hash = compute_file_hash(&resource_path)?;

        if existing_hash == resource_hash {
            // Hashes match, no action needed
            return Ok(());
        }
    }

    // Copy the MCP binary to the MCP path and make it executable
    std::fs::copy(&resource_path, &mcp_path).map_err(|e| e.to_string())?;
    std::fs::set_permissions(&mcp_path, Permissions::from_mode(0o755))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Returns the appropriate MCP binary filename for the current target operating system.
///
/// # Returns
/// * `String` - The filename of the MCP binary for the current OS
///
/// # Panics
/// * If the target OS is not supported (not Windows, Linux, or macOS)
fn resource_mcp_name() -> String {
    if cfg!(target_os = "windows") {
        WINDOWS_MCP.to_string()
    } else if cfg!(target_os = "linux") {
        if cfg!(target_arch = "aarch64") {
            LINUX_AARCH64_MCP.to_string()
        } else {
            LINUX_AMD64_MCP.to_string()
        }
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            APPLE_SILICON_MCP.to_string()
        } else {
            APPLE_INTEL_MCP.to_string()
        }
    } else {
        panic!("Unsupported target OS");
    }
}

/// Gets the path where the MCP server binary should be installed.
///
/// The MCP binary is installed in the user's configuration directory under
/// `.config/enzymeml/enzymeml-mcp` to ensure it's accessible to external tools.
///
/// # Returns
/// * `PathBuf` - The full path where the MCP binary should be located
///
/// # Panics
/// * If the home directory cannot be determined
pub(crate) fn get_mcp_path() -> PathBuf {
    let home_dir = dirs::home_dir().unwrap();
    home_dir
        .join(".config")
        .join("enzymeml")
        .join("enzymeml-mcp")
}

use std::path::PathBuf;

/// Default SUITE directory name
const SUITE_DIR: &str = "enzymeml-suite";
/// Config store filename
const CONFIG_STORE: &str = "config.json";

/// Gets the path to the EnzymeML Suite configuration store
///
/// This function constructs the path to the config.json file used for
/// persistent storage of application settings. The path is:
/// `~/enzymeml-suite/config.json`
///
/// # Returns
///
/// A `Result` containing:
/// - `Ok(PathBuf)` with the full path to the config store
/// - `Err(String)` if the home directory cannot be determined
pub fn get_config_store_path() -> Result<PathBuf, String> {
    dirs::home_dir()
        .ok_or_else(|| "Failed to get home directory".to_string())
        .map(|home| home.join(SUITE_DIR).join(CONFIG_STORE))
}

/// Generates a unique identifier with a given prefix.
///
/// This function takes a vector of existing IDs and a prefix string, and generates
/// a new unique ID by appending an incrementing number to the prefix if necessary.
///
/// # Arguments
///
/// * `ids` - A reference to a vector of existing IDs.
/// * `prefix` - A string slice that holds the prefix for the new ID.
///
/// # Returns
///
/// A `String` representing the new unique ID.
#[allow(clippy::ptr_arg)]
pub fn generate_id(ids: &Vec<String>, prefix: &str) -> String {
    let mut i = 1;
    let mut id = format!("{}{}", prefix, i);
    while ids.contains(&id) {
        id = format!("{}{}", prefix, i);
        i += 1;
    }
    id
}

use enzymeml::prelude::UnitDefinition;
use std::collections::HashMap;

use crate::unit::{UnitDefinitions, UnitType};

/// Retrieves all unit definitions for a specific unit type
///
/// # Arguments
/// * `unit_type` - The type of units to retrieve (e.g., concentration, time, volume)
///
/// # Returns
/// Result containing a HashMap of unit names to UnitDefinition objects, or an error string
#[tauri::command]
pub fn get_unit_group(unit_type: UnitType) -> Result<HashMap<String, UnitDefinition>, String> {
    UnitDefinitions::get_units(unit_type).map_err(|e| e.to_string())
}

/// Retrieves unit definitions for multiple unit types
///
/// # Arguments
/// * `unit_types` - Vector of unit types to retrieve units for
///
/// # Returns
/// Result containing a combined HashMap of all unit names to UnitDefinition objects, or an error string
#[tauri::command]
pub fn get_unit_groups(
    unit_types: Vec<UnitType>,
) -> Result<HashMap<String, UnitDefinition>, String> {
    let mut units = HashMap::new();
    for unit_type in unit_types {
        let unit_group = UnitDefinitions::get_units(unit_type).map_err(|e| e.to_string())?;
        units.extend(unit_group);
    }
    Ok(units)
}

/// Retrieves a specific unit definition by its name
///
/// # Arguments
/// * `unit` - The name of the unit to retrieve
///
/// # Returns
/// Result containing the UnitDefinition object or an error string if not found
#[tauri::command]
pub fn get_unit(unit: String) -> Result<UnitDefinition, String> {
    UnitDefinitions::get_unit(&unit).map_err(|e| e.to_string())
}

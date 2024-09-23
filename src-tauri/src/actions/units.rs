use enzymeml::enzyme_ml::UnitDefinition;
use std::collections::HashMap;

use crate::unit::{UnitDefinitions, UnitType};

#[tauri::command]
pub fn get_unit_group(unit_type: UnitType) -> Result<HashMap<String, UnitDefinition>, String> {
    UnitDefinitions::get_units(unit_type).map_err(|e| e.to_string())
}

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

#[tauri::command]
pub fn get_unit(unit: String) -> Result<UnitDefinition, String> {
    UnitDefinitions::get_unit(&unit).map_err(|e| e.to_string())
}

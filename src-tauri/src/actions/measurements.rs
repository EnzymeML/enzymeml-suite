use std::collections::HashMap;
use std::sync::Arc;

use enzymeml_rs::prelude::{Measurement, MeasurementBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_event, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn create_measurement(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> String {
    let id = create_object!(state.doc, measurements, MeasurementBuilder, "m", id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_measurements");

    id
}

#[tauri::command]
pub fn update_measurement(
    state: State<Arc<EnzymeMLState>>,
    data: Measurement,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, measurements, data, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, &id);

    Ok(())
}

#[tauri::command]
pub fn list_measurements(state: State<Arc<EnzymeMLState>>) -> Vec<(String, String)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .measurements
        .iter()
        .map(|s| (s.id.clone(), s.name.clone()))
        .collect()
}

#[tauri::command]
pub fn get_measurement(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Measurement, String> {
    get_object!(state.doc, measurements, id, id)
}

#[tauri::command]
pub fn get_measurement_hashmap(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<HashMap<String, Vec<f32>>, String> {
    let meas: Measurement = get_object!(state.doc, measurements, id, id)?;
    let mut times = vec![];

    for data in &meas.species_data {
        if !data.time.is_empty() {
            times.push(&data.time);
        }
    }

    time_arrays_are_same(&times)?;

    let mut measurements_map: HashMap<String, Vec<f32>> = HashMap::new();
    measurements_map.insert("time".to_string(), times[0].clone());

    for species_data in meas.species_data.clone() {
        if !species_data.data.is_empty() {
            measurements_map.insert(species_data.species_id, species_data.data);
        }
    }

    Ok(measurements_map)
}

fn time_arrays_are_same(times: &[&Vec<f32>]) -> Result<(), String> {
    if times.is_empty() {
        return Err("No time vectors found".to_string());
    } else {
        let first_time = &times[0];
        for time in times.iter() {
            if time != first_time {
                return Err("Time vectors are not the same".to_string());
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn delete_measurement(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, measurements, id, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_measurements");
    update_event!(app_handle, "update_vis");

    Ok(())
}

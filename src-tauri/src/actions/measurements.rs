use std::sync::Arc;

use enzymeml::prelude::{DataTypes, Measurement, MeasurementBuilder, MeasurementDataBuilder};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

use crate::actions::enzmldoc::get_species_name;
use crate::actions::identifiers::MEASUREMENT_PREFIX;
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;
use crate::{add_objects, create_object, delete_object, get_object, update_event, update_object};

/// Data structure for visualization containing an ID and data points
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct VisData {
    pub id: String,
    pub data: Vec<DataPoint>,
}

/// Represents a single data point with x and y coordinates
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DataPoint {
    pub x: f32,
    pub y: f32,
}

/// Creates a new measurement in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result containing the ID of the created measurement or an error
#[tauri::command]
pub fn create_measurement(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let mut builder = MeasurementBuilder::default();
    builder.name("New Measurement".to_string());

    let id = create_object!(state.doc, measurements, builder, MEASUREMENT_PREFIX, id);

    let mut state_doc = state.doc.lock().unwrap();

    // Collect the ids from small molecules and proteins by chaining the iterators
    let species_ids: Vec<String> = state_doc
        .small_molecules
        .iter()
        .map(|s| s.id.clone())
        .chain(state_doc.proteins.iter().map(|s| s.id.clone()))
        .collect();

    let meas = state_doc
        .measurements
        .iter_mut()
        .find(|m| m.id == id)
        .unwrap();

    meas.species_data = species_ids
        .iter()
        .map(|id| {
            MeasurementDataBuilder::default()
                .species_id(id.clone())
                .data_type(DataTypes::Concentration)
                .time(vec![])
                .data(vec![])
                .build()
                .expect("Failed to build species data")
        })
        .collect();

    update_event!(app_handle, "update_measurements");

    Ok(id)
}

/// Adds a small molecule to the EnzymeML document
///
/// This function adds a small molecule to the document's small_molecules collection.
/// It emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `object` - The small molecule object to add
#[tauri::command]
pub fn add_measurement(
    state: State<Arc<EnzymeMLState>>,
    mut object: Measurement,
    app_handle: AppHandle,
) -> String {
    let mut state_guard = state.doc.lock().unwrap();
    let id = generate_id(
        &state_guard
            .measurements
            .iter()
            .map(|s| s.id.clone())
            .collect(),
        MEASUREMENT_PREFIX,
    );
    object.id = id.clone();
    state_guard.measurements.push(object.clone());
    drop(state_guard);
    update_event!(app_handle, "update_measurements");
    id
}

/// Adds multiple small molecules to the EnzymeML document
///
/// This function adds multiple small molecules to the document's small_molecules collection.
/// It emits an update event to notify the frontend of the changes.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the document data
/// * `data` - The vector of small molecule objects to add
#[tauri::command]
pub fn add_measurements(
    state: State<Arc<EnzymeMLState>>,
    mut data: Vec<Measurement>,
    app_handle: AppHandle,
) -> Vec<String> {
    let mut existing_ids: Vec<String> = state
        .doc
        .lock()
        .unwrap()
        .measurements
        .iter()
        .map(|s| s.id.clone())
        .collect();

    let mut ids = Vec::with_capacity(data.len());
    let objects: Vec<Measurement> = data
        .iter_mut()
        .map(|o| {
            let id = generate_id(&existing_ids, MEASUREMENT_PREFIX);
            ids.push(id.clone());
            existing_ids.push(id.clone());
            o.id = id;
            o.clone()
        })
        .collect();

    add_objects!(state.doc, measurements, objects);
    update_event!(app_handle, "update_measurements");
    ids
}

/// Updates an existing measurement in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `data` - The updated measurement data
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn update_measurement(
    state: State<Arc<EnzymeMLState>>,
    data: Measurement,
    app_handle: AppHandle,
) -> Result<(), String> {
    println!("Updating measurement: {:#?}", data);
    let id = update_object!(state.doc, measurements, data, id);

    update_event!(app_handle, "update_measurements");
    update_event!(app_handle, &id);

    Ok(())
}

/// Retrieves a list of all measurements with their IDs and names
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing measurement ID and name pairs
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

/// Retrieves a specific measurement by its ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the measurement to retrieve
///
/// # Returns
/// Result containing the measurement or an error if not found
#[tauri::command]
pub fn get_measurement(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Measurement, String> {
    get_object!(state.doc, measurements, id, id)
}

/// Retrieves data points for visualization from a measurement
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the measurement to get data points from
///
/// # Returns
/// Result containing a vector of visualization data or an error
#[tauri::command]
pub fn get_datapoints(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Vec<VisData>, String> {
    let meas: Measurement = get_object!(state.doc, measurements, id, id)?;
    let mut times = vec![];

    for data in &meas.species_data {
        if !data.time.is_empty() {
            times.push(data.time.clone());
        }
    }

    time_arrays_are_same(&times)?;

    let mut dataset: Vec<VisData> = vec![];

    for species_data in &meas.species_data {
        if species_data.data.is_empty() {
            // When there is no data, we can't create a data point
            continue;
        }

        let time = species_data.time.clone();
        let data = species_data.data.clone();

        let zipped: Vec<(&f64, f64)> = time.iter().zip(data).collect();

        let mut data_points = vec![];

        for (time, data) in zipped {
            data_points.push(DataPoint {
                y: data as f32,
                x: *time as f32,
            });
        }

        let vis_data = VisData {
            id: get_species_name(state.clone(), &species_data.species_id)?,
            data: data_points,
        };

        if !vis_data.data.is_empty() {
            dataset.push(vis_data);
        }
    }

    println!("Returning {:#?}", dataset);
    Ok(dataset)
}

/// Validates that all time arrays in a collection are identical
///
/// # Arguments
/// * `times` - Vector of time arrays to validate
///
/// # Returns
/// Result indicating success or an error if arrays differ
fn time_arrays_are_same(times: &[Vec<f64>]) -> Result<(), String> {
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

/// Deletes a measurement from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The ID of the measurement to delete
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn delete_measurement(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Signature: State, Path, ID, ID property
    delete_object!(state.doc, measurements, id, id);

    update_event!(app_handle, "update_measurements");
    update_event!(app_handle, "update_vis");

    Ok(())
}

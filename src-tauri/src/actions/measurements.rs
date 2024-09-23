use std::sync::Arc;

use enzymeml_rs::prelude::{Measurement, MeasurementBuilder, MeasurementDataBuilder};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::{create_object, delete_object, get_object, update_event, update_object};
use crate::actions::utils::generate_id;
use crate::states::EnzymeMLState;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct VisData {
    pub id: String,
    pub data: Vec<DataPoint>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DataPoint {
    pub x: f32,
    pub y: f32,
}

#[tauri::command]
pub fn create_measurement(state: State<Arc<EnzymeMLState>>, app_handle: AppHandle) -> Result<String, String> {
    let id = create_object!(state.doc, measurements, MeasurementBuilder, "m", id);
    let mut state_doc = state.doc.lock().unwrap();

    // Collect the ids from small molecules and proteins by chaining the iterators
    let species_ids: Vec<String> = state_doc.small_molecules
        .iter().map(|s| s.id.clone())
        .chain(state_doc.proteins.iter().map(|s| s.id.clone())).collect();

    let meas = state_doc.measurements.iter_mut().find(|m| m.id == id).unwrap();

    meas.species_data = species_ids.iter().map(|id| {
        MeasurementDataBuilder::default()
            .species_id(id.clone())
            .time(vec![])
            .data(vec![])
            .build()
            .expect("Failed to build species data")
    }).collect();

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_nav");
    update_event!(app_handle, "update_measurements");

    Ok(id)
}

#[tauri::command]
pub fn update_measurement(
    state: State<Arc<EnzymeMLState>>,
    data: Measurement,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id = update_object!(state.doc, measurements, data, id);

    update_event!(app_handle, "update_document");
    update_event!(app_handle, "update_measurements");
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
pub fn get_datapoints(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Vec<VisData>, String> {
    let meas: Measurement = get_object!(state.doc, measurements, id, id)?;
    let mut times = vec![];

    for data in &meas.species_data {
        if data.time.is_some() && !data.time.clone().unwrap().is_empty() {
            times.push(data.time.clone().unwrap());
        }
    }

    time_arrays_are_same(&times)?;

    let mut dataset: Vec<VisData> = vec![];

    for species_data in &meas.species_data {
        if species_data.data.is_none() {
            // When there is no data, we can't create a data point
            continue;
        }

        let time = species_data.time.clone().unwrap();
        let data = species_data.data.clone().unwrap();

        let zipped: Vec<(&f32, f32)> = time
            .iter()
            .zip(data)
            .collect();

        let mut data_points = vec![];

        for (time, data) in zipped {
            data_points.push(DataPoint {
                y: data,
                x: *time,
            });
        }

        let vis_data = VisData {
            id: species_data.species_id.clone(),
            data: data_points,
        };

        if !vis_data.data.is_empty() {
            dataset.push(vis_data);
        }
    }

    println!("Returning {:#?}", dataset);
    Ok(dataset)
}

fn time_arrays_are_same(times: &[Vec<f32>]) -> Result<(), String> {
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

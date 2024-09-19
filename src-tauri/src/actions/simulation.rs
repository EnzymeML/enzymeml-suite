use std::collections::HashMap;
use std::sync::Arc;

use enzymeml_rs::prelude::result::SimulationResult;
use enzymeml_rs::prelude::*;
use tauri::State;

use crate::states::EnzymeMLState;

#[tauri::command]
pub fn simulate_enzymeml(
    state: State<Arc<EnzymeMLState>>,
    initial_conditions: HashMap<String, f64>,
) -> Result<Vec<SimulationResult>, String> {
    println!("Simulating EnzymeML document");
    println!("Initial conditions: {:?}", initial_conditions);

    let state_doc = state.doc.lock().unwrap();
    let setup = SimulationSetupBuilder::default()
        .t1(10.0.into())
        .dt(1.0)
        .build()
        .unwrap();

    let result = simulate(&state_doc, initial_conditions.into(), setup).map_err(|e| e.to_string());

    result
}

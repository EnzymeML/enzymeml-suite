use enzymeml::prelude::SimulationResult;
use enzymeml::prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

use crate::states::EnzymeMLState;

/// Simulates an EnzymeML document using numerical integration
///
/// This function converts the EnzymeML document into an ODE system and runs
/// a simulation with the provided initial conditions. The simulation uses
/// a Runge-Kutta 5th order solver with default parameters.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `initial_conditions` - HashMap mapping species IDs to their initial concentrations
///
/// # Returns
/// Result containing a vector of simulation results or an error message
#[tauri::command]
pub fn simulate_enzymeml(
    state: State<Arc<EnzymeMLState>>,
    initial_conditions: HashMap<String, f64>,
) -> Result<Vec<SimulationResult>, String> {
    println!("Simulating EnzymeML document");
    println!("Initial conditions: {:?}", initial_conditions);

    let state_doc = state.doc.lock().unwrap();
    let system: ODESystem = (&*state_doc).try_into().unwrap();
    let setup = SimulationSetupBuilder::default()
        .dt(0.1)
        .t0(0.0)
        .t1(200.0)
        .build()
        .expect("Failed to build simulation setup");

    let result = system.integrate::<SimulationResult>(
        &setup,
        &initial_conditions,
        None,
        None,
        RK5,
        Some(Mode::Regular),
    );

    result.map(|r| vec![r]).map_err(|e| e.to_string())
}

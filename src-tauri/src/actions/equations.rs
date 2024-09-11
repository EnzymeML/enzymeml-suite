use std::collections::HashSet;
use std::sync::{Arc, MutexGuard};

use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, Equation, Parameter};
use enzymeml_rs::equation::extract_symbols;
use enzymeml_rs::prelude::{EquationBuilder, EquationType, ParameterBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{delete_object, get_object, update_event, update_object};
use crate::actions::enzmldoc::extract_species_ids;
use crate::states::EnzymeMLState;

#[tauri::command]
pub fn list_equations(state: State<Arc<EnzymeMLState>>) -> Vec<Option<String>> {
    state
        .doc
        .lock()
        .unwrap()
        .equations
        .iter()
        .map(|s| s.species_id.clone())
        .collect()
}

#[tauri::command]
pub fn update_equation(
    state: State<Arc<EnzymeMLState>>,
    data: Equation,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id: Option<String> = update_object!(
        state.doc,
        equations,
        data.clone(),
        species_id
    );

    if id.is_none() {
        return Err("Equation not found".to_string());
    }

    process_equation(&state, &data)?;
    cleanup_parameters(&state);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, &id.unwrap());

    Ok(())
}

#[tauri::command]
pub fn create_equation(
    state: State<Arc<EnzymeMLState>>,
    species_id: &str,
    equation_type: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut doc = state.doc.lock().unwrap();

    // Match the equation type
    let equation_type = match equation_type {
        "ode" => EquationType::Ode,
        "assignment" => EquationType::Assignment,
        "initial_assignment" => EquationType::InitialAssignment,
        _ => return Err("Invalid equation type".to_string())
    };

    // Create the equation
    let equation = EquationBuilder::default()
        .species_id(species_id.to_string())
        .equation_type(equation_type)
        .build().map_err(|err| err.to_string())?;

    process_equation(&state, &equation)?;
    doc.equations.push(equation);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_equations");

    Ok(())
}

#[tauri::command]
pub fn get_equation(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
) -> Result<Equation, String> {
    get_object!(
        state.doc,
        equations,
        Some(id.to_string().clone()),
        species_id
    )
}

#[tauri::command]
pub fn delete_equation(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    delete_object!(
        state.doc,
        equations,
        Some(id.to_string().clone()),
        species_id
    );

    cleanup_parameters(&state);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_equations");

    Ok(())
}

fn process_equation(state: &State<Arc<EnzymeMLState>>, equation: &Equation) -> Result<(), String> {
    let mut doc = state.doc.lock().unwrap();
    let mut param_buffer = state.param_buffer.lock().unwrap();

    let expr: meval::Expr = equation.equation.parse()
        .map_err(|_| "Could not parse equation")?;

    let vars: Vec<String> = extract_variables(&doc);
    let exist_params: HashSet<String> = doc.parameters.iter()
        .map(|p| p.id.clone())
        .collect();

    for symbol in extract_symbols(&expr).iter() {
        if !vars.contains(symbol) && !exist_params.contains(symbol) {
            // Add the parameter to the document
            doc.parameters.push(
                create_or_from_buffer(&mut param_buffer, symbol)
            );

            // Remove the parameter from the buffer
            param_buffer.retain(|p| p.id != *symbol);
        }
    }

    Ok(())
}

fn create_or_from_buffer(param_buffer: &mut MutexGuard<Vec<Parameter>>, symbol: &String) -> Parameter {
    if let Some(param) = param_buffer.iter().find(|p| p.id == *symbol) {
        param.clone()
    } else {
        ParameterBuilder::default()
            .id(symbol.clone())
            .name(symbol.clone())
            .symbol(symbol.clone())
            .build()
            .expect("Failed to build parameter")
    }
}


fn extract_variables(doc: &MutexGuard<EnzymeMLDocument>) -> Vec<String> {
    let mut vars = vec![];

    // Extract from all species (small_molecules, proteins, complexes)
    let species_ids: HashSet<String> = extract_species_ids(doc).into_iter().collect();
    let assignment_ids: HashSet<String> = doc.equations.iter()
        .filter(|e| e.equation_type == EquationType::Assignment || e.equation_type == EquationType::InitialAssignment)
        .map(|e| e.species_id.clone().unwrap())
        .collect();

    vars.extend(species_ids);
    vars.extend(assignment_ids);

    vars
}

fn cleanup_parameters(state: &State<Arc<EnzymeMLState>>) {
    let mut doc = state.doc.lock().unwrap();
    let mut param_buffer = state.param_buffer.lock().unwrap();
    let symbols = extract_all_symbols(&doc);
    let mut to_remove: Vec<String> = vec![];

    for param in doc.parameters.iter() {
        if !symbols.contains(&param.id) {
            move_to_param_buffer(&mut param_buffer, param);
            to_remove.push(param.id.clone());
        }
    }

    doc.parameters.retain(|p| !to_remove.contains(&p.id));
}

fn move_to_param_buffer(param_buffer: &mut MutexGuard<Vec<Parameter>>, param: &Parameter) {
    param_buffer.push(param.clone());

    if param_buffer.len() > 10 {
        param_buffer.remove(0);
    }
}

fn extract_all_symbols(doc: &MutexGuard<EnzymeMLDocument>) -> Vec<String> {
    let symbols: Vec<String> = doc.equations.iter()
        .flat_map(|e| extract_symbols(&e.equation.parse().unwrap()))
        .collect();
    symbols
}
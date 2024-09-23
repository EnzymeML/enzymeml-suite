use std::collections::HashSet;
use std::sync::{Arc, MutexGuard};

use enzymeml_rs::enzyme_ml::{EnzymeMLDocument, Equation, Parameter, Reaction};
use enzymeml_rs::equation::extract_symbols;
use enzymeml_rs::prelude::{EquationBuilder, EquationType, ParameterBuilder};
use tauri::{AppHandle, Manager, State};

use crate::{delete_object, get_object, update_event, update_object};
use crate::actions::enzmldoc::extract_species_ids;
use crate::states::EnzymeMLState;

#[derive(Debug, Clone)]
pub struct EquationPart {
    pub negative: bool,
    pub stoichiometry: f64,
    pub equation: String,
}

#[tauri::command]
pub fn list_equations(state: State<Arc<EnzymeMLState>>) -> Vec<(String, EquationType)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .equations
        .iter()
        .map(|s| {
            (
                s.species_id.clone().unwrap_or("".to_string()),
                s.equation_type.clone(),
            )
        })
        .collect()
}

#[tauri::command]
pub fn update_equation(
    state: State<Arc<EnzymeMLState>>,
    data: Equation,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id: Option<String> = update_object!(state.doc, equations, data.clone(), species_id);

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
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut doc = state.doc.lock().unwrap();

    // Create the equation
    let equation = EquationBuilder::default()
        .equation_type(EquationType::Assignment)
        .build()
        .map_err(|err| err.to_string())?;

    doc.equations.push(equation);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_equations");

    Ok(())
}

#[tauri::command]
pub fn get_equation(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Equation, String> {
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

#[tauri::command]
pub fn derive_from_reactions(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let reactions;

    { // Extract the guarded state values
        let state_doc = state.doc.lock().unwrap();
        reactions = state_doc.reactions.clone();
    }

    if reactions.is_empty() {
        return Err("No reactions found".to_string());
    }

    for reaction in reactions.iter() {
        if reaction.kinetic_law.is_none() {
            return Err("Not all reactions have a rate equation".to_string());
        }
    }

    { // Process the equations
        let mut state_doc = state.doc.lock().unwrap();
        for equation in state_doc.equations.iter_mut() {
            if equation.equation_type.clone() != EquationType::Ode {
                continue;
            }

            let mut parts: Vec<EquationPart> = vec![];

            for reaction in reactions.iter() {
                if !has_species_id(equation, reaction) {
                    continue;
                }
                derive_part_from_reac(equation, &mut parts, reaction);
            }

            parts.sort_by(|a, b| a.negative.cmp(&b.negative));
            equation.equation = assemble_equation(&mut parts);
        }
    }
    
    let equations_to_process: Vec<Equation> = {
        let state_doc = state.doc.lock().unwrap();
        state_doc.equations.iter().filter(|e| e.equation_type == EquationType::Ode).cloned().collect()
    };
    
    for equation in equations_to_process.iter() {
        process_equation(&state, equation)?;
    }

    {
        cleanup_parameters(&state);
    }

    app_handle.emit_all("update_equations", ()).map_err(|e| e.to_string())?;

    Ok(())
}

fn assemble_equation(parts: &mut [EquationPart]) -> String {
    let mut equation_str = String::new();

    for (i, part) in parts.iter().enumerate() {
        // When there are no plus or minus signs, we can just add the equation
        let equation = if part.equation.contains('+') || part.equation.contains("-") {
            format!("({})", part.equation.clone())
        } else {
            part.equation.clone()
        };

        if i == 0 {
            if part.stoichiometry.abs() == 1.0 {
                let sign = if part.negative { "-" } else { "" };
                equation_str.push_str(&format!("{}{}", sign, equation));
            } else {
                equation_str.push_str(&format!("{} * {}", part.stoichiometry, equation));
            }
        } else {
            let sign = if part.negative { "-" } else { "+" };
            if part.stoichiometry.abs() == 1.0 {
                equation_str.push_str(&format!(" {} {}", sign, equation));
            } else {
                equation_str.push_str(&format!(" {} {}*{}", sign, part.stoichiometry, equation));
            }
        }
    }
    equation_str
}

fn derive_part_from_reac(equation: &mut Equation, parts: &mut Vec<EquationPart>, reaction: &Reaction) {
    let stoichiometry = reaction
        .species
        .iter()
        .find(|s| s.species_id == equation.species_id.clone().unwrap())
        .unwrap()
        .stoichiometry;

    if let Some(ref law) = reaction.kinetic_law {
        parts.push(
            EquationPart {
                negative: stoichiometry < 0.0,
                stoichiometry: stoichiometry.into(),
                equation: law.equation.clone(),
            }
        );
    }
}

fn has_species_id(equation: &mut Equation, reaction: &Reaction) -> bool {
    reaction.species.iter().any(|s| *s.species_id == equation.clone().species_id.unwrap_or("".to_string()))
}

fn process_equation(state: &State<Arc<EnzymeMLState>>, equation: &Equation) -> Result<(), String> {
    let mut doc = state.doc.lock().unwrap();
    let mut param_buffer = state.param_buffer.lock().unwrap();

    let expr: meval::Expr = equation
        .equation
        .parse()
        .map_err(|_| "Could not parse equation")?;

    let vars: Vec<String> = extract_variables(&doc);
    let exist_params: HashSet<String> = doc.parameters.iter().map(|p| p.id.clone()).collect();

    for symbol in extract_symbols(&expr).iter() {
        if !vars.contains(symbol) && !exist_params.contains(symbol) {
            // Add the parameter to the document
            doc.parameters
                .push(create_or_from_buffer(&mut param_buffer, symbol));

            // Remove the parameter from the buffer
            param_buffer.retain(|p| p.id != *symbol);
        }
    }

    Ok(())
}

fn create_or_from_buffer(
    param_buffer: &mut MutexGuard<Vec<Parameter>>,
    symbol: &String,
) -> Parameter {
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
    let assignment_ids: HashSet<String> = doc
        .equations
        .iter()
        .filter(|e| {
            e.equation_type == EquationType::Assignment
                || e.equation_type == EquationType::InitialAssignment
        })
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
    let symbols: Vec<String> = doc
        .equations
        .iter()
        .flat_map(|e| extract_symbols(&e.equation.parse().unwrap()))
        .collect();
    symbols
}

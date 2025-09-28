use enzymeml::equation::extract_symbols;
use enzymeml::prelude::{EnzymeMLDocument, Equation, Parameter, Reaction};
use enzymeml::prelude::{EquationBuilder, EquationType, ParameterBuilder};
use std::collections::HashSet;
use std::sync::{Arc, MutexGuard};
use tauri::{AppHandle, Emitter, State};

use crate::actions::enzmldoc::extract_species_ids;
use crate::states::EnzymeMLState;
use crate::{delete_object, get_object, update_event, update_object};

/// Represents a part of an equation derived from a reaction
#[derive(Debug, Clone)]
pub struct EquationPart {
    /// Whether this part should be negative (subtracted)
    pub negative: bool,
    /// The stoichiometric coefficient
    pub stoichiometry: f64,
    /// The equation string
    pub equation: String,
}

/// Lists all equations in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
///
/// # Returns
/// Vector of tuples containing the species ID and equation type for each equation
#[tauri::command]
pub fn list_equations(state: State<Arc<EnzymeMLState>>) -> Vec<(String, EquationType)> {
    // Extract the guarded state values
    let state_doc = state.doc.lock().unwrap();

    state_doc
        .equations
        .iter()
        .map(|s| (s.species_id.clone(), s.equation_type.clone()))
        .collect()
}

/// Updates an existing equation in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `data` - The updated equation data
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn update_equation(
    state: State<Arc<EnzymeMLState>>,
    data: Equation,
    app_handle: AppHandle,
) -> Result<(), String> {
    let id: String = update_object!(state.doc, equations, data.clone(), species_id);

    process_equation(&state, &data)?;
    cleanup_parameters(&state);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, &id);

    Ok(())
}

/// Creates a new equation in the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn create_equation(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut doc = state.doc.lock().unwrap();

    // Create the equation
    let equation = EquationBuilder::default()
        .equation_type(EquationType::Assignment)
        .species_id("".to_string())
        .build()
        .map_err(|err| err.to_string())?;

    doc.equations.push(equation);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_equations");

    Ok(())
}

/// Retrieves a specific equation by its species ID
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The species ID of the equation to retrieve
///
/// # Returns
/// Result containing the equation or an error if not found
#[tauri::command]
pub fn get_equation(state: State<Arc<EnzymeMLState>>, id: &str) -> Result<Equation, String> {
    get_object!(state.doc, equations, id.to_string().clone(), species_id)
}

/// Deletes an equation from the EnzymeML document
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `id` - The species ID of the equation to delete
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn delete_equation(
    state: State<Arc<EnzymeMLState>>,
    id: &str,
    app_handle: AppHandle,
) -> Result<(), String> {
    delete_object!(state.doc, equations, id.to_string().clone(), species_id);

    cleanup_parameters(&state);

    update_event!(app_handle, "update_parameters");
    update_event!(app_handle, "update_equations");

    Ok(())
}

/// Derives ODE equations from reaction kinetics
///
/// This function automatically generates differential equations for species
/// based on the reactions they participate in and their stoichiometric coefficients.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// Result indicating success or failure
#[tauri::command]
pub fn derive_from_reactions(
    state: State<Arc<EnzymeMLState>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let reactions;

    {
        // Extract the guarded state values
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

    {
        // Process the equations
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
        state_doc
            .equations
            .iter()
            .filter(|e| e.equation_type == EquationType::Ode)
            .cloned()
            .collect()
    };

    for equation in equations_to_process.iter() {
        process_equation(&state, equation)?;
    }

    {
        cleanup_parameters(&state);
    }

    app_handle
        .emit("update_equations", ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Assembles multiple equation parts into a single equation string
///
/// # Arguments
/// * `parts` - Mutable slice of equation parts to assemble
///
/// # Returns
/// The assembled equation as a string
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

/// Derives an equation part from a reaction for a specific species
///
/// # Arguments
/// * `equation` - The equation being built for a specific species
/// * `parts` - Vector to add the derived equation part to
/// * `reaction` - The reaction to derive the part from
fn derive_part_from_reac(
    equation: &mut Equation,
    parts: &mut Vec<EquationPart>,
    reaction: &Reaction,
) {
    let stoichiometry = if let Some(reactant) = reaction
        .reactants
        .iter()
        .find(|s| s.species_id == equation.species_id.clone())
    {
        -reactant.stoichiometry
    } else if let Some(product) = reaction
        .products
        .iter()
        .find(|s| s.species_id == equation.species_id.clone())
    {
        product.stoichiometry
    } else {
        panic!("Species not found in reaction")
    };

    if let Some(ref law) = reaction.kinetic_law {
        parts.push(EquationPart {
            negative: stoichiometry < 0.0,
            stoichiometry,
            equation: law.equation.clone(),
        });
    }
}

/// Checks if a species is involved in a reaction
///
/// # Arguments
/// * `equation` - The equation containing the species ID to check
/// * `reaction` - The reaction to check for the species
///
/// # Returns
/// True if the species is involved in the reaction, false otherwise
fn has_species_id(equation: &mut Equation, reaction: &Reaction) -> bool {
    reaction
        .reactants
        .iter()
        .chain(reaction.products.iter())
        .any(|s| *s.species_id == equation.clone().species_id)
}

/// Processes an equation to extract and create necessary parameters
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
/// * `equation` - The equation to process
///
/// # Returns
/// Result indicating success or failure
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

/// Creates a new parameter or retrieves it from the parameter buffer
///
/// # Arguments
/// * `param_buffer` - Mutable reference to the parameter buffer
/// * `symbol` - The symbol/ID for the parameter
///
/// # Returns
/// A parameter object, either from the buffer or newly created
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

/// Extracts all variable names from the document (species and assignment equations)
///
/// # Arguments
/// * `doc` - Reference to the EnzymeML document
///
/// # Returns
/// Vector of variable names
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
        .map(|e| e.species_id.clone())
        .collect();

    vars.extend(species_ids);
    vars.extend(assignment_ids);

    vars
}

/// Removes unused parameters from the document and moves them to the parameter buffer
///
/// # Arguments
/// * `state` - The shared EnzymeML document state
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

/// Moves a parameter to the parameter buffer with size limit
///
/// # Arguments
/// * `param_buffer` - Mutable reference to the parameter buffer
/// * `param` - The parameter to move to the buffer
fn move_to_param_buffer(param_buffer: &mut MutexGuard<Vec<Parameter>>, param: &Parameter) {
    param_buffer.push(param.clone());

    if param_buffer.len() > 10 {
        param_buffer.remove(0);
    }
}

/// Extracts all symbols used in equations throughout the document
///
/// # Arguments
/// * `doc` - Reference to the EnzymeML document
///
/// # Returns
/// Vector of all symbols found in equations
fn extract_all_symbols(doc: &MutexGuard<EnzymeMLDocument>) -> Vec<String> {
    let symbols: Vec<String> = doc
        .equations
        .iter()
        .flat_map(|e| extract_symbols(&e.equation.parse().unwrap()))
        .collect();
    symbols
}

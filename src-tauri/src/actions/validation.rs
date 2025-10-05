use std::sync::Arc;

use enzymeml::validation::consistency::{
    Report as EnzymeMLReport, Severity as EnzymeMLSeverity,
    ValidationResult as EnzymeMLValidationResult,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

use crate::states::EnzymeMLState;

/// Severity levels for validation issues
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum Severity {
    Error,
    Warning,
    Info,
}

impl From<EnzymeMLSeverity> for Severity {
    fn from(severity: EnzymeMLSeverity) -> Self {
        match severity {
            EnzymeMLSeverity::Error => Severity::Error,
            EnzymeMLSeverity::Warning => Severity::Warning,
            EnzymeMLSeverity::Info => Severity::Info,
        }
    }
}

/// A single validation issue found during checking
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ValidationResult {
    /// JSON pointer path to the location of the validation issue
    pub location: String,
    /// Human readable description of the validation issue
    pub message: String,
    /// Severity level of the validation issue
    pub severity: Severity,
    /// Identifier of the validation issue
    pub identifier: Option<String>,
}

impl From<EnzymeMLValidationResult> for ValidationResult {
    fn from(result: EnzymeMLValidationResult) -> Self {
        Self {
            location: result.location().to_string(),
            message: result.message().to_string(),
            severity: result.severity().clone().into(),
            identifier: result.identifier().as_ref().map(|id| id.to_string()),
        }
    }
}

/// Validation report containing all consistency check results
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct Report {
    /// Whether the document is valid overall
    pub is_valid: bool,
    /// Vector of individual validation results
    pub errors: Vec<ValidationResult>,
}

impl From<EnzymeMLReport> for Report {
    fn from(report: EnzymeMLReport) -> Self {
        Self {
            is_valid: report.is_valid,
            errors: report.errors.into_iter().map(|r| r.into()).collect(),
        }
    }
}

/// Retrieves the current validation report for the EnzymeML document
///
/// This function returns the cached validation report that contains consistency
/// checks and validation results for the current EnzymeML document. The report
/// includes information about data integrity, missing required fields, and
/// other validation issues that may need attention.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the validation report
///
/// # Returns
/// Result containing either the validation Report object or an error message
#[tauri::command]
#[specta::specta]
pub fn get_validation_report(state: State<Arc<EnzymeMLState>>) -> Result<Report, String> {
    let enzymeml_report = state.validation_report.lock().unwrap().clone();
    Ok(enzymeml_report.into())
}

/// Retrieves validation results filtered by a specific identifier
///
/// This function filters the current validation report to return only those
/// validation results that match the specified identifier. This is particularly
/// useful when you need to examine validation issues related to a specific
/// component, measurement, or entity within the EnzymeML document. The function
/// accesses the cached validation report and applies the identifier filter to
/// return a subset of validation results that are relevant to the requested
/// identifier.
///
/// # Arguments
/// * `state` - The shared EnzymeML document state containing the validation report
/// * `identifier` - The specific identifier string to filter validation results by
///
/// # Returns
/// A vector of ValidationResult objects that match the specified identifier
#[tauri::command]
#[specta::specta]
pub fn get_validation_report_by_identifier(
    state: State<Arc<EnzymeMLState>>,
    identifier: &str,
) -> Vec<ValidationResult> {
    let state_report = state.validation_report.lock().unwrap().clone();
    state_report
        .filter_results(identifier)
        .into_iter()
        .map(|r| r.into())
        .collect()
}

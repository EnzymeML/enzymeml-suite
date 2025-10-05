import { commands, type Report, type ValidationResult } from "@commands/validation";

/**
 * Enumeration of possible validation statuses
 */
export enum ValidationStatus {
    /** No validation issues found */
    OK = 'OK',
    /** Validation passed but has warnings */
    HasWarnings = 'HasWarnings',
    /** Validation failed with errors */
    HasErrors = 'HasErrors'
}

export interface ValidationReportCounts {
    errors: number;
    warnings: number;
}

/**
 * Retrieves the current validation status of the document
 * 
 * @returns Promise that resolves to a ValidationStatus
 * @throws Error if validation report cannot be retrieved
 */
export default async function getValidationStatus(): Promise<ValidationStatus> {
    // Fetch the validation report from the backend
    const validationReport = await commands.getValidationReport();

    console.log("validationReport", validationReport);

    // Handle error case when validation report cannot be retrieved
    if (validationReport.status === "error") {
        throw new Error(`Failed to get validation report: ${validationReport.error}`);
    }

    const report = validationReport.data;

    // If document is valid, return OK status
    if (report.is_valid) {
        return ValidationStatus.OK;
    }

    // Check for errors and warnings if document is not valid
    const errors = report.errors || [];
    if (errors.length === 0) {
        return ValidationStatus.OK;
    }

    // Count errors and warnings
    const numErrors = errors.filter(error => error.severity === "Error").length;
    const numWarnings = errors.filter(error => error.severity === "Warning").length;

    // Return status based on severity of issues found
    if (numErrors > 0) {
        return ValidationStatus.HasErrors;
    }

    if (numWarnings > 0) {
        return ValidationStatus.HasWarnings;
    }

    return ValidationStatus.OK;
}

/**
 * Retrieves the count of errors and warnings from the validation report
 * 
 * @returns Promise that resolves to ValidationReportCounts containing error and warning counts
 * @throws Error if validation report cannot be retrieved
 */
export async function getReportCounts(): Promise<ValidationReportCounts> {
    const report = await getValidationReport();
    return {
        errors: report.errors.filter(error => error.severity === "Error").length,
        warnings: report.errors.filter(error => error.severity === "Warning").length,
    };
}

/**
 * Retrieves the full validation report for the document
 * 
 * @returns Promise that resolves to a Report
 * @throws Error if validation report cannot be retrieved
 */
export async function getValidationReport(): Promise<Report> {
    const validationReport = await commands.getValidationReport();
    if (validationReport.status === "error") {
        throw new Error(`Failed to get validation report: ${validationReport.error}`);
    }
    return validationReport.data;
}

/**
 * Retrieves the validation status for a specific identifier
 * 
 * @param id - The identifier to get validation status for
 * @returns Promise that resolves to a ValidationStatus
 * @throws Error if validation report cannot be retrieved
 */
export async function getValidationStatusById(id: string): Promise<ValidationStatus> {
    // Fetch the validation results for the specific identifier from the backend
    const validationResults = await commands.getValidationReportByIdentifier(id);

    console.log("validationResults for", id, validationResults);

    // If no validation results found, return OK status
    if (validationResults.length === 0) {
        return ValidationStatus.OK;
    }

    // Count errors and warnings
    const numErrors = validationResults.filter(result => result.severity === "Error").length;
    const numWarnings = validationResults.filter(result => result.severity === "Warning").length;

    // Return status based on severity of issues found
    if (numErrors > 0) {
        return ValidationStatus.HasErrors;
    }

    if (numWarnings > 0) {
        return ValidationStatus.HasWarnings;
    }

    return ValidationStatus.OK;
}

/**
 * Retrieves the validation results for the document
 * 
 * @returns Promise that resolves to a ValidationResult[]
 * @throws Error if validation report cannot be retrieved
 */
export async function getValidationReportById(id: string): Promise<ValidationResult[]> {
    return commands.getValidationReportByIdentifier(id)
}
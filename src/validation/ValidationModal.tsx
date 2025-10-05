import { useEffect, useState } from "react";
import { Modal, Typography, List, Collapse, theme, Empty } from "antd";
import { ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { useRouterTauriListener } from "@suite/hooks/useTauriListener";
import { getValidationReport, getValidationReportById } from "@validation/utils";
import { type Report, type ValidationResult, type Severity } from "@commands/validation";

const { Text } = Typography;

/**
 * Interface defining the props for the ValidationModal component
 */
interface ValidationModalProps {
    /** Controls whether the modal is visible */
    open: boolean;
    /** Callback function to handle modal close events */
    onClose: () => void;
    /** The identifier of the document to fetch the validation report for */
    id?: string;
}

/**
 * ValidationModal component that displays a detailed view of all validation errors and warnings
 * 
 * This modal component presents a comprehensive validation report for the EnzymeML document,
 * displaying all validation issues grouped by severity. It automatically updates when the 
 * validation report changes via Tauri event listeners and provides detailed information
 * about each validation issue including its location, message, and severity level.
 * 
 * The component organizes validation results into collapsible sections based on severity
 * (Errors, Warnings, Information) and provides appropriate visual indicators for each type.
 * When no validation issues are found, it displays a success message indicating the document
 * is valid according to the EnzymeML standard.
 * 
 * @param props - Component props containing open state and close handler
 * @returns JSX element containing the validation modal with detailed report
 */
export default function ValidationModal({ open, onClose, id }: ValidationModalProps) {
    /** State to hold the full validation report containing all validation results */
    const [report, setReport] = useState<Report | null>(null);

    /** Access Ant Design theme tokens for consistent styling across the modal */
    const { token } = theme.useToken();

    /**
     * Fetches the validation report from the backend based on the provided identifier
     * 
     * This function handles both document-specific validation reports (when an ID is provided)
     * and general document validation reports. It constructs the appropriate report structure
     * and handles any errors that may occur during the fetch operation.
     */
    const fetchReport = async () => {
        try {
            if (id) {
                // Fetch validation results for a specific identifier
                const validationReport = await getValidationReportById(id);
                setReport({
                    is_valid: validationReport.length === 0,
                    errors: validationReport,
                });
            } else {
                // Fetch the general document validation report
                const validationReport = await getValidationReport();
                setReport(validationReport);
            }
        } catch (error) {
            console.error("Failed to fetch validation report:", error);
        }
    };

    // Listen for validation report updates from Tauri backend to ensure real-time updates
    useRouterTauriListener("update_report", () => {
        if (open) {
            fetchReport();
        }
    });

    // Fetch validation report when modal opens to display current validation state
    useEffect(() => {
        if (open) {
            fetchReport();
        }
    }, [open]);

    /**
     * Returns the appropriate icon component based on severity level
     * 
     * This function provides consistent visual indicators for different types of validation
     * issues, using Ant Design's icon system with appropriate colors from the theme tokens.
     * 
     * @param severity - The severity level of the validation result
     * @returns The corresponding icon component with appropriate styling
     */
    const getSeverityIcon = (severity: Severity) => {
        switch (severity) {
            case "Error":
                return <ExclamationCircleOutlined style={{ color: token.colorError }} />;
            case "Warning":
                return <WarningOutlined style={{ color: token.colorWarning }} />;
            case "Info":
                return <InfoCircleOutlined style={{ color: token.colorInfo }} />;
            default:
                return null;
        }
    };

    /** 
     * Group validation results by severity for organized display in the modal
     * 
     * This creates a structured object where validation results are categorized by their
     * severity level, enabling the creation of separate sections for errors, warnings,
     * and informational messages in the user interface.
     */
    const groupedResults: Partial<Record<Severity, ValidationResult[]>> = report?.errors.reduce((acc, result) => {
        if (!acc[result.severity]) {
            acc[result.severity] = [];
        }
        acc[result.severity]?.push(result);
        return acc;
    }, {} as Partial<Record<Severity, ValidationResult[]>>) || {};

    /** 
     * Build collapse items for the accordion display based on available validation results
     * 
     * This array contains the configuration for each collapsible section in the modal,
     * with sections only being added if there are validation results of that severity type.
     */
    const collapseItems = [];

    // Add Errors section if present - highest priority validation issues
    if (groupedResults["Error"]) {
        collapseItems.push({
            key: 'errors',
            label: (
                <div className="flex gap-2 items-center">
                    <ExclamationCircleOutlined style={{ color: token.colorError }} />
                    <Text strong style={{ color: token.colorError }}>
                        Errors ({groupedResults["Error"].length})
                    </Text>
                </div>
            ),
            children: (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <List
                        dataSource={groupedResults["Error"]}
                        renderItem={(item) => (
                            <List.Item>
                                <div className="flex gap-2 items-center w-full">
                                    {getSeverityIcon(item.severity)}
                                    <Text strong style={{ flex: 1 }}>{item.message}</Text>
                                    {item.identifier && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {item.identifier}
                                        </Text>
                                    )}
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            ),
        });
    }

    // Add Warnings section if present - medium priority validation issues
    if (groupedResults["Warning"]) {
        collapseItems.push({
            key: 'warnings',
            label: (
                <div className="flex gap-2 items-center">
                    <WarningOutlined style={{ color: token.colorWarning }} />
                    <Text strong style={{ color: token.colorWarning }}>
                        Warnings ({groupedResults["Warning"].length})
                    </Text>
                </div>
            ),
            children: (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <List
                        dataSource={groupedResults["Warning"]}
                        renderItem={(item) => (
                            <List.Item>
                                <div className="flex gap-2 items-center w-full">
                                    {getSeverityIcon(item.severity)}
                                    <Text style={{ flex: 1 }}>{item.message}</Text>
                                    {item.identifier && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {item.identifier}
                                        </Text>
                                    )}
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            ),
        });
    }

    // Add Info section if present - informational messages and suggestions
    if (groupedResults["Info"]) {
        collapseItems.push({
            key: 'info',
            label: (
                <div className="flex gap-2 items-center">
                    <InfoCircleOutlined style={{ color: token.colorInfo }} />
                    <Text strong style={{ color: token.colorInfo }}>
                        Information ({groupedResults["Info"].length})
                    </Text>
                </div>
            ),
            children: (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <List
                        dataSource={groupedResults["Info"]}
                        renderItem={(item) => (
                            <List.Item>
                                <div className="flex gap-2 items-center w-full">
                                    {getSeverityIcon(item.severity)}
                                    <Text style={{ flex: 1 }}>{item.message}</Text>
                                    {item.identifier && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {item.identifier}
                                        </Text>
                                    )}
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            ),
        });
    }

    return (
        <Modal
            title="Validation Report"
            open={open}
            onCancel={onClose}
            width={700}
            centered
            footer={null}
            styles={{
                content: {
                    backgroundColor: token.colorBgContainer,
                    maxHeight: '80vh',
                    overflow: 'auto'
                },
                mask: {
                    borderRadius: token.borderRadiusLG
                }
            }}
        >
            <div style={{ marginBottom: token.marginLG }}>
                <Text style={{ fontSize: token.fontSizeSM, textJustify: "auto", color: token.colorTextSecondary }}>
                    {report?.is_valid ? (
                        <>
                            This EnzymeML document has been successfully validated and meets all required specifications.
                            The document structure, data integrity, and compliance with the EnzymeML standard have been verified.
                        </>
                    ) : (
                        <>
                            This EnzymeML document contains validation issues that need to be addressed.
                            Below is a comprehensive report detailing all errors, warnings, and informational messages
                            identified during the validation process. Please review each item carefully to ensure
                            your document complies with the EnzymeML standard.
                        </>
                    )}
                </Text>
            </div>
            {collapseItems.length > 0 ? (
                <Collapse
                    className="mb-5"
                    accordion
                    items={collapseItems}
                    style={{ backgroundColor: token.colorBgContainer }}
                />
            ) : (
                <Empty
                    description="No validation issues found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}
        </Modal>
    );
}
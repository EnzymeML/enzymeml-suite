import { useEffect, useState } from "react";
import { Typography, Tag } from "antd";
import { ExclamationCircleOutlined, WarningOutlined } from "@ant-design/icons";

import { useRouterTauriListener } from "@suite/hooks/useTauriListener";
import { getReportCounts, ValidationReportCounts } from "@validation/utils";

const { Text } = Typography;

/**
 * ValidationSummary component that displays a summary of validation errors and warnings
 * 
 * This component fetches and displays the current count of validation errors and warnings
 * for the document. It automatically updates when the validation report changes via
 * Tauri event listeners.
 * 
 * @returns JSX element containing the validation summary display
 */
export default function Validation() {
    /** State to hold the current validation report counts */
    const [reportCounts, setReportCounts] = useState<ValidationReportCounts | null>(null);

    /** Destructure error and warning counts with fallback to 0 */
    const { errors, warnings } = reportCounts || { errors: 0, warnings: 0 };

    // Listen for validation report updates from Tauri backend
    useRouterTauriListener("update_report", () => {
        getReportCounts().then((counts) => {
            setReportCounts(counts);
        });
    });

    // Fetch initial validation report counts on component mount
    useEffect(() => {
        getReportCounts().then((counts) => {
            setReportCounts(counts);
        });
    }, []);

    return (
        <div className="flex flex-col gap-1 py-1">
            <Text strong>Validation Summary</Text>
            <div className="flex gap-2 items-center">
                {errors > 0 && (
                    <Tag color="error" style={{ margin: 0 }}>
                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                        {errors} error{errors !== 1 ? 's' : ''}
                    </Tag>
                )}
                {warnings > 0 && (
                    <Tag color="warning" style={{ margin: 0 }}>
                        <WarningOutlined style={{ marginRight: 4 }} />
                        {warnings} warning{warnings !== 1 ? 's' : ''}
                    </Tag>
                )}
                {errors === 0 && warnings === 0 && (
                    <Tag color="success" style={{ margin: 0 }}>
                        No issues found
                    </Tag>
                )}
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { theme, Tooltip } from "antd";

import { useRouterTauriListener } from "@hooks/useTauriListener";
import getValidationStatus, { getValidationStatusById, ValidationStatus } from "@validation/utils";
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";

/**
 * ValidationIndicator component that displays the current validation status of the document
 * 
 * This component shows an icon indicating whether the document has validation errors,
 * warnings, or is valid. It automatically updates when the validation report changes
 * by listening to the "update_report" event from the backend.
 * 
 * @returns JSX element containing the appropriate validation status icon
 */
export default function ValidationIndicator(
    {
        id,
        verbose = false,
        tooltip = true,
    }: {
        id?: string,
        verbose?: boolean,
        tooltip?: boolean,
    }
) {
    // State to track the current validation status
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>(ValidationStatus.OK);

    // Listen for validation report updates from the backend
    useRouterTauriListener("update_report", () => {
        if (id) {
            getValidationStatusById(id).then((status) => {
                setValidationStatus(status);
            });
        } else {
            getValidationStatus().then((status) => {
                setValidationStatus(status);
            });
        }
    });

    // Load initial validation status on component mount
    useEffect(() => {
        if (id) {
            getValidationStatusById(id).then((status) => {
                setValidationStatus(status);
            });
        } else {
            getValidationStatus().then((status) => {
                setValidationStatus(status);
            });
        }
    }, []);

    // Styling
    const { token } = theme.useToken();

    // Render appropriate icon based on validation status
    switch (validationStatus) {
        case ValidationStatus.OK: {
            const content = (
                <span className="flex gap-1 items-center">
                    <CheckCircleOutlined style={{ fontSize: 14, color: token.colorSuccess }} />
                    {verbose && <span style={{ color: token.colorSuccess, fontSize: 10 }}>Valid</span>}
                </span>
            );
            return tooltip ? <Tooltip title="Is valid">{content}</Tooltip> : content;
        }
        case ValidationStatus.HasWarnings: {
            const content = (
                <span className="flex gap-1 items-center">
                    <WarningOutlined style={{ fontSize: 14, color: token.colorWarning }} />
                    {verbose && <span style={{ color: token.colorWarning, fontSize: 10 }}>Warning</span>}
                </span>
            );
            return tooltip ? <Tooltip title="Has Warnings">{content}</Tooltip> : content;
        }
        case ValidationStatus.HasErrors: {
            const content = (
                <span className="flex gap-1 items-center">
                    <CloseCircleOutlined style={{ fontSize: 14, color: token.colorError }} />
                    {verbose && <span style={{ color: token.colorError, fontSize: 10 }}>Invalid</span>}
                </span>
            );
            return tooltip ? <Tooltip title="Has Errors">{content}</Tooltip> : content;
        }
    }
}
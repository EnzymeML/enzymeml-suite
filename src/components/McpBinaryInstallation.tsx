import { Typography, theme, Button } from "antd";
import { useState, useEffect } from "react";

import { installMcpServer } from "@commands/settings";
import { events as mcpEvents } from "@commands/mcp";
import useAppStore from "@stores/appstore";
import { NotificationType } from "@components/NotificationProvider.tsx";

const { Text } = Typography;

/**
 * Props for the McpBinaryInstallation component
 */
interface McpBinaryInstallationProps {
    /** Callback function called when installation completes successfully */
    onInstallationComplete?: () => void;
    /** Optional container width (default: undefined for full width) */
    containerWidth?: number | string;
    /** Optional container max height */
    containerMaxHeight?: number | string;
}

/**
 * MCP Binary Installation component
 * 
 * This component provides a step-by-step installation guide for the MCP server binary.
 * It matches the styling and layout of the Jupyter Installation component.
 * 
 * Features:
 * - Step-by-step visual guide using Ant Design Steps component
 * - One-click binary installation
 * - Real-time status updates with event listeners
 * - Completion confirmation when installation succeeds
 * 
 * @param props - Component props
 * @returns JSX element containing the installation interface
 */
export default function McpBinaryInstallation({
    onInstallationComplete,
    containerWidth,
    containerMaxHeight
}: McpBinaryInstallationProps) {
    // States
    const [isInstalling, setIsInstalling] = useState<boolean>(false);

    // Global actions
    const openNotification = useAppStore((state) => state.openNotification);

    // Styling
    const { token } = theme.useToken();

    /**
     * Handles MCP binary installation
     */
    const handleInstallBinary = async () => {
        setIsInstalling(true);
        try {
            await installMcpServer();
            // Success will be handled by the event listener
        } catch (error) {
            openNotification(
                'Installation Error',
                NotificationType.ERROR,
                error instanceof Error ? error.message : 'Failed to install MCP server.'
            );
            setIsInstalling(false);
        }
    };

    // Listen for MCP installation events
    useEffect(() => {
        const unlistenInstall = mcpEvents.mcpInstallOutput.listen((event) => {
            const { status, output } = event.payload;

            if (status === 'Success') {
                openNotification(
                    'Installation Complete',
                    NotificationType.SUCCESS,
                    output
                );
                setIsInstalling(false);
                // Call the completion callback if provided
                if (onInstallationComplete) {
                    onInstallationComplete();
                }
            } else if (status === 'Error') {
                openNotification(
                    'Installation Failed',
                    NotificationType.ERROR,
                    output
                );
                setIsInstalling(false);
            } else if (status === 'Output') {
                // Log installation progress for debugging
                console.log('MCP installation progress:', output);
            }
        });

        return () => {
            unlistenInstall.then(f => f());
        };
    }, [openNotification, onInstallationComplete]);

    return (
        <div style={{ width: containerWidth, maxHeight: containerMaxHeight }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col gap-2 justify-start">
                    <div className="flex flex-row gap-2 items-center">
                        <Text strong>MCP Binary Installation</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                        The MCP enzymeml needs to be installed on the system to further install in client applications.
                    </Text>
                    <div className="flex flex-col gap-2 items-center py-4">
                        <Button
                            variant="solid"
                            size="middle"
                            color='primary'
                            loading={isInstalling}
                            disabled={isInstalling}
                            onClick={handleInstallBinary}>
                            {isInstalling ? 'Installing...' : 'Install MCP Binary'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

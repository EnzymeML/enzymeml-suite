import { useState, useEffect, useCallback } from "react";
import { Popover, Badge, theme } from "antd";
import { OpenAIOutlined } from "@ant-design/icons";
import Icon from "@ant-design/icons";
import { PiSparkle } from "react-icons/pi";
import { openUrl } from "@tauri-apps/plugin-opener";

import ClaudeIcon from "@icons/claude.svg";
import { commands as mcpCommands, events as mcpEvents } from "@commands/mcp";
import McpBinaryInstallation from "@components/McpBinaryInstallation";
import useLLMStore from "@stores/llmstore";
import useAppStore from "@stores/appstore";
import { getBadgeColor } from "@components/CardHeader";
import { NotificationType } from "@components/NotificationProvider.tsx";

/**
 * Props for individual AI client option component
 */
interface AIClientOptionProps {
    /** The client identifier */
    client: 'chatgpt' | 'claude';
    /** Function to control the visibility of the selector */
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    /** Whether Claude is registered (only relevant for Claude option) */
    claudeRegistered?: boolean;
}

/**
 * AIClientSelector component provides a popover menu for accessing AI clients
 * 
 * This component provides access to AI clients:
 * - ChatGPT: Opens Suite extraction tool to turn queries into EnzymeML compliant objects and fetch from databases
 * - Claude Desktop: Opens Claude Desktop where you can interact with the opened document and add data and more. E.g. inspect measurements, ingest metadata from databases
 * 
 * The component checks MCP registration status and disables unavailable options.
 * 
 * Features:
 * - Sparkle icon trigger with badge indicator when extraction modal is visible
 * - Popover with AI client options or MCP binary installation interface
 * - Real-time status checking for MCP binary installation and Claude registration
 * - Event listeners for installation and registration status updates
 * - Theme-aware styling with dark/light mode support
 * - Animated gradient border for visual appeal
 * 
 * @returns JSX element containing the AI client selector popover
 */
export default function AIClientSelector() {
    // States
    /** Whether Claude Desktop is registered with MCP */
    const [claudeRegistered, setClaudeRegistered] = useState<boolean>(false);
    /** Controls the visibility of the popover */
    const [visible, setVisible] = useState<boolean>(false);
    /** Whether the MCP binary is installed on the system */
    const [mcpBinaryInstalled, setMcpBinaryInstalled] = useState<boolean>(false);

    // Global Store
    /** Current dark mode state for theming */
    const darkMode = useAppStore(state => state.darkMode);
    /** Whether the extraction modal is visible */
    const extractionModalVisible = useLLMStore(state => state.extractionModalVisible);

    /**
     * Helper function to check if MCP binary is installed
     * 
     * Calls the backend command to verify MCP binary installation status
     * and updates the component state accordingly. Handles errors gracefully
     * by defaulting to false if the check fails.
     */
    const checkBinaryInstallation = useCallback(() => {
        mcpCommands.isMcpBinaryInstalled().then((result) => {
            if (result.status === "ok") {
                setMcpBinaryInstalled(result.data);
            } else {
                setMcpBinaryInstalled(false);
            }
        }).catch(() => {
            setMcpBinaryInstalled(false);
        });
    }, []);

    /**
     * Helper function to refresh MCP registration status
     * 
     * Checks if Claude Desktop is registered with the MCP server
     * and updates the component state. This determines whether the
     * Claude option is enabled or disabled in the selector.
     */
    const refreshRegistrationStatus = useCallback(() => {
        mcpCommands.isMcpRegistered("ClaudeDesktop").then((result) => {
            if (result.status === "ok") {
                setClaudeRegistered(result.data);
            } else {
                setClaudeRegistered(false);
            }
        }).catch(() => {
            setClaudeRegistered(false);
        });
    }, []);

    // Check binary installation status on component mount
    useEffect(() => {
        checkBinaryInstallation();
    }, [checkBinaryInstallation]);

    // Check MCP registration status on component mount
    useEffect(() => {
        if (mcpBinaryInstalled) {
            refreshRegistrationStatus();
        }
    }, [mcpBinaryInstalled, refreshRegistrationStatus]);

    // Refresh status when popover opens
    useEffect(() => {
        if (visible) {
            checkBinaryInstallation();
            if (mcpBinaryInstalled) {
                refreshRegistrationStatus();
            }
        }
    }, [visible, checkBinaryInstallation, mcpBinaryInstalled, refreshRegistrationStatus]);

    // Listen for MCP installation events to refresh status
    useEffect(() => {
        const unlistenInstall = mcpEvents.mcpInstallOutput.listen((event) => {
            const { status } = event.payload;
            // Refresh binary installation status when installation completes
            if (status === 'Success') {
                checkBinaryInstallation();
            }
        });

        return () => {
            unlistenInstall.then(f => f());
        };
    }, [checkBinaryInstallation]);

    // Listen for MCP registration events to refresh status
    useEffect(() => {
        const unlistenRegister = mcpEvents.mcpRegisterOutput.listen((event) => {
            const { status } = event.payload;
            // Refresh status when registration completes (success or error)
            if (status === 'Success' || status === 'Error') {
                // Small delay to ensure backend has updated
                setTimeout(() => {
                    refreshRegistrationStatus();
                }, 100);
            }
        });

        return () => {
            unlistenRegister.then(f => f());
        };
    }, [refreshRegistrationStatus]);

    // Styling
    /** Ant Design theme tokens for consistent styling */
    const { token } = theme.useToken();

    /** The content of the popover containing the AI client options or installation card */
    const popoverContent = !mcpBinaryInstalled ? (
        <McpBinaryInstallation
            onInstallationComplete={checkBinaryInstallation}
            containerWidth={320}
            containerMaxHeight={400}
        />
    ) : (
        <div style={{ width: 320, maxHeight: 400 }}>
            <div className="flex flex-col gap-3">
                <AIClientOption
                    client="chatgpt"
                    setVisible={setVisible}
                />
                <AIClientOption
                    client="claude"
                    setVisible={setVisible}
                    claudeRegistered={claudeRegistered}
                />
            </div>
        </div>
    );

    return (
        <Badge
            dot={extractionModalVisible}
            color={getBadgeColor(darkMode)}
        >
            <Popover
                className="animated-gradient-border"
                content={popoverContent}
                title={null}
                trigger="click"
                placement="bottomRight"
                open={visible}
                onOpenChange={setVisible}
                styles={{
                    body: {
                        backgroundColor: darkMode ? token.colorBgContainer : token.colorBgLayout,
                        borderRadius: token.borderRadiusLG,
                        borderColor: darkMode ? token.colorBgTextActive : token.colorBorder,
                        borderWidth: "0.5px",
                        borderStyle: "solid",
                        overflow: 'hidden',
                        boxShadow: token.boxShadow,
                    }
                }}
            >
                <PiSparkle
                    className="cursor-pointer"
                    style={{ fontSize: 18 }}
                />
            </Popover>
        </Badge>
    );
}

/**
 * Individual AI client option component that displays client information
 * and handles selection. Shows the client's icon, label, and description.
 * 
 * This component renders a clickable option for each AI client with:
 * - Client-specific icon (OpenAI logo for ChatGPT, Claude logo for Claude)
 * - Descriptive label and subtitle explaining the client's purpose
 * - Hover effects for better user interaction feedback
 * - Disabled state for unavailable clients (e.g., unregistered Claude)
 * - Tooltip for disabled options explaining how to enable them
 * 
 * @param client - The AI client identifier ('chatgpt' or 'claude')
 * @param setVisible - Function to control the popover visibility
 * @param claudeRegistered - Whether Claude Desktop is registered (optional, only for Claude)
 * @returns JSX element representing the AI client option
 */
function AIClientOption({ client, setVisible, claudeRegistered }: AIClientOptionProps) {
    /** Function to set the extraction modal visible state */
    const setExtractionModalVisible = useLLMStore(state => state.setExtractionModalVisible);
    /** Function to display notifications to the user */
    const openNotification = useAppStore(state => state.openNotification);

    /** Whether this client option should be disabled */
    const isDisabled = client === 'claude' && !claudeRegistered;

    /**
     * Handles client selection
     * 
     * Performs different actions based on the selected client:
     * - ChatGPT: Opens the extraction modal for query processing
     * - Claude: Opens Claude Desktop application via URL scheme
     * 
     * Provides user feedback through notifications and handles errors gracefully.
     */
    const handleSelect = () => {
        if (isDisabled) return;

        switch (client) {
            case 'chatgpt':
                setExtractionModalVisible(true);
                setVisible(false);
                break;
            case 'claude':
                if (claudeRegistered) {
                    openUrl('claude://')
                        .then(() => {
                            openNotification('Claude Desktop', NotificationType.SUCCESS, 'Claude Desktop opened successfully');
                            setVisible(false);
                        })
                        .catch((error) => {
                            console.error('Failed to open Claude Desktop:', error);
                            openNotification('Claude Desktop', NotificationType.ERROR, `Failed to open Claude Desktop: ${error instanceof Error ? error.message : String(error)}`);
                            setVisible(false);
                        });
                }
                break;
        }
    };

    /**
     * Gets client-specific information including icon, label, and description
     * 
     * @returns Object containing the client's display information
     */
    const getClientInfo = () => {
        switch (client) {
            case 'chatgpt':
                return {
                    icon: <OpenAIOutlined style={{ fontSize: 24 }} />,
                    label: 'ChatGPT',
                    description: 'Extract queries into EnzymeML objects and fetch from databases'
                };
            case 'claude':
                return {
                    icon: (
                        /* @ts-expect-error - icon is not typed */
                        <Icon style={{ fontSize: 24 }} component={ClaudeIcon} />
                    ),
                    label: 'Claude Desktop',
                    description: 'Interact with documents, inspect measurements, and ingest metadata'
                };
        }
    };

    const { icon, label, description } = getClientInfo();

    return (
        <div
            onClick={handleSelect}
            className={`m-2 flex flex-row gap-3 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}
            title={isDisabled ? "Please open Settings and install in 'MCP' section" : undefined}
        >
            <span>{icon}</span>
            <div className="flex flex-col">
                <p className="text-sm font-medium opacity-80 transition-opacity duration-0 group-hover:opacity-100">{label}</p>
                <p className="text-xs opacity-60 transition-opacity duration-0 group-hover:opacity-100">{description}</p>
            </div>
        </div>
    );
}

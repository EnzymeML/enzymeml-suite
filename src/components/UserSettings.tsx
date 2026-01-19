import { Modal, List, Divider, Typography, Menu, Input, Button, theme, Space } from "antd";
import Icon from "@ant-design/icons";
import { CheckOutlined, SettingOutlined, AppstoreOutlined, ApiOutlined, KeyOutlined, SunOutlined, MoonOutlined, MonitorOutlined } from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import { emit } from "@tauri-apps/api/event";

import useAppStore from "@stores/appstore.ts";
import { NotificationType } from "@components/NotificationProvider.tsx";
import { getOpenAIToken, setOpenAIToken as saveOpenAIToken } from "@commands/settings.ts";
import { commands as mcpCommands, events as mcpEvents, ClientType } from "@commands/mcp";
import McpBinaryInstallation from "@components/McpBinaryInstallation";
import SmallMoleculeIcon from "@icons/smallmolecule.svg";
import ProteinIcon from "@icons/protein.svg";
import ClaudeIcon from "@icons/claude.svg";
import CursorIcon from "@icons/cursor.svg";

const { Title } = Typography;

export enum ThemeSubMenuKeys {
    LIGHT = "theme-light",
    DARK = "theme-dark",
    SYSTEM = "theme-system"
}

type MenuKey = "general" | "mcp" | "api-tokens";

export default function UserSettings() {
    // States
    const [open, setOpen] = useState<boolean>(false);
    const [selectedKey, setSelectedKey] = useState<MenuKey>("general");
    const [openAIToken, setOpenAIToken] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [claudeRegistered, setClaudeRegistered] = useState<boolean>(false);
    const [cursorRegistered, setCursorRegistered] = useState<boolean>(false);
    const [registeringClient, setRegisteringClient] = useState<ClientType | null>(null);
    const [mcpBinaryInstalled, setMcpBinaryInstalled] = useState<boolean>(false);
    const themePreference = useAppStore((state) => state.themePreference);
    const databasesToUse = useAppStore((state) => state.databasesToUse);

    // Actions
    const setThemePreference = useAppStore((state) => state.setThemePreference);
    const setDatabasesToUse = useAppStore((state) => state.setDatabasesToUse);
    const openNotification = useAppStore((state) => state.openNotification);

    // Theme tokens for styling
    const { token } = theme.useToken();

    // Handlers
    const handleThemeChange = (key: string) => {
        switch (key) {
            case ThemeSubMenuKeys.LIGHT:
                storeTheme("light");
                break;
            case ThemeSubMenuKeys.DARK:
                storeTheme("dark");
                break;
            case ThemeSubMenuKeys.SYSTEM:
                storeTheme("system");
                break;
        }
    };

    const handleDatabaseChange = (db: string) => {
        if (databasesToUse.includes(db)) {
            setDatabasesToUse(databasesToUse.filter((item) => item !== db));
        } else {
            setDatabasesToUse([...databasesToUse, db]);
        }
    };

    const storeTheme = (theme: string) => {
        setThemePreference(theme);
        emit(
            'theme-change',
            { theme: theme }
        ).catch((error) => console.error("Error emitting theme-change event:", error));
    };

    // Menu items for sidebar
    const menuItems = [
        { key: "general", label: "General", icon: <AppstoreOutlined /> },
        { key: "mcp", label: "MCP", icon: <ApiOutlined /> },
        { key: "api-tokens", label: "API Tokens", icon: <KeyOutlined /> }
    ];

    // Theme options data
    const themeOptions = [
        { key: ThemeSubMenuKeys.LIGHT, label: "Light", icon: <SunOutlined /> },
        { key: ThemeSubMenuKeys.DARK, label: "Dark", icon: <MoonOutlined /> },
        { key: ThemeSubMenuKeys.SYSTEM, label: "System", icon: <MonitorOutlined /> }
    ];

    // Database options data
    const databaseOptions = [
        // @ts-expect-error - icon is not typed
        { key: "pubchem", label: "PubChem", icon: <Icon style={{ fontSize: 13 }} component={SmallMoleculeIcon} /> },
        // @ts-expect-error - icon is not typed
        { key: "uniprot", label: "UniProt", icon: <Icon style={{ fontSize: 13 }} component={ProteinIcon} /> }
    ];

    // Load OpenAI token when API Tokens section is opened
    useEffect(() => {
        if (open && selectedKey === "api-tokens") {
            getOpenAIToken()
                .then(token => setOpenAIToken(token || ""))
                .catch(() => {
                    // Token not set yet, that's okay
                    setOpenAIToken("");
                });
        }
    }, [open, selectedKey]);

    /**
     * Helper function to check if MCP binary is installed
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

    // Helper function to refresh registration status
    const refreshRegistrationStatus = useCallback(() => {
        Promise.all([
            mcpCommands.isMcpRegistered("ClaudeDesktop"),
            mcpCommands.isMcpRegistered("Cursor")
        ]).then(([claudeResult, cursorResult]) => {
            if (claudeResult.status === "ok") {
                setClaudeRegistered(claudeResult.data);
            } else {
                setClaudeRegistered(false);
            }
            if (cursorResult.status === "ok") {
                setCursorRegistered(cursorResult.data);
            } else {
                setCursorRegistered(false);
            }
        }).catch(() => {
            setClaudeRegistered(false);
            setCursorRegistered(false);
        });
    }, []);

    // Check MCP binary installation when MCP section is opened
    useEffect(() => {
        if (open && selectedKey === "mcp") {
            checkBinaryInstallation();
            if (mcpBinaryInstalled) {
                refreshRegistrationStatus();
            }
        }
    }, [open, selectedKey, checkBinaryInstallation, mcpBinaryInstalled, refreshRegistrationStatus]);

    // Render General section content
    const renderGeneralContent = () => (
        <div>
            {/* App Theme Section */}
            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>App Theme</Title>
            <List
                dataSource={themeOptions}
                renderItem={(item) => (
                    <List.Item
                        style={{ cursor: "pointer", padding: "8px 12px" }}
                        onClick={() => handleThemeChange(item.key)}
                    >
                        <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                            <Space size={8}>
                                {item.icon}
                                <span style={{ fontSize: 13 }}>{item.label}</span>
                            </Space>
                            {themePreference === item.key.replace("theme-", "") && (
                                <CheckOutlined style={{ color: token.colorPrimary }} />
                            )}
                        </div>
                    </List.Item>
                )}
            />

            <Divider style={{ margin: "12px 0" }} />

            {/* Databases Section */}
            <Title level={5} style={{ marginBottom: 8 }}>Databases</Title>
            <List
                dataSource={databaseOptions}
                renderItem={(item) => (
                    <List.Item
                        style={{ cursor: "pointer", padding: "8px 12px" }}
                        onClick={() => handleDatabaseChange(item.key)}
                    >
                        <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                            <Space size={8}>
                                {item.icon}
                                <span style={{ fontSize: 13 }}>{item.label}</span>
                            </Space>
                            {databasesToUse.includes(item.key) && (
                                <CheckOutlined style={{ color: token.colorPrimary }} />
                            )}
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );

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

    // Listen for MCP registration events
    useEffect(() => {
        const unlistenRegister = mcpEvents.mcpRegisterOutput.listen((event) => {
            const { status, output } = event.payload;

            if (status === 'Success') {
                openNotification(
                    'Registration Complete',
                    NotificationType.SUCCESS,
                    output
                );
                setRegisteringClient(null);
                // Refresh registration status after a short delay to ensure backend has updated
                setTimeout(() => {
                    refreshRegistrationStatus();
                }, 100);
            } else if (status === 'Error') {
                openNotification(
                    'Registration Failed',
                    NotificationType.ERROR,
                    output
                );
                setRegisteringClient(null);
            } else if (status === 'Output') {
                // Log registration progress for debugging
                console.log('MCP registration progress:', output);
            }
        });

        return () => {
            unlistenRegister.then(f => f());
        };
    }, [openNotification, refreshRegistrationStatus]);

    // Render MCP section content
    const renderMcpContent = () => {
        const handleRegisterMcp = async (clientType: ClientType) => {
            setRegisteringClient(clientType);

            try {
                const result = await mcpCommands.registerMcp(clientType);
                if (result.status === "error") {
                    openNotification(
                        "Registration Failed",
                        NotificationType.ERROR,
                        result.error || "Failed to register MCP server."
                    );
                    setRegisteringClient(null);
                }
                // Success will be handled by the event listener
            } catch (error) {
                openNotification(
                    "Registration Failed",
                    NotificationType.ERROR,
                    error instanceof Error ? error.message : "Failed to register MCP server."
                );
                setRegisteringClient(null);
            }
        };

        // If binary is not installed, show installation card
        if (!mcpBinaryInstalled) {
            return (
                <McpBinaryInstallation
                    onInstallationComplete={checkBinaryInstallation}
                />
            );
        }

        // If binary is installed, show client registration options
        const mcpClients = [
            {
                type: "ClaudeDesktop" as ClientType,
                name: "Claude Desktop",
                // @ts-expect-error - icon is not typed
                icon: <Icon style={{ fontSize: 20 }} component={ClaudeIcon} />,
                registered: claudeRegistered,
                registering: registeringClient === "ClaudeDesktop"
            },
            {
                type: "Cursor" as ClientType,
                name: "Cursor",
                // @ts-expect-error - icon is not typed
                icon: <Icon style={{ fontSize: 20 }} component={CursorIcon} />,
                registered: cursorRegistered,
                registering: registeringClient === "Cursor"
            }
        ];

        return (
            <div>
                <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>MCP Integrations</Title>
                <p style={{ color: token.colorTextSecondary, marginBottom: 16, fontSize: 13 }}>
                    Register the EnzymeML MCP server with your AI client to enable integration.
                </p>

                <List
                    dataSource={mcpClients}
                    renderItem={(client) => (
                        <List.Item
                            style={{
                                padding: "8px 12px",
                                borderRadius: 4,
                                cursor: "default"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                                <Space size={12}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: token.colorText
                                    }}>
                                        {client.icon}
                                    </div>
                                    <span style={{ fontSize: 14 }}>{client.name}</span>
                                </Space>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleRegisterMcp(client.type)}
                                    loading={client.registering}
                                    disabled={client.registered || (registeringClient !== null && registeringClient !== client.type)}
                                    style={{ minWidth: 100 }}
                                >
                                    {client.registered ? "Installed" : "Install"}
                                </Button>
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    // Render API Tokens section content
    const renderApiTokensContent = () => {
        const handleSaveToken = async () => {
            if (!openAIToken.trim()) {
                openNotification("Invalid Token", NotificationType.WARNING, "Please enter a valid OpenAI API token.");
                return;
            }
            setLoading(true);
            try {
                await saveOpenAIToken(openAIToken.trim());
                openNotification("Token Saved", NotificationType.SUCCESS, "OpenAI API token has been saved successfully.");
            } catch (error) {
                openNotification("Save Failed", NotificationType.ERROR, error instanceof Error ? error.message : "Failed to save API token.");
            } finally {
                setLoading(false);
            }
        };

        return (
            <div>
                <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>OpenAI API Token</Title>
                <p style={{ color: token.colorTextSecondary, marginBottom: 12, fontSize: 13 }}>
                    Enter your OpenAI API token to enable AI-powered data extraction features.
                </p>
                <Input.Password
                    placeholder="sk-..."
                    value={openAIToken}
                    onChange={(e) => setOpenAIToken(e.target.value)}
                    style={{ marginBottom: 12 }}
                    size="small"
                />
                <Button
                    type="primary"
                    onClick={handleSaveToken}
                    loading={loading}
                    size="small"
                >
                    Save Token
                </Button>
            </div>
        );
    };

    // Render content based on selected menu item
    const renderContent = () => {
        switch (selectedKey) {
            case "general":
                return renderGeneralContent();
            case "mcp":
                return renderMcpContent();
            case "api-tokens":
                return renderApiTokensContent();
            default:
                return renderGeneralContent();
        }
    };

    return (
        <>
            <a onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
                <SettingOutlined />
            </a>
            <Modal
                title="Settings"
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={600}
                centered
                styles={{
                    content: {
                    }
                }}
            >
                <div style={{ display: "flex", height: "350px" }}>
                    {/* Sidebar */}
                    <div style={{ width: "160px", borderRight: `1px solid ${token.colorBorder}`, paddingRight: 12 }}>
                        <Menu
                            mode="inline"
                            selectedKeys={[selectedKey]}
                            items={menuItems}
                            onClick={({ key }) => setSelectedKey(key as MenuKey)}
                            style={{ border: "none", backgroundColor: "transparent", fontSize: 13 }}
                        />
                    </div>
                    {/* Content Area */}
                    <div style={{ flex: 1, paddingLeft: 20, overflowY: "auto" }}>
                        {renderContent()}
                    </div>
                </div>
            </Modal>
        </>
    );
}
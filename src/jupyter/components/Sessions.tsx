import { useState, useEffect } from 'react';
import { Space, Typography, theme, Tooltip, Divider, Tag, Button, Dropdown, Spin } from 'antd';
import { FolderOpenOutlined, PythonOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

import useAppStore from '@stores/appstore';
import SessionList from '@jupyter/components/SessionList';
import { NotificationType } from '@components/NotificationProvider';
import { PythonInstallation } from '@commands/jupyter';
import {
    detectPythonInstallations,
    getSelectedPython,
    setSelectedPython,
    openProjectFolder,
    addPythonEnv,
    getSourceColor,
} from '@jupyter/utils';
import PythonMenuItem from '@jupyter/components/PythonMenuItem';

const { Text } = Typography;

export default function Sessions() {
    // States
    const [pythons, setPythons] = useState<PythonInstallation[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Global actions
    const openNotification = useAppStore(state => state.openNotification);
    const triggerInstallCheck = useAppStore(state => state.triggerJupyterCheck);

    // Load Python installations and selected Python on mount
    useEffect(() => {
        loadPythonInstallations();
    }, []);

    const loadPythonInstallations = async () => {
        setLoading(true);
        try {
            // Detect Python installations (this also auto-selects the best one and includes custom envs)
            const detected = await detectPythonInstallations();

            setPythons(detected);

            // Get the currently selected Python
            const selected = await getSelectedPython();
            setSelectedPath(selected);
        } catch (error) {
            openNotification('Error', NotificationType.ERROR, 'Failed to detect Python installations: ' + error);
        } finally {
            setLoading(false);
        }
    };

    const handlePythonSelect = async (path: string) => {
        try {
            const success = await setSelectedPython(path, openNotification);
            if (success) {
                setSelectedPath(path);
                setDropdownOpen(false);

                // Trigger installation check to verify JupyterLab with new Python
                triggerInstallCheck?.();
            }
        } catch (error) {
            openNotification('Error', NotificationType.ERROR, 'Failed to select Python: ' + error);
        }
    };

    const handleAddPythonEnv = async () => {
        try {
            await addPythonEnv();
            // Reload Python installations after adding a new environment
            await loadPythonInstallations();
            openNotification('Success', NotificationType.SUCCESS, 'Python environment added successfully');
        } catch (error) {
            openNotification('Error', NotificationType.ERROR, 'Failed to add Python environment: ' + error);
        }
    };

    // Find the currently selected Python installation details
    const selectedPython = pythons.find(p => p.path === selectedPath);

    // Create dropdown menu items
    const menuItems: MenuProps['items'] = pythons.map((python) => ({
        key: python.path,
        label: <PythonMenuItem python={python} />,
        onClick: () => handlePythonSelect(python.path),
    }));

    menuItems.push(
        {
            key: "custom-setter",
            label: (
                <div className="flex justify-center w-full">
                    <Tooltip
                        title={"Add a custom local Python environment. This is particularly useful, when automatic detection fails."}
                        mouseEnterDelay={2}
                        placement='bottom'
                    >
                        <Button
                            icon={<PlusOutlined />}
                            variant='filled'
                            onClick={handleAddPythonEnv}
                            size='small'
                            className="w-full"
                        />
                    </Tooltip>
                </div>
            )
        }
    )


    // Styling
    const { token } = theme.useToken();

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <Space>
                    <div className="flex flex-col gap-2 justify-start">
                        <div className="flex flex-row gap-2 justify-between items-center">
                            <div className="flex flex-row gap-2 items-center">
                                <Text strong>Jupyter Session</Text>
                                <Tooltip
                                    title="Open Project Folder"
                                    mouseEnterDelay={1}
                                    styles={
                                        {
                                            body: {
                                                fontSize: token.fontSizeSM
                                            }
                                        }
                                    }
                                >
                                    <Button
                                        icon={<FolderOpenOutlined />}
                                        variant="link"
                                        onClick={() => openProjectFolder(openNotification)}
                                    />
                                </Tooltip>
                            </div>
                            {loading ? (
                                <Spin size="small" />
                            ) : (
                                <Dropdown
                                    menu={{ items: menuItems }}
                                    trigger={['click']}
                                    open={dropdownOpen}
                                    onOpenChange={setDropdownOpen}
                                    disabled={pythons.length === 0}
                                >
                                    <Tag
                                        icon={<PythonOutlined />}
                                        color={selectedPython ? getSourceColor(selectedPython.source) : 'default'}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        {selectedPython ? (
                                            <>
                                                {selectedPython.version} <DownOutlined style={{ fontSize: '10px' }} />
                                            </>
                                        ) : (
                                            'No Python'
                                        )}
                                    </Tag>
                                </Dropdown>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            Opens a Jupyter Lab session in the browser for further programmatic analysis.
                        </Text>
                    </div>
                </Space >
            </div >

            <Divider size='small' />

            {/* Sessions List */}
            < div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: token.marginSM }}>
                <SessionList />
            </div >
        </>
    )
}
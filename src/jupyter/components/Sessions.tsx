import { useState, useEffect } from 'react';
import { Space, Typography, theme, Tooltip, Divider, Tag, Button } from 'antd';
import { FolderOpenOutlined, PythonOutlined } from '@ant-design/icons';

import useAppStore from '@stores/appstore';
import SessionList from '@jupyter/components/SessionList';
import { NotificationType } from '@components/NotificationProvider';
import { PythonVersion } from '@commands/jupyter';
import { getPythonVersion, openProjectFolder } from '@jupyter/utils';

const { Text } = Typography;

export default function Sessions() {
    // States
    const [pythonVersion, setPythonVersion] = useState<PythonVersion | null>(null);

    // Global actions
    const openNotification = useAppStore(state => state.openNotification);

    useEffect(() => {
        getPythonVersion().then(result => {
            try {
                setPythonVersion(result);
            } catch (error) {
                openNotification('Error', NotificationType.ERROR, 'Failed to get Python version' + error);
            }
        });
    }, []);

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
                            <Tooltip title="Detected Python version">
                                <Tag icon={<PythonOutlined />} color="success" >
                                    {pythonVersion?.version}
                                </Tag>
                            </Tooltip>
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
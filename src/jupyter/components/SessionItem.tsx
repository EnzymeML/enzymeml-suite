import { Button, Space, Typography, theme, Tooltip } from 'antd';
import { CloseOutlined, ExportOutlined } from '@ant-design/icons';
import { openUrl } from '@tauri-apps/plugin-opener';

import { JupyterSessionInfo } from '@commands/jupyter';
import { NotificationType } from '@components/NotificationProvider';

const { Text } = Typography;

interface JupyterSessionItemProps {
    /** The Jupyter session data */
    session: JupyterSessionInfo;
    /** Loading state for the terminate action */
    isTerminating: boolean;
    /** Function to display notifications */
    openNotification: (title: string, type: NotificationType, message: string) => void;
    /** Callback when session termination is requested */
    onTerminate: (sessionId: string) => void;
}

/**
 * JupyterSessionItem - Displays a single Jupyter session with status indicator and action buttons
 */
export default function SessionItem({
    session,
    isTerminating,
    openNotification,
    onTerminate
}: JupyterSessionItemProps) {
    const { token } = theme.useToken();

    /**
     * Opens a Jupyter session in the browser
     */
    const handleOpenSession = () => {
        openUrl(session.url);
        openNotification(
            'Session Opened',
            NotificationType.SUCCESS,
            `Jupyter session opened in browser`
        );
    };

    return (
        <div
            style={{
                marginBottom: token.marginXXS,
                padding: token.paddingSM,
                borderRadius: token.borderRadius,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = token.colorFillTertiary;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={handleOpenSession}
                >
                    {/* Green dot indicator for running session */}
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: token.colorSuccess,
                            flexShrink: 0
                        }}
                    />
                    <Space direction="vertical" size={0} style={{ flex: 1 }}>
                        <Space size="small">
                            <Text strong style={{ fontSize: token.fontSizeSM }}>
                                {session.id}
                            </Text>
                        </Space>
                    </Space>
                </Space>

                {/* Action buttons */}
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Open in Browser">
                        <Button
                            type="text"
                            size="small"
                            icon={<ExportOutlined />}
                            onClick={handleOpenSession}
                        />
                    </Tooltip>
                    <Tooltip title="Terminate Session">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<CloseOutlined />}
                            loading={isTerminating}
                            onClick={() => onTerminate(session.id)}
                        />
                    </Tooltip>
                </Space>
            </Space>
        </div>
    );
}

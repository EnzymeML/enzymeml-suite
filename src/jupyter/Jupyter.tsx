import { useState, useEffect } from 'react';
import { Popover, theme } from 'antd';
import Sessions from '@jupyter/components/Sessions';
import useAppStore from '@stores/appstore';
import Installation from '@jupyter/components/Installation';
import { isPythonInstalled, isJupyterLabInstalled } from './utils';

export const CHECK_INTERVAL = 2000;

/**
 * Props for the JupyterSessionManager component
 */
interface JupyterSessionManagerProps {
    /** The child element that will trigger the Jupyter session popover when clicked */
    children: React.ReactNode;
}

/**
 * JupyterSessionManager - A popover component for managing Jupyter Lab sessions
 * 
 * This component provides a user interface for viewing, creating, and managing
 * Jupyter Lab sessions. It displays active sessions in a popover that can be
 * triggered by clicking on the child element.
 * 
 * Features:
 * - View all active Jupyter sessions with their ports and status
 * - Create new Jupyter sessions on available ports
 * - Open existing sessions in the browser
 * - Terminate running sessions
 * - Real-time session status updates
 * - Automatic port selection for new sessions
 * 
 * @param children - The trigger element for the popover
 * @returns A Popover component containing the Jupyter session management interface
 */
export default function JupyterSessionManager({ children }: JupyterSessionManagerProps) {
    // States
    const [pythonInstalled, setPythonInstalled] = useState(false);
    const [jupyterInstalled, setJupyterInstalled] = useState(false);

    // Styling
    const { token } = theme.useToken();

    // Global Store
    const darkMode = useAppStore((state) => state.darkMode);

    /** Check installation status of Python and JupyterLab */
    const checkInstallationStatus = async () => {
        try {
            const [python, jupyter] = await Promise.all([
                isPythonInstalled(),
                isJupyterLabInstalled()
            ]);
            setPythonInstalled(python);
            setJupyterInstalled(jupyter);
        } catch (error) {
            console.error('Failed to check installation status:', error);
            setPythonInstalled(false);
            setJupyterInstalled(false);
        }
    };

    // Check installation status on every render
    useEffect(() => {
        checkInstallationStatus();
    });

    // Also set up periodic checking every 5 seconds
    useEffect(() => {
        const interval = setInterval(checkInstallationStatus, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    /** Renders the appropriate content based on installation status */
    const renderContent = () => {
        if (pythonInstalled && jupyterInstalled) {
            return <Sessions />;
        }
        return <Installation />;
    };

    /** The content of the popover containing the session management interface */
    const popoverContent = (
        <div style={{ width: 320, maxHeight: 400 }}>
            {renderContent()}
        </div>
    );


    return (
        <Popover
            className="animated-gradient-border"
            content={popoverContent}
            title={null}
            trigger="click"
            placement="bottomRight"
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
            {children}
        </Popover>
    );
}

import { commands, events } from '@suite/commands/jupyter';
import { Typography, theme, Steps, Divider, Button, Tag, Space } from 'antd';
import { PythonOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { isPythonInstalled, isJupyterLabInstalled, getSelectedPython, listDetectedPythons, addPythonEnv } from '../utils';
import { CHECK_INTERVAL } from '@jupyter/Jupyter';
import useAppStore from '@stores/appstore';
import { NotificationType } from '@components/NotificationProvider';
import { PythonInstallation } from '@commands/jupyter';

const { Text } = Typography;

/** URL for downloading Python from the official website */
const PYTHON_DOWNLOAD_URL = "https://www.anaconda.com/download/success";

/**
 * Enumeration of installation steps for Python and JupyterLab setup
 */
enum InstallationStep {
    /** Step to download and install Python */
    DOWNLOAD_PYTHON = 0,
    /** Step to install JupyterLab */
    INSTALL_JUPYTER = 1,
    /** Installation completed successfully */
    COMPLETED = 2
}

/**
 * Component for the Python download and installation step
 * 
 * @param currentStep - The current installation step
 * @param selectedPython - The selected Python installation (if any)
 * @param onSelectCustom - Callback function to handle custom Python selection
 * @returns JSX element with Python download instructions and button
 */
function DownloadAndInstallPython(
    {
        currentStep,
        selectedPython,
        onSelectCustom,
    }: {
        currentStep: InstallationStep;
        selectedPython: PythonInstallation | null;
        onSelectCustom: () => void;
    }
) {
    return (
        <div className="flex flex-col gap-2 items-start">
            <span className="text-xs font-light">
                We recommend installing Anaconda, which includes Python and JupyterLab out of the box. You can download it from the official website. Please make sure to check "Add Python to PATH" during installation.
            </span>
            {currentStep === InstallationStep.DOWNLOAD_PYTHON && (
                <Space.Compact>
                    <Button
                        className='scale-95 font-xs'
                        variant="solid"
                        size="small"
                        color='primary'
                        type="link">
                        <a href={PYTHON_DOWNLOAD_URL}>
                            Donwload Anaconda
                        </a>
                    </Button>
                    <Button
                        className='scale-95 font-xs'
                        variant="outlined"
                        size="small"
                        color='primary'
                        onClick={onSelectCustom}>
                        Select Custom
                    </Button>
                </Space.Compact>
            )}
            {selectedPython && (
                <Space>
                    <Tag icon={<PythonOutlined />} color="success">
                        Python {selectedPython.version} ({selectedPython.source})
                    </Tag>
                </Space>
            )}
        </div >
    );
}

/**
 * Component for the JupyterLab installation step
 * 
 * @param currentStep - The current installation step
 * @param onInstallJupyter - Callback function to handle JupyterLab installation
 * @param isLoading - Whether the installation is in progress
 * @returns JSX element with JupyterLab installation instructions and button
 */
function InstallJupyterLab(
    {
        currentStep,
        onInstallJupyter,
        isLoading,
    }: {
        currentStep: InstallationStep;
        onInstallJupyter: () => void;
        isLoading: boolean;
    }
) {
    return (
        <div className="flex flex-col gap-2 items-start">
            <span className="text-xs font-light">
                Install JupyterLab to start working with notebooks
            </span>
            {currentStep === InstallationStep.INSTALL_JUPYTER && (
                <Button
                    className='scale-95 font-xs'
                    variant="solid"
                    size="small"
                    color='primary'
                    loading={isLoading}
                    disabled={isLoading}
                    onClick={onInstallJupyter}>
                    {isLoading ? 'Installing...' : 'Install JupyterLab'}
                </Button>
            )}
        </div>
    );
}

/**
 * Installation component for setting up Python and JupyterLab
 * 
 * This component provides a step-by-step installation guide for Python and JupyterLab.
 * It automatically detects the current installation status and guides users through
 * the necessary steps to complete the setup.
 * 
 * Features:
 * - Automatic detection of Python and JupyterLab installation status
 * - Step-by-step visual guide using Ant Design Steps component
 * - Direct download link for Python
 * - One-click JupyterLab installation
 * - Real-time status updates with periodic checking
 * - Completion confirmation when both tools are installed
 * 
 * @returns JSX element containing the installation interface
 */
export default function Installation() {
    // States
    /** Current installation step state */
    const [currentStep, setCurrentStep] = useState(0);
    /** Loading state for JupyterLab installation */
    const [isInstallingJupyter, setIsInstallingJupyter] = useState(false);
    /** Selected Python installation information */
    const [selectedPython, setSelectedPython] = useState<PythonInstallation | null>(null);

    // Global actions
    const openNotification = useAppStore((state) => state.openNotification);

    /**
     * Checks the installation status of Python and JupyterLab
     * and updates the current step accordingly
     */
    const checkInstallationStatus = async () => {
        try {
            console.log('Checking installation status...');
            const pythonInstalled = await isPythonInstalled();
            console.log('Python installed:', pythonInstalled);

            if (!pythonInstalled) {
                setCurrentStep(InstallationStep.DOWNLOAD_PYTHON);
                setSelectedPython(null);
                return;
            }

            // Get selected Python and find its details
            try {
                const selectedPath = await getSelectedPython();
                if (selectedPath) {
                    const pythons = await listDetectedPythons();
                    const python = pythons.find(p => p.path === selectedPath);
                    setSelectedPython(python || null);
                }
            } catch (error) {
                console.warn('Failed to get Python details:', error);
            }

            const jupyterInstalled = await isJupyterLabInstalled();
            console.log('Jupyter installed:', jupyterInstalled);

            if (!jupyterInstalled) {
                setCurrentStep(InstallationStep.INSTALL_JUPYTER);
                return;
            }

            setCurrentStep(InstallationStep.COMPLETED);
            // Clear loading state when installation is detected as complete
            if (isInstallingJupyter) {
                setIsInstallingJupyter(false);
                openNotification(
                    'Setup Complete!',
                    NotificationType.SUCCESS,
                    'Python and JupyterLab are both installed and ready to use.'
                );
            }
        } catch (error) {
            console.error('Failed to check installation status:', error);
            openNotification(
                'Status Check Failed',
                NotificationType.WARNING,
                'Unable to verify installation status. Please check your Python and pip installation.'
            );
            // Default to first step on error
            setCurrentStep(InstallationStep.DOWNLOAD_PYTHON);
        }
    };

    // Check installation status on component mount
    useEffect(() => {
        checkInstallationStatus();
    }, []);

    // Set up periodic checking every CHECK_INTERVAL seconds as backup
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentStep !== InstallationStep.COMPLETED) {
                checkInstallationStatus();
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [currentStep]);

    // Listen for JupyterLab installation events
    useEffect(() => {
        const unlisten = events.jupyterInstallOutput.listen((event) => {
            console.log('Jupyter install event:', event.payload);

            if (event.payload.status === 'Success') {
                openNotification(
                    'Installation Complete',
                    NotificationType.SUCCESS,
                    'JupyterLab has been installed successfully and is ready to use.'
                );
                setIsInstallingJupyter(false);
                checkInstallationStatus(); // Force check after successful installation
            } else if (event.payload.status === 'Error') {
                openNotification(
                    'Installation Failed',
                    NotificationType.ERROR,
                    `JupyterLab installation failed: ${event.payload.output}`
                );
                setIsInstallingJupyter(false);
            } else if (event.payload.status === 'Output') {
                // Log installation progress for debugging
                console.log('Installation progress:', event.payload.output);
            }
        });

        return () => {
            unlisten.then(f => f());
        };
    }, [openNotification, checkInstallationStatus]);

    /**
     * Handles the JupyterLab installation process
     * Calls the installation command and relies on event listeners for status updates
     */
    const handleInstallJupyter = async () => {
        openNotification(
            'Starting Installation',
            NotificationType.INFO,
            'Installing JupyterLab and its dependencies. This may take a few minutes...'
        );

        setIsInstallingJupyter(true);
        try {
            const result = await commands.installJupyterLab();
            if (result.status === 'error') {
                openNotification(
                    'Installation Command Failed',
                    NotificationType.ERROR,
                    `Failed to start installation: ${result.error}`
                );
                setIsInstallingJupyter(false);
            }
            // Event listeners will handle successful completion
        } catch (error) {
            openNotification(
                'Installation Error',
                NotificationType.ERROR,
                `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
            );
            setIsInstallingJupyter(false);
        }
    };

    /**
     * Handles custom Python environment selection
     * Opens a file dialog for the user to select a custom Python installation
     */
    const handleSelectCustomPython = async () => {
        try {
            await addPythonEnv();
            // Re-check installation status to verify the newly added Python
            await checkInstallationStatus();
            openNotification('Success', NotificationType.SUCCESS, 'Python environment added successfully');
        } catch (error) {
            openNotification('Error', NotificationType.ERROR, 'Failed to add Python environment: ' + error);
        }
    };

    // Styling
    const { token } = theme.useToken();

    /**
     * Helper function to determine the status of each step
     * 
     * @param stepIndex - The step index to check
     * @returns The status of the step ('finish', 'process', or 'wait')
     */
    const getStepStatus = (stepIndex: InstallationStep): 'finish' | 'process' | 'wait' => {
        if (currentStep > stepIndex) return 'finish';
        if (currentStep === stepIndex) return 'process';
        return 'wait';
    };

    // Step Items
    /** Configuration for the installation steps */
    const stepItems = [
        {
            title: <span className="font-bold">Download & Install Python</span>,
            description: <DownloadAndInstallPython currentStep={currentStep} selectedPython={selectedPython} onSelectCustom={handleSelectCustomPython} />,
            status: getStepStatus(InstallationStep.DOWNLOAD_PYTHON)
        },
        {
            title: <span className="font-bold">Install JupyterLab</span>,
            description: <InstallJupyterLab currentStep={currentStep} onInstallJupyter={handleInstallJupyter} isLoading={isInstallingJupyter} />,
            status: getStepStatus(InstallationStep.INSTALL_JUPYTER)
        }
    ];


    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col gap-2 justify-start">
                    <div className="flex flex-row gap-2 items-center">
                        <Text strong>Python & JupyterLab Setup</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                        Follow these steps to set up Python and JupyterLab for your data science workflow
                    </Text>
                </div>
            </div>

            <Divider size='small' />

            {/* Installation Steps */}
            <div className="mx-4 mt-4">
                <Steps
                    direction="vertical"
                    size="small"
                    items={stepItems}
                />
            </div>
        </>
    );
}
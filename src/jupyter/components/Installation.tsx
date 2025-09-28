import { commands } from '@suite/commands/jupyter';
import { Typography, theme, Steps, Divider, Button } from 'antd';
import { useState, useEffect } from 'react';
import { isPythonInstalled, isJupyterLabInstalled } from '../utils';
import { CHECK_INTERVAL } from '@jupyter/Jupyter';

const { Text } = Typography;

/** URL for downloading Python from the official website */
const PYTHON_DOWNLOAD_URL = "https://www.python.org/downloads/";

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
 * @returns JSX element with Python download instructions and button
 */
function DownloadAndInstallPython(
    {
        currentStep,
    }: {
        currentStep: InstallationStep;
    }
) {
    return (
        <div className="flex flex-col gap-2 items-start">
            <span className="text-xs font-light">
                Get the latest Python version from the official website and install it. Make sure to check "Add Python to PATH" during installation.
            </span>
            {currentStep === InstallationStep.DOWNLOAD_PYTHON && (
                <Button
                    className='scale-95 font-xs'
                    variant="solid"
                    size="small"
                    color='primary'
                    onClick={() => window.open(PYTHON_DOWNLOAD_URL, '_blank')}
                    type="link">
                    Download Python
                </Button>
            )}
        </div >
    );
}

/**
 * Component for the JupyterLab installation step
 * 
 * @param currentStep - The current installation step
 * @param onInstallJupyter - Callback function to handle JupyterLab installation
 * @returns JSX element with JupyterLab installation instructions and button
 */
function InstallJupyterLab(
    {
        currentStep,
        onInstallJupyter,
    }: {
        currentStep: InstallationStep;
        onInstallJupyter: () => void;
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
                    onClick={onInstallJupyter}>
                    Install JupyterLab
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

    /**
     * Checks the installation status of Python and JupyterLab
     * and updates the current step accordingly
     */
    const checkInstallationStatus = async () => {
        try {
            const pythonInstalled = await isPythonInstalled();

            if (!pythonInstalled) {
                setCurrentStep(InstallationStep.DOWNLOAD_PYTHON);
                return;
            }

            const jupyterInstalled = await isJupyterLabInstalled();

            if (!jupyterInstalled) {
                setCurrentStep(InstallationStep.INSTALL_JUPYTER);
                return;
            }

            setCurrentStep(InstallationStep.COMPLETED);
        } catch (error) {
            console.error('Failed to check installation status:', error);
            // Default to first step on error
            setCurrentStep(InstallationStep.DOWNLOAD_PYTHON);
        }
    };

    // Check installation status on every render
    useEffect(() => {
        checkInstallationStatus();
    });

    // Set up periodic checking every CHECK_INTERVAL seconds as backup
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentStep !== InstallationStep.COMPLETED) {
                checkInstallationStatus();
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [currentStep]);

    /**
     * Handles the JupyterLab installation process
     * Calls the installation command and relies on periodic checking for status updates
     */
    const handleInstallJupyter = async () => {
        await commands.installJupyterLab();
        // The periodic check will automatically detect when installation is complete
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
            description: <DownloadAndInstallPython currentStep={currentStep} />,
            status: getStepStatus(InstallationStep.DOWNLOAD_PYTHON)
        },
        {
            title: <span className="font-bold">Install JupyterLab</span>,
            description: <InstallJupyterLab currentStep={currentStep} onInstallJupyter={handleInstallJupyter} />,
            status: getStepStatus(InstallationStep.INSTALL_JUPYTER)
        }
    ];

    // Add completion step if both are installed
    if (currentStep === InstallationStep.COMPLETED) {
        stepItems.push({
            title: <span className="font-bold text-green-600">Setup Complete!</span>,
            description: (
                <div className="flex flex-col gap-2 items-start">
                    <span className="text-xs font-light text-green-600">
                        Python and JupyterLab are both installed and ready to use.
                    </span>
                </div>
            ),
            status: 'finish' as const
        });
    }

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
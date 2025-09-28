import { commands, JupyterSessionInfo, JupyterTemplate, PythonVersion } from '@commands/jupyter';
import { NotificationType } from '@components/NotificationProvider';

export const isPythonInstalled = async (): Promise<boolean> => {
    try {
        const result = await commands.getPythonVersion();
        if (result.status === 'ok') {
            if (result.data.status === 'ok') {
                return true;
            } else if (result.data.status === 'error') {
                console.warn('Python installation check failed:', result.data.error);
            } else if (result.data.status === 'not_found') {
                console.warn('Python not found on system');
            }
        } else {
            console.warn('Python version command failed:', result.error);
        }
        return false;
    } catch (error) {
        console.error('Python installation check error:', error);
        return false;
    }
};

export const getPythonVersion = async (): Promise<PythonVersion> => {
    const result = await commands.getPythonVersion();
    if (result.status === 'ok') {
        return result.data;
    } else {
        throw new Error(result.error);
    }
};

export const isJupyterLabInstalled = async (): Promise<boolean> => {
    try {
        const result = await commands.isJupyterLabInstalled();

        if (result.status === 'ok') {
            return result.data;
        } else {
            console.warn('JupyterLab installation check failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('JupyterLab installation check error:', error);
        return false;
    }
};

export const getJupyterTemplateMetadata = async (): Promise<JupyterTemplate[]> => {
    const result = await commands.getJupyterTemplateMetadata();
    if (result.status === 'ok') {
        return result.data;
    } else {
        throw new Error(result.error);
    }
};

/**
 * Fetches the list of active Jupyter sessions from the backend
 * @param openNotification - Function to display notifications
 * @returns Promise resolving to sessions array or null on error
 */
export const fetchJupyterSessions = async (
    openNotification: (title: string, type: NotificationType, message: string) => void
): Promise<JupyterSessionInfo[] | null> => {
    try {
        const result = await commands.getJupyterSessions();
        if (result.status === 'ok') {
            return result.data;
        } else {
            openNotification('Error', NotificationType.ERROR, result.error);
            return null;
        }
    } catch (error) {
        openNotification('Error', NotificationType.ERROR, 'Failed to fetch Jupyter sessions' + error);
        return null;
    }
};

/**
 * Creates a new Jupyter session on the specified port
 * @param openNotification - Function to display notifications
 * @returns Promise resolving to true on success, false on failure
 */
export const createJupyterSession = async (
    openNotification: (title: string, type: NotificationType, message: string) => void,
    template: string | null
): Promise<boolean> => {
    try {
        const result = await commands.startJupyter(template);
        if (result.status === 'ok') {
            openNotification(
                'Session Created',
                NotificationType.SUCCESS,
                `New Jupyter session started. It will be available shortly.`
            );
            return true;
        } else {
            openNotification('Error', NotificationType.ERROR, result.error);
            return false;
        }
    } catch (error) {
        openNotification('Error', NotificationType.ERROR, 'Failed to create new Jupyter session' + error);
        return false;
    }
};

/**
 * Adds a template to the current project directory
 * @param templateName - The name of the template to add to the project
 * @param openNotification - Function to display notifications
 * @returns Promise resolving to true on success, false on failure
 */
export const addTemplateToProject = async (
    openNotification: (title: string, type: NotificationType, message: string) => void,
    templateName: string,
): Promise<boolean> => {
    const result = await commands.addTemplateToProject(templateName);
    if (result.status === 'ok') {
        openNotification('Template Added', NotificationType.SUCCESS, 'Template added to project');
        return true;
    } else {
        openNotification('Error', NotificationType.ERROR, 'Failed to add template to project');
        return false;
    }
};


/**
 * Terminates a specific Jupyter session
 * @param sessionId - The ID of the session to terminate
 * @param openNotification - Function to display notifications
 * @returns Promise resolving to true on success, false on failure
 */
export const terminateJupyterSession = async (
    sessionId: string,
    openNotification: (title: string, type: NotificationType, message: string) => void
): Promise<boolean> => {
    try {
        const result = await commands.killJupyter(sessionId);
        if (result.status === 'ok') {
            openNotification(
                'Session Terminated',
                NotificationType.SUCCESS,
                `Jupyter session ${sessionId} has been terminated`
            );
            return true;
        } else {
            openNotification('Error', NotificationType.ERROR, result.error);
            return false;
        }
    } catch (error) {
        openNotification('Error', NotificationType.ERROR, 'Failed to terminate Jupyter session' + error);
        return false;
    }
};

/**
 * Opens the project folder in the system file explorer
 * @param openNotification - Function to display notifications
 * @returns Promise resolving to true on success, false on failure
 */
export const openProjectFolder = async (
    openNotification: (title: string, type: NotificationType, message: string) => void
): Promise<boolean> => {
    const result = await commands.openProjectFolder();
    if (result.status === 'ok') {
        openNotification('Project Folder Opened', NotificationType.SUCCESS, 'Project folder opened');
        return true;
    } else {
        openNotification('Error', NotificationType.ERROR, 'Failed to open project folder');
        return false;
    }
};
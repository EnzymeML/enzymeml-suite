import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Badge, theme } from "antd";
import Icon, { PythonOutlined, QuestionCircleOutlined, SaveOutlined } from "@ant-design/icons";

import EnzymeMLLogoMono from "@icons/enzymeml_logo.svg";
import EnzymeMLLogoCol from "@icons/enzymeml_logo_coloured.svg";
import useAppStore from "@stores/appstore.ts";
import { saveEntry } from "@commands/dataio.ts";
import { NotificationType } from "@components/NotificationProvider.tsx";
import UserSettings from "@components/UserSettings.tsx";
import JupyterSessionManager from "@jupyter/Jupyter.tsx";
import useJupyterStore from "@stores/jupyterstore";
import { getBadgeColor } from "@components/CardHeader";
import FileMenu from "@components/FileMenu";

/** Current webview window instance for window management operations */
const appWindow = getCurrentWebviewWindow()

function WindowControls() {
    /**
     * Minimizes the application window
     * 
     * Uses Tauri's window API to minimize the current webview window
     */
    const minimizeWindow = async () => {
        await appWindow.minimize();
    }

    /**
     * Toggles the application window between maximized and normal state
     * 
     * Uses Tauri's window API to toggle the maximize state of the current webview window
     */
    const maximizeWindow = async () => {
        await appWindow.toggleMaximize();
    }

    /**
     * Closes the application window
     * 
     * Uses Tauri's window API to close the current webview window
     */
    const closeWindow = async () => {
        await appWindow.close();
    }

    return (
        <>
            {/* Close Button */}
            <button
                className="flex-none w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50"
                onClick={closeWindow}
            />
            {/* Minimize Button */}
            <button
                className="flex-none w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50"
                onClick={minimizeWindow}
            />
            {/* Maximize/Restore Button */}
            <button
                className="flex-none w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
                onClick={maximizeWindow}
            />
        </>
    )
}

/**
 * TitleButtons component renders action buttons in the title bar
 * 
 * This component provides a set of interactive buttons for common application actions:
 * - Jupyter session management with session count badge
 * - Save entry functionality with notifications
 * - User settings access
 * - Help/documentation access
 * 
 * The buttons are styled consistently and provide visual feedback through badges
 * and hover states. The Jupyter button shows a dot badge when sessions are active.
 * 
 * @returns JSX element containing the title bar action buttons
 */
function TitleButtons() {
    // Actions
    /** Function to display notifications to the user */
    const openNotification = useAppStore(state => state.openNotification);

    // Global Store
    /** Current number of active Jupyter sessions */
    const numberOfSessions = useJupyterStore(state => state.numberOfSessions);
    /** Current dark mode state for theming */
    const darkMode = useAppStore(state => state.darkMode);

    /**
     * Saves the current entry and displays a notification
     * 
     * Attempts to save the current entry data and provides user feedback
     * through notifications. Shows success notification on successful save,
     * error notification with details on failure.
     */
    const saveEntryAndNotify = () => {
        saveEntry()
            .then(() => {
                openNotification('Entry saved', NotificationType.SUCCESS, 'Your entry has been saved successfully');
            })
            .catch((error) => {
                openNotification('Error saving entry', NotificationType.ERROR, error.toString());
            })
    }

    return (
        <div className={"flex flex-row items-center space-x-2"}>
            {/* Jupyter Session Manager with active session indicator */}
            <JupyterSessionManager>
                <Badge dot={numberOfSessions > 0} color={getBadgeColor(darkMode)}>
                    <PythonOutlined style={{ fontSize: 16 }} />
                </Badge>
            </JupyterSessionManager>
            {/* Save Entry Button */}
            <SaveOutlined onClick={saveEntryAndNotify} />
            {/* User Settings */}
            <UserSettings />
            {/* Help/Documentation */}
            <QuestionCircleOutlined />
        </div >
    );
}

/**
 * TitleBar component provides the application's title bar with window controls and optional action buttons
 * 
 * This component renders a custom title bar that replaces the default system title bar,
 * providing a consistent cross-platform experience. It includes:
 * 
 * Features:
 * - macOS-style window controls (close, minimize, maximize) with hover effects
 * - EnzymeML logo that links to the official website
 * - Optional action buttons for common application functions
 * - Drag region for window movement
 * - Theme-aware styling that adapts to dark/light mode
 * - Rounded corners and borders for modern appearance
 * 
 * The title bar is fully draggable except for interactive elements, and provides
 * visual feedback for all user interactions.
 * 
 * @param useButtons - Optional boolean to show/hide the action buttons in the title bar
 * @returns JSX element representing the complete title bar interface
 */
export default function TitleBar(
    { useButtons }: { useButtons?: boolean }
) {
    // States
    /** Current dark mode state for theming */
    const darkMode = useAppStore(state => state.darkMode);

    /** Ant Design theme tokens for consistent styling */
    const { token } = theme.useToken();

    return (
        <div className="flex flex-col w-full"
            data-tauri-drag-region
            style={{
                background: darkMode ? token.colorBgBase : token.colorBgLayout,
                borderTopLeftRadius: token.borderRadiusLG,
                borderTopRightRadius: token.borderRadiusLG,
                color: token.colorText,
                borderColor: token.colorBorder,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderStyle: 'solid',
            }}
        >
            <div className="grid grid-cols-3 items-center px-4 h-12" data-tauri-drag-region>
                {/* Window Controls - macOS style traffic light buttons */}
                <div className="flex justify-self-start items-center space-x-2">
                    {/* Window Controls */}
                    <WindowControls />
                    {/* File Menu */}
                    <div className="pl-5">
                        <FileMenu />
                    </div>
                </div>
                {/* EnzymeML Logo - Links to official website - Perfectly centered */}
                <div className="justify-self-center">
                    <a href={"https://enzymeml.org"} target={"_blank"}>
                        {/* @ts-expect-error - icon is not typed */}
                        <Icon component={darkMode ? EnzymeMLLogoMono : EnzymeMLLogoCol}
                            style={{ fontSize: 25, color: token.colorTextDisabled }}
                        />
                    </a>
                </div>
                {/* Optional Action Buttons */}
                <div className="justify-self-end">
                    {
                        useButtons && <TitleButtons />
                    }
                </div>
            </div>
        </div>
    )
}
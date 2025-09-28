import { useEffect, useState } from 'react';
import { CloseOutlined, DownOutlined, EditOutlined, ExportOutlined, FileOutlined, FolderOpenOutlined, SaveOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Dropdown, Input, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useWindowTauriListener } from '@hooks/useTauriListener';
import { DBEntries, exportToJSON, getState, listEntries, loadEntry, loadJSON, newEntry, saveEntry } from '@commands/dataio';
import { EnzymeMLState } from '@commands/dataio';
import { setTitle as setDBTitle } from '@commands/enzmldoc';
import Icon from '@ant-design/icons';
import EnzymeMLLogoMono from '@icons/enzymeml_logo.svg';
import EnzymeMLLogoCol from '@icons/enzymeml_logo_coloured.svg';
import useAppStore from '@stores/appstore';
import { formatKeyboardShortcut } from '@utilities/osutils';
import { NotificationType } from '@components/NotificationProvider';

const MAX_RECENT_ENTRIES = 10;

const appWindow = getCurrentWebviewWindow()

/**
 * Props interface for the DocumentTitle component
 */
interface DocumentTitleProps {
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    isTitleInputFocused: boolean;
    setIsTitleInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * DocumentTitle component that renders an editable input field for the document title
 * Handles focus states and updates both local state and backend when title changes
 * 
 * @param props - The component props
 * @returns JSX element containing the title input field
 */
function DocumentTitle(
    {
        title,
        setTitle,
        isTitleInputFocused,
        setIsTitleInputFocused
    }: DocumentTitleProps
) {

    // Handlers
    /**
     * Handles title input changes
     * Only updates backend when there's at least one character to prevent
     * backend from defaulting to "EnzymeML Document" on empty input
     * 
     * @param value - The new input value
     */
    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (value.trim().length > 0) {
            setDBTitle(value);
        }
    };

    return (
        <Input
            size="small"
            placeholder="Title of the document"
            value={title}
            variant={isTitleInputFocused ? "outlined" : "borderless"}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={() => setIsTitleInputFocused(true)}
            onBlur={() => setIsTitleInputFocused(false)}
        />
    );
}

/**
 * Props interface for the FileSearchInput component
 */
interface FileSearchInputProps {
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    setIsSearchInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

function FileSearchInput(
    {
        searchInput,
        setSearchInput,
        setIsSearchInputFocused
    }: FileSearchInputProps
) {
    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Input
                size="small"
                placeholder="Search for a document"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchInputFocused(true)}
                onBlur={() => setIsSearchInputFocused(false)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

/**
 * FileMenu component that provides a dropdown menu for file operations
 * Includes document title editing, file operations (open, save, export), and recent entries
 * 
 * Features:
 * - Editable document title with real-time backend sync
 * - File operations with keyboard shortcuts (Cmd/Ctrl+O, S, R)
 * - Recent document entries with EnzymeML logos
 * - Automatic dropdown opening when title input is focused
 * 
 * @returns JSX element containing the file menu dropdown
 */
export default function FileMenu() {
    /** Local input value to handle empty state before backend update */
    const [title, setTitle] = useState("");
    /** List of all available database entries for the recent documents submenu */
    const [allEntries, setAllEntries] = useState<DBEntries[]>([]);
    /** Search input value for the file search input */
    const [searchInput, setSearchInput] = useState("");
    /** Track whether the search input is focused */
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
    /** Control dropdown open state */
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Router
    const navigate = useNavigate();

    // Styling
    const { token } = theme.useToken();

    // Global States
    const darkMode = useAppStore((state) => state.darkMode);

    // Global Actions
    const openNotification = useAppStore((state) => state.openNotification);

    /** Track whether the title input is focused */
    const [isTitleInputFocused, setIsTitleInputFocused] = useState(false);

    // Tauri Hooks
    /**
     * Listens for document updates from the backend and refreshes local state
     * Updates both the document title and the list of available entries
     */
    useWindowTauriListener("update_document", () => {
        getState().then((state: EnzymeMLState) => {
            setTitle(state.title);
        });

        listEntries().then((data) => {
            setAllEntries(data);
        });
    }, []);

    // Effects
    /** 
     * Sync local title with backend state on component mount
     * Also loads the initial list of database entries
     */
    useEffect(() => {
        getState().then((state: EnzymeMLState) => {
            setTitle(state.title);
        });

        listEntries().then((data) => {
            setAllEntries(data);
        });
    }, []);

    /**
     * Menu items configuration for the dropdown
     * Includes title editor, file operations, and dynamic recent entries
     */
    const items: MenuProps['items'] = [
        {
            key: 'title',
            label: <DocumentTitle
                title={title}
                setTitle={setTitle}
                isTitleInputFocused={isTitleInputFocused}
                setIsTitleInputFocused={setIsTitleInputFocused}
            />,
            icon: <EditOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'new',
            label: 'New Document',
            icon: <FileOutlined />,
            extra: formatKeyboardShortcut('N'),
        },
        {
            key: 'save',
            label: 'Save Document',
            icon: <SaveOutlined />,
            extra: formatKeyboardShortcut('S'),
        },
        {
            key: 'open',
            label: 'Open Document',
            icon: <FolderOpenOutlined />,
            children: [
                {
                    key: 'open-from-file',
                    label: 'From File',
                    icon: <FileOutlined />,
                    extra: formatKeyboardShortcut('O'),
                },
                {
                    type: 'divider',
                },
                {
                    key: 'search-from-file',
                    label: <FileSearchInput
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        setIsSearchInputFocused={setIsSearchInputFocused}
                    />,
                },
            ],
        },
        {
            key: 'export',
            label: 'Export Document',
            icon: <ExportOutlined />,
            extra: formatKeyboardShortcut('R'),
        },
        {
            type: 'divider',
        },
        {
            key: 'close',
            label: 'Close Suite',
            icon: <CloseOutlined />,
            extra: formatKeyboardShortcut('W'),
        }
    ];

    // Add all entries to the items array
    /**
     * Dynamically adds recent document entries to the "Open Document" submenu
     * Each entry displays with an EnzymeML logo (colored or mono based on theme)
     */
    allEntries.forEach((entry, index) => {
        if (index >= MAX_RECENT_ENTRIES) {
            return;
        }
        if (searchInput.length !== 0 && !entry[0].toLowerCase().startsWith(searchInput.toLowerCase())) {
            return;
        }
        const openMenuItem = items[3];
        if (openMenuItem && 'children' in openMenuItem && openMenuItem.children) {
            openMenuItem.children.push({
                key: `entry-${entry[1].toString()}`,
                label: entry[0],
                icon: (
                    // @ts-expect-error - icon is not typed
                    <Icon component={darkMode ? EnzymeMLLogoMono : EnzymeMLLogoCol}
                        style={{ fontSize: 14, color: token.colorTextDisabled }}
                    />
                ),
            });
        }
    });

    /**
     * Handles menu item clicks and executes corresponding file operations
     * 
     * @param key - The key of the clicked menu item
     */
    const onClick: MenuProps['onClick'] = ({ key }) => {
        switch (key) {
            // Open Document
            case 'open-from-file':
                loadJSON();
                break;
            case 'new':
                newEntry().then(() => {
                    openNotification('New entry created', NotificationType.SUCCESS, 'Your new entry has been created successfully');
                    navigate('/');
                }).catch((error) => {
                    openNotification('Error creating new entry', NotificationType.ERROR, error.toString());
                });
                break;
            case 'save':
                saveEntry().then(() => {
                    openNotification('Entry saved', NotificationType.SUCCESS, 'Your entry has been saved successfully');
                }).catch((error) => {
                    openNotification('Error saving entry', NotificationType.ERROR, error.toString());
                });
                break;
            case 'export':
                exportToJSON();
                break;
            case 'close':
                appWindow.close();
                break;
            default:
                // Handle recent document entries
                if (key.startsWith('entry-')) {
                    loadEntry(parseInt(key.split('-')[1]));
                }
                break;
        }
    }

    /**
     * Handles dropdown open/close changes
     * Prevents closing when search input is focused
     */
    const handleOpenChange = (open: boolean) => {
        // Don't allow closing if search input is focused
        if (!open && isSearchInputFocused) {
            return;
        }
        setDropdownOpen(open);
    };

    return (
        <Dropdown
            menu={{ items, onClick }}
            trigger={['click']}
            open={dropdownOpen || isTitleInputFocused || isSearchInputFocused}
            onOpenChange={handleOpenChange}
        >
            <div className="flex gap-1 items-center opacity-75 cursor-pointer">
                <span className="text-sm font-semibold">{title || "File"}</span>
                <DownOutlined style={{ fontSize: 12 }} />
            </div>
        </Dropdown>
    );
}
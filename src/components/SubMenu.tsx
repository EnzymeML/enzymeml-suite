import useAppStore, {AvailablePaths, openNotificationType} from "../stores/appstore.ts";
import {Menu, MenuProps, theme} from "antd";
import {useLocation} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import NotificationProvider, {NotificationType} from "./NotificationProvider.tsx";
import {exportMeasurements, importMeasurement} from "../commands/dataio.ts";
import Grow from "../animations/Grow.tsx";
import {RightCircleOutlined} from "@ant-design/icons";
import {openVisualisation} from "../commands/visualisation.ts";
import {emit} from "@tauri-apps/api/event";
import {deriveModel} from "../commands/equations.ts";

export type MenuItem = Required<MenuProps>['items'][number];
type HandlerFunction = (key: string, openNotification: openNotificationType) => void;

interface SubMenuProps {
    items: MenuItem[];
    clickHandler: HandlerFunction;
    title: string;
}

const menuItems: { [key in AvailablePaths]: SubMenuProps | null } = {
    [AvailablePaths.SMALL_MOLECULES]: null,
    [AvailablePaths.VESSELS]: null,
    [AvailablePaths.PROTEINS]: null,
    [AvailablePaths.REACTIONS]: null,
    [AvailablePaths.HOME]: null,
    [AvailablePaths.MODELS]: {
        title: "Model Actions",
        items: [
            {
                key: "derive-model",
                label: "Derive Model",
                icon: <RightCircleOutlined/>
            }
        ],
        clickHandler: (key, openNotification) => {
            switch (key) {
                case 'derive-model':
                    deriveModel().then(
                        () => {
                            openNotification('Success', NotificationType.SUCCESS, 'Model derived successfully.');
                        }
                    ).catch(
                        (error) => {
                            openNotification('Error', NotificationType.ERROR, error.message);
                        }
                    );
                    break;
                default:
                    break;
            }
        }
    },
    [AvailablePaths.MEASUREMENTS]: {
        title: 'Actions',
        items: [
            {
                key: "view-data",
                label: 'Visualise Data',
                icon: <RightCircleOutlined/>
            },
            {
                key: 'export-template',
                label: 'Export Data',
                icon: <RightCircleOutlined/>
            },
            {
                key: 'import-data',
                label: 'Import Data',
                icon: <RightCircleOutlined/>
            }
        ],
        clickHandler: (key, openNotification) => {
            switch (key) {
                case 'export-template':
                    exportMeasurements().then(
                        () => {
                            openNotification('Success', NotificationType.SUCCESS, 'Template exported successfully.');
                        }
                    ).catch(
                        (error) => {
                            console.log("Error exporting template: ", error);
                        }
                    )
                    break;
                case 'import-data':
                    importMeasurement().then(
                        (amount) => {
                            openNotification('Success', NotificationType.SUCCESS, `${amount} measurements imported successfully.`);
                            emit('update_vis').then(() => null);
                            emit('update_nav').then(() => null);
                        }
                    ).catch(
                        (error) => {
                            openNotification('Error', NotificationType.ERROR, error.message);
                        }
                    )
                    break;
                case 'view-data':
                    openVisualisation().then(
                        () => {
                            openNotification('Success', NotificationType.SUCCESS, 'Visualisation opened successfully.');
                        }
                    ).catch(
                        (error) => {
                            openNotification('Warning', NotificationType.WARNING, error.message);
                        }
                    );
                    break;
                default:
                    break;
            }
        }
    }
};

export default function SubMenu() {

    // States
    const [subMenu, setSubMenu] = useState<SubMenuProps | null>(null)
    const darkMode = useAppStore(state => state.darkMode);
    const path = useLocation().pathname;
    const openNotification = useAppStore(state => state.openNotification);

    // References
    const pathRef = useRef(path);

    // Styling
    const {token} = theme.useToken();

    // Effects
    useEffect(() => {
        pathRef.current = path;
        setSubMenu(menuItems[path as AvailablePaths] || null);
    }, [path]);

    if (!subMenu) {
        return null;
    }

    // Handlers
    const handleClick: MenuProps["onClick"] = (e) => {
        if (subMenu.clickHandler) {
            subMenu.clickHandler(e.key, openNotification);
        }
    };

    return (
        <NotificationProvider>
            <Grow>
                <Menu className={"h-auto py-2 shadow-sm"}
                      style={{
                          background: token.colorBgContainer,
                          borderRadius: token.borderRadiusLG,
                          border: 0,
                          borderBottomLeftRadius: token.borderRadiusLG,
                          borderBottomRightRadius: token.borderRadiusLG,
                          borderBottom: 1,
                          borderStyle: 'solid',
                          borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                      }}
                      theme={darkMode ? "dark" : "light"}
                      mode="vertical"
                      selectedKeys={[]}
                      items={subMenu.items}
                      onClick={handleClick}
                />
            </Grow>
        </NotificationProvider>
    )
}
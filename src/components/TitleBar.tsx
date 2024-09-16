import {appWindow} from "@tauri-apps/api/window";
import {theme} from "antd";
import Icon, {QuestionCircleOutlined, SaveOutlined} from "@ant-design/icons";
import EnzymeMLLogoMono from "../icons/enzymeml_logo.svg";
import EnzymeMLLogoCol from "../icons/enzymeml_logo_coloured.svg";
import useAppStore from "../stores/appstore.ts";
import {saveEntry} from "../commands/dataio.ts";
import {NotificationType} from "./NotificationProvider.tsx";
import UserSettings from "./UserSettings.tsx";

function TitleButtons() {

    // Actions
    const openNotification = useAppStore(state => state.openNotification);

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
        <div className={"flex flex-row gap-2"}>
            <SaveOutlined onClick={saveEntryAndNotify}/>
            <UserSettings/>
            <QuestionCircleOutlined/>
        </div>
    );
}

export default function TitleBar() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    const {token} = theme.useToken();

    // Handlers
    const minimizeWindow = async () => {
        await appWindow.minimize();
    }

    const maximizeWindow = async () => {
        await appWindow.toggleMaximize();
    }

    const closeWindow = async () => {
        await appWindow.close();
    }


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
            <div className="flex flex-row justify-between items-center h-12 px-4" data-tauri-drag-region>
                <div className="flex space-x-2 mr-4">
                    <button
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50"
                        onClick={closeWindow}
                    />
                    <button
                        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50"
                        onClick={minimizeWindow}
                    />
                    <button
                        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
                        onClick={maximizeWindow}
                    />
                </div>
                <a href={"https://enzymeml.org"} target={"_blank"}>
                    {/* @ts-ignore */}
                    <Icon component={darkMode ? EnzymeMLLogoMono : EnzymeMLLogoCol}
                          style={{fontSize: 25, color: token.colorTextDisabled}}
                    />
                </a>
                <TitleButtons/>
            </div>
        </div>
    )
}
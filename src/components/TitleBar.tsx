import {appWindow} from "@tauri-apps/api/window";
import {theme} from "antd";
import Icon, {QuestionCircleOutlined, SettingOutlined} from "@ant-design/icons";
import EnzymeMLLogoMono from "../icons/enzymeml_logo.svg";
import EnzymeMLLogoCol from "../icons/enzymeml_logo_coloured.svg";
import useAppStore from "../stores/stylestore.ts";

export default function TitleBar() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    const {token} = theme.useToken();

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
            <div className="flex flex-row justify-between items-center h-12 px-4">
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
                <Icon component={darkMode ? EnzymeMLLogoMono : EnzymeMLLogoCol}
                      style={{fontSize: 25, color: token.colorTextDisabled}}/>
                <div className={"flex flex-row gap-2"}>
                    <QuestionCircleOutlined/>
                    <SettingOutlined/>
                </div>
            </div>
        </div>
    )
}
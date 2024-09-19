import '../App.css';
import React, {useCallback, useEffect} from "react";
import ReactDOM from "react-dom/client";
import Visualisation from "./Visualisation.tsx";
import {Layout, theme} from "antd";
import useAppStore from "../stores/appstore.ts";
import WindowBase from "../components/WindowBase.tsx";

const {Content, Sider} = Layout;

function VisWindow() {

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const themePreference = useAppStore(state => state.themePreference);

    // Actions
    const setDarkMode = useAppStore(state => state.setDarkMode);

    // Event listeners
    const windowQuery = window.matchMedia("(prefers-color-scheme:dark)");

    // Hooks
    const {token} = theme.useToken();

    // Callbacks
    const darkModeChange = useCallback(() => {
        if (themePreference === 'dark') {
            setDarkMode(true);
        } else if (themePreference === 'light') {
            setDarkMode(false);
        } else if (themePreference === 'system') {
            setDarkMode(windowQuery.matches);
        }
    }, []);

    // Effects
    useEffect(() => {
        windowQuery.addEventListener("change", darkModeChange);
        return () => {
            windowQuery.removeEventListener("change", darkModeChange);
        };
    }, [windowQuery, darkModeChange]);

    useEffect(() => {
        if (themePreference === 'dark') {
            setDarkMode(true);
        } else if (themePreference === 'light') {
            setDarkMode(false);
        } else if (themePreference === 'system') {
            setDarkMode(windowQuery.matches);
        }
    }, [themePreference]);

    return (
        <WindowBase>
            <Layout>
                <Content className={"mx-2 h-full overflow-y-scroll scrollbar-hide"}>
                    <div>
                        <Visualisation/>
                    </div>
                </Content>
            </Layout>
            <Sider breakpoint="md"
                   style={{
                       background: darkMode ? token.colorBgBase : token.colorBgLayout,
                       borderRadius: token.borderRadiusLG,
                       borderBottomLeftRadius: token.borderRadiusLG,
                       borderBottomRightRadius: token.borderRadiusLG,
                       borderRight: 0,
                   }}
            >
                <div className={"flex flex-col space-y-2"}>
                    Some Menu
                </div>
            </Sider>
        </WindowBase>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <VisWindow/>
    </React.StrictMode>,
);

import '../App.css';
import React, { useCallback, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, Layout, theme, Typography } from "antd";

import Visualisation from "@visualisation/Visualisation";
import useAppStore from "@stores/appstore";
import WindowFrame from "@components/WindowFrame";
import Options from "@visualisation/Options";
import { listen } from "@tauri-apps/api/event";
import { BrowserRouter as Router } from 'react-router-dom';

const { Content, Sider } = Layout;

function VisWindow() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const { token } = theme.useToken();

    return (
        <Layout className={"pb-1 pl-2 h-full antialiased"}
            style={{
                background: darkMode ? token.colorBgBase : token.colorBgLayout,
                borderColor: token.colorBorder,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderStyle: 'solid',
            }}
        >
            {/* <Sider className={"overflow-y-scroll mr-2 scrollbar-hide"}
                style={{
                    background: darkMode ? token.colorBgBase : token.colorBgLayout,
                    borderRadius: token.borderRadiusLG,
                    borderBottomLeftRadius: token.borderRadiusLG,
                    borderBottomRightRadius: token.borderRadiusLG,
                    borderRight: 0,
                }}
            >
                <div className={"flex flex-col gap-2"}>
                    <Select />
                </div>
            </Sider> */}
            <Content className={"overflow-y-scroll mx-2 w-full h-full scrollbar-hide"}>
                <Visualisation />
            </Content>
            <Sider className={"mr-2"}
                style={{
                    background: darkMode ? token.colorBgBase : token.colorBgLayout,
                    borderRadius: token.borderRadiusLG,
                    borderBottomLeftRadius: token.borderRadiusLG,
                    borderBottomRightRadius: token.borderRadiusLG,
                    borderRight: 0,
                }}
            >
                <div className={"flex flex-col gap-2"}>
                    <Options />
                </div>
            </Sider>
        </Layout>
    );
}

const WrappedApp: React.FC = () => {
    // States
    const darkMode = useAppStore(state => state.darkMode);
    const themePreference = useAppStore(state => state.themePreference);

    // Actions
    const setDarkMode = useAppStore(state => state.setDarkMode);
    const setThemePreference = useAppStore(state => state.setThemePreference);

    // Event listeners
    const windowQuery = window.matchMedia("(prefers-color-scheme:dark)");

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
        const unlistenPromise = listen<{ theme: string }>("theme-change", (event) => {
            setThemePreference(event.payload.theme);
            darkModeChange();
        });

        // Clean up the event listener on component unmount
        return () => {
            unlistenPromise.then((unlisten) => {
                unlisten();  // Properly invoking the unlisten function
            });
        };
    }, []);

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
    }, [themePreference, setThemePreference]);

    return (
        <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
            <Router>
                <WindowFrame useButtons={false}>
                    <VisWindow />
                </WindowFrame>
            </Router >
        </ConfigProvider >
    )
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <WrappedApp />
    </React.StrictMode>,
);

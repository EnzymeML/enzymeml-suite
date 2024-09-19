import useAppStore from "../stores/appstore.ts";
import {ConfigProvider, Layout, theme} from "antd";
import React, {useEffect} from "react";
import WindowFrame from "./WindowFrame.tsx";
import {listen} from "@tauri-apps/api/event";

export default function WindowBase(
    {children}: { children: React.ReactNode }
) {
    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Actions
    const setDarkMode = useAppStore(state => state.setDarkMode);

    // Styling
    const {token} = theme.useToken();

    // Tauri listens for changes in the system theme
    useEffect(() => {
        const unlisten = listen<{ theme: string }>('theme-change', (event) => {
            const {theme} = event.payload;

            if (theme === 'dark') {
                setDarkMode(true);
            } else if (theme === 'light') {
                setDarkMode(false);
            } else if (theme === 'system') {
                setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
            }
        });

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, [setDarkMode]);

    return (
        <ConfigProvider theme={{algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm}}>
            <WindowFrame useButtons={false}>
                <Layout className={"pl-2 h-full antialiased"}
                        style={{
                            background: darkMode ? token.colorBgBase : token.colorBgLayout,
                            borderColor: token.colorBorder,
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderStyle: 'solid',
                        }}
                >
                    {children}
                </Layout>
            </WindowFrame>
        </ConfigProvider>
    );
}
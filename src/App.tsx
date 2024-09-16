import './App.css';
import React, {useCallback, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';
import {ConfigProvider, Layout, theme} from 'antd';
import SmallMolecules from "./smallmols/SmallMolecules.tsx";
import Home from "./home/Home.tsx";
import Measurement from "./measurements/Measurement.tsx";
import Vessels from "./vessels/Vessels.tsx";
import Models from "./models/Models.tsx";
import Proteins from "./proteins/Proteins.tsx";
import Reactions from "./reactions/Reactions.tsx";
import useAppStore, {AvailablePaths} from "./stores/appstore.ts";
import WindowFrame from "./components/WindowFrame.tsx";
import MainMenu from "./components/MainMenu.tsx";
import CollectionNav from "./components/CollectionNav.tsx";


const {Content, Sider} = Layout;

function App() {

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const location = useLocation();

    // Actions
    const setCurrentPath = useAppStore((state) => state.setCurrentPath);

    useEffect(() => {
        const pathName = location.pathname;
        if (Object.values(AvailablePaths).includes(pathName as AvailablePaths)) {
            setCurrentPath(pathName as AvailablePaths);
        } else {
            throw new Error(`Path ${pathName} is not in AvailablePaths`);
        }
    }, [location, setCurrentPath]); // Run when `location` changes

    // Hooks
    const {token} = theme.useToken();

    // Effects
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <Layout className={"pl-2 h-full"}
                style={{
                    background: darkMode ? token.colorBgBase : token.colorBgLayout,
                    borderColor: token.colorBorder,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderStyle: 'solid',
                }}
        >
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
                    <MainMenu/>
                    <CollectionNav/>
                </div>
            </Sider>
            <Layout>
                <Content className={"mx-2 h-full overflow-y-scroll scrollbar-hide"}>
                    <div>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/vessels" element={<Vessels/>}/>
                            <Route path="/small-molecules" element={<SmallMolecules/>}/>
                            <Route path="/proteins" element={<Proteins/>}/>
                            <Route path="/reactions" element={<Reactions/>}/>
                            <Route path="/measurements" element={<Measurement/>}/>
                            <Route path="/models" element={<Models/>}/>
                        </Routes>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

const WrappedApp: React.FC = () => {

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const themePreference = useAppStore(state => state.themePreference);

    // Actions
    const setDarkMode = useAppStore(state => state.setDarkMode);

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
        <ConfigProvider theme={{algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm}}>
            <Router>
                <WindowFrame>
                    <App/>
                </WindowFrame>
            </Router>
        </ConfigProvider>)
};

export default WrappedApp;
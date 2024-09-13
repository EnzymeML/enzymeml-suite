import React, {useCallback, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import {ConfigProvider, Layout, Menu, theme} from 'antd';
import './App.css';
import SmallMolecules from "./smallmols/SmallMolecules.tsx";
import Home from "./home/Home.tsx";
import Measurement from "./measurements/Measurement.tsx";
import Icon from "@ant-design/icons";
import Vessels from "./vessels/Vessels.tsx";
import Models from "./models/Models.tsx";
import Proteins from "./proteins/Proteins.tsx";
import Reactions from "./reactions/Reactions.tsx";
import SmallMoleculeIcon from "./icons/smallmolecule.svg";
import ProteinIcon from "./icons/protein.svg";
import ReactionsIcon from "./icons/reactions1.svg";
import MeasurementIcon from "./icons/measurements.svg";
import ModelsIcon from "./icons/models.svg";
import VesselsIcon from "./icons/vessels.svg";
import HomeIcon from "./icons/home.svg";
import useAppStore from "./stores/stylestore.ts";
import WindowFrame from "./components/WindowFrame.tsx";

const ICON_SIZE = 20;
const {Content, Sider} = Layout;

// @ts-ignore
const items = [
    {
        key: '0',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={HomeIcon}/>,
        label: 'Overview',
        route: '/',
    },
    {
        key: '2',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={VesselsIcon}/>,
        label: 'Vessels',
        route: '/vessels',
    },
    {
        key: '3',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={SmallMoleculeIcon}/>,
        label: 'Small Molecules',
        route: '/small-molecules',
    },
    {
        key: '4',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ProteinIcon}/>,
        label: 'Proteins',
        route: '/proteins',
    },
    {
        key: '5',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ReactionsIcon}/>,
        label: 'Reactions',
        route: '/reactions',
    },
    {
        key: '6',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={MeasurementIcon}/>,
        label: 'Measurements',
        route: '/measurements',
    },
    {
        key: '7',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ModelsIcon}/>,
        label: 'Models',
        route: '/models',
    },
];

function App() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Effects
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Hooks
    const navigate = useNavigate();
    const {token} = theme.useToken();

    // Handlers
    const handleMenuClick = (e: any) => {
        const clickedItem = items.find(item => item.key === e.key);
        if (clickedItem) {
            navigate(clickedItem.route);
        }
    };

    return (
        <Layout
            className={"pl-2 h-full"}
            style={{
                background: darkMode ? token.colorBgBase : token.colorBgLayout,
                borderColor: token.colorBorder,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderStyle: 'solid',
            }}
        >
            <Sider
                className={"shadow-sm"}
                breakpoint="md"
                style={{
                    background: token.colorFillContent,
                    borderRadius: token.borderRadiusLG,
                    borderBottomLeftRadius: token.borderRadiusLG,
                    borderBottomRightRadius: token.borderRadiusLG,
                }}
            >
                <Menu
                    className={"h-full py-2"}
                    style={{
                        background: token.colorBgContainer,
                        borderRadius: token.borderRadiusLG,
                        border: 0,
                        borderBottomLeftRadius: token.borderRadiusLG,
                        borderBottomRightRadius: token.borderRadiusLG,
                        borderBottom: 1,
                        borderRight: 1,
                        borderStyle: 'solid',
                        borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                    }}
                    theme={darkMode ? "dark" : "light"}
                    mode="inline"
                    items={items}
                    onClick={handleMenuClick}
                />
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

    // Actions
    const setDarkMode = useAppStore(state => state.setDarkMode);

    // Event listeners
    const windowQuery = window.matchMedia("(prefers-color-scheme:dark)");

    // Callbacks
    const darkModeChange = useCallback((event: MediaQueryListEvent) => {
        setDarkMode(event.matches);
    }, []);

    // Effects
    useEffect(() => {
        windowQuery.addEventListener("change", darkModeChange);
        return () => {
            windowQuery.removeEventListener("change", darkModeChange);
        };
    }, [windowQuery, darkModeChange]);

    useEffect(() => {
        setDarkMode(windowQuery.matches);
    }, []);

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
import React from 'react';
import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import {Layout, Menu, theme} from 'antd';
import './App.css';
import SmallMolecules from "./smallmols/smallmols.tsx";
import Home from "./home/home.tsx";
import Measurement from "./measurements/measurement.tsx";
import {FolderOutlined} from "@ant-design/icons";
import Vessels from "./vessels/vessels.tsx";
import Models from "./models/models.tsx";
import Proteins from "./proteins/proteins.tsx";
import Reactions from "./reactions/reactions.tsx";

const {Content, Sider} = Layout;

const items = [
    {
        key: '0',
        icon: React.createElement(FolderOutlined),
        label: 'Overview',
        route: '/',
    },
    {
        key: '2',
        icon: React.createElement(FolderOutlined),
        label: 'Vessels',
        route: '/vessels',
    },
    {
        key: '3',
        icon: React.createElement(FolderOutlined),
        label: 'Small Molecules',
        route: '/small-molecules',
    },
    {
        key: '4',
        icon: React.createElement(FolderOutlined),
        label: 'Proteins',
        route: '/proteins',
    },
    {
        key: '5',
        icon: React.createElement(FolderOutlined),
        label: 'Reactions',
        route: '/reactions',
    },
    {
        key: '6',
        icon: React.createElement(FolderOutlined),
        label: 'Measurements',
        route: '/measurements',
    },
    {
        key: '7',
        icon: React.createElement(FolderOutlined),
        label: 'Models',
        route: '/models',
    },
];

const App: React.FC = () => {
    const {
        token: {colorBgContainer, borderRadiusLG},
    } = theme.useToken();

    const navigate = useNavigate();

    const handleMenuClick = (e: any) => {
        const clickedItem = items.find(item => item.key === e.key);
        if (clickedItem) {
            navigate(clickedItem.route);
        }
    };

    return (
        <Layout
            className={"min-h-screen"}
            style={{
                background: colorBgContainer,
                borderRadius: 100,
            }}
        >
            <Sider
                breakpoint="md"
                style={{
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                    marginTop: 5,
                }}
            >
                <div className="demo-logo-vertical"/>
                <Menu
                    theme="light"
                    mode="inline"
                    items={items}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Layout>
                <Content className={"my-4 mx-4"}>
                    <div
                        style={{
                            padding: 24,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
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

const WrappedApp: React.FC = () => (
    <Router>
        <App/>
    </Router>
);

export default WrappedApp;
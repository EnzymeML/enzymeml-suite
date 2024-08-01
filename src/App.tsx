import React from 'react';
import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import {Layout, Menu, theme} from 'antd';
import './App.css';
import SmallMolecules from "./smallmols/smallmols.tsx";
import Home from "./home/home.tsx";
import Measurement from "./measurements/measurement.tsx";
import {FolderOutlined} from "@ant-design/icons";

const {Content, Sider} = Layout;

const items = [
    {
        key: '0',
        icon: React.createElement(FolderOutlined),
        label: 'Overview',
        route: '/',
    },
    {
        key: '1',
        icon: React.createElement(FolderOutlined),
        label: 'Authors',
        route: '/authors',
    },
    {
        key: '2',
        icon: React.createElement(FolderOutlined),
        label: 'Vessels',
        route: '/authors',
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
            style={{
                minHeight: '97vh',
                maxHeight: '99vh',
                background: colorBgContainer,
                borderRadius: 100,
            }}
        >
            <Sider
                breakpoint="md"
                style={{
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
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
                <Content style={{
                    margin: '24px 16px 24px',
                    overscrollBehaviorY: 'none',
                }}>
                    <div
                        style={{
                            padding: 24,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/authors" element={<div>Authors Content</div>}/>
                            <Route path="/vessels" element={<div>Vessels Content</div>}/>
                            <Route path="/small-molecules" element={<SmallMolecules/>}/>
                            <Route path="/proteins" element={<div>Proteins Content</div>}/>
                            <Route path="/reactions" element={<div>Reactions Content</div>}/>
                            <Route path="/measurements" element={<Measurement/>}/>
                            <Route path="/models" element={<div>Models Content</div>}/>
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
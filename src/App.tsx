import "./App.css";
import React, { useCallback, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ConfigProvider, Layout, theme } from "antd";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import SmallMolecules from "@suite/smallmols/SmallMolecules.tsx";
import Home from "@suite/home/Home.tsx";
import Measurements from "@suite/measurements/Measurements.tsx";
import Vessels from "@suite/vessels/Vessels.tsx";
import Proteins from "@suite/proteins/Proteins.tsx";
import Reactions from "@suite/reactions/Reactions.tsx";
import useAppStore, { AvailablePaths } from "@suite/stores/appstore.ts";
import WindowFrame from "@suite/components/WindowFrame.tsx";
import MainMenu from "@suite/components/MainMenu.tsx";
import SubMenu from "@suite/components/SubMenu.tsx";
import Modelling from "@suite/modelling/Modelling.tsx";
import { commands } from "@suite/commands/jupyter.ts";
import { useFileMenuShortcuts } from "@hooks/useKeyboardShortcuts";

const appWindow = getCurrentWebviewWindow()

/**
 * Context interface for managing selected items across the application
 */
interface AppContext {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

/**
 * React context for sharing selected item state throughout the app
 */
export const AppContext = React.createContext<AppContext>({
  selectedId: null,
  setSelectedId: () => { },
});

const { Content, Sider } = Layout;

/**
 * Main application component that handles routing and layout
 * Manages the sidebar navigation and content area
 */
function App() {
  // States
  const darkMode = useAppStore((state) => state.darkMode);
  const location = useLocation();
  const openNotification = useAppStore((state) => state.openNotification);

  // Actions
  const setCurrentPath = useAppStore((state) => state.setCurrentPath);
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  // Navigation
  const navigate = useNavigate();

  // Styling
  const { token } = theme.useToken();

  // Effects
  /**
   * Updates the current path in the store when the route changes
   * Validates that the path is a valid AvailablePath
   */
  useEffect(() => {
    const pathName = location.pathname;
    if (Object.values(AvailablePaths).includes(pathName as AvailablePaths)) {
      setCurrentPath(pathName as AvailablePaths);
    } else {
      throw new Error(`Path ${pathName} is not in AvailablePaths`);
    }
  }, [location, setCurrentPath]); // Run when `location` changes

  /**
   * Prevents body scrolling to ensure the app layout handles all scrolling
   */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard shortcuts
  /**
   * Sets up global keyboard shortcuts for file operations
   * - Cmd/Ctrl+O: Open file
   * - Cmd/Ctrl+S: Save entry
   * - Cmd/Ctrl+R: Export to JSON
   * - Cmd/Ctrl+N: New entry
   * - Cmd/Ctrl+W: Close window
   */
  useFileMenuShortcuts({
    openNotification,
    appWindow,
    navigate,
  });

  return (
    <Layout
      className={"pl-2 h-full antialiased"}
      style={{
        background: darkMode ? token.colorBgBase : token.colorBgLayout,
        borderColor: token.colorBorder,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderStyle: "solid",
      }}
    >
      <Sider
        breakpoint="md"
        style={{
          background: darkMode ? token.colorBgBase : token.colorBgLayout,
          borderRadius: token.borderRadiusLG,
          borderBottomLeftRadius: token.borderRadiusLG,
          borderBottomRightRadius: token.borderRadiusLG,
          borderRight: 0,
        }}
      >
        <div className={"flex flex-col space-y-2"}>
          <MainMenu />
          <SubMenu />
        </div>
      </Sider>
      <Layout>
        <Content className={"overflow-y-scroll mx-2 h-full scrollbar-hide"}>
          <div>
            <AppContext.Provider
              value={{ selectedId: null, setSelectedId: setSelectedId }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/vessels" element={<Vessels />} />
                <Route path="/small-molecules" element={<SmallMolecules />} />
                <Route path="/proteins" element={<Proteins />} />
                <Route path="/reactions" element={<Reactions />} />
                <Route path="/measurements" element={<Measurements />} />
                <Route path="/modelling" element={<Modelling />} />
              </Routes>
            </AppContext.Provider>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

/**
 * Root application wrapper component that provides global configuration
 * Handles theme management, keyboard shortcuts, and system preferences
 */
const WrappedApp: React.FC = () => {
  // Initialize Python version check
  commands.getPythonVersion().then(result => {
    console.log(result);
  });

  // States
  const darkMode = useAppStore((state) => state.darkMode);
  const themePreference = useAppStore((state) => state.themePreference);

  // Actions
  const setDarkMode = useAppStore((state) => state.setDarkMode);

  // Event listeners
  const windowQuery = window.matchMedia("(prefers-color-scheme:dark)");

  // Callbacks
  /**
   * Handles dark mode changes based on theme preference
   * Supports 'dark', 'light', and 'system' preferences
   */
  const darkModeChange = useCallback(() => {
    if (themePreference === "dark") {
      setDarkMode(true);
    } else if (themePreference === "light") {
      setDarkMode(false);
    } else if (themePreference === "system") {
      setDarkMode(windowQuery.matches);
    }
  }, []);

  // Effects
  /**
   * Listens for system theme changes when using 'system' preference
   */
  useEffect(() => {
    windowQuery.addEventListener("change", darkModeChange);
    return () => {
      windowQuery.removeEventListener("change", darkModeChange);
    };
  }, [windowQuery, darkModeChange]);

  /**
   * Updates dark mode when theme preference changes
   */
  useEffect(() => {
    if (themePreference === "dark") {
      setDarkMode(true);
    } else if (themePreference === "light") {
      setDarkMode(false);
    } else if (themePreference === "system") {
      setDarkMode(windowQuery.matches);
    }
  }, [themePreference]);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Router>
        <WindowFrame>
          <App />
        </WindowFrame>
      </Router>
    </ConfigProvider>
  );
};

export default WrappedApp;

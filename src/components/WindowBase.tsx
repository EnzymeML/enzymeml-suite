import useAppStore from "../stores/appstore.ts";
import { Layout, theme } from "antd";
import React, { useEffect, useCallback, useMemo } from "react";
import WindowFrame from "./WindowFrame.tsx";
import { listen } from "@tauri-apps/api/event";

// Move style creation outside component
const getLayoutStyle = (darkMode: boolean, token: any) => ({
  background: darkMode ? token.colorBgBase : token.colorBgLayout,
  borderColor: token.colorBorder,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderStyle: "solid",
});

export default function WindowBase({
  children,
}: {
  children: React.ReactNode;
}) {
  // States
  const darkMode = useAppStore((state) => state.darkMode);

  // Actions
  const setDarkMode = useAppStore((state) => state.setDarkMode);

  // Styling
  const { token } = theme.useToken();

  // Memoize theme change handler
  const handleThemeChange = useCallback(
    (event: { payload: { theme: string } }) => {
      const { theme } = event.payload;

      if (theme === "dark") {
        setDarkMode(true);
      } else if (theme === "light") {
        setDarkMode(false);
      } else if (theme === "system") {
        setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    },
    [setDarkMode]
  );

  useEffect(() => {
    const unlisten = listen<{ theme: string }>(
      "theme-change",
      handleThemeChange
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleThemeChange]);

  // Memoize layout style
  const layoutStyle = useMemo(
    () => getLayoutStyle(darkMode, token),
    [darkMode, token]
  );

  return (
    <WindowFrame useButtons={false}>
      <Layout className={"pl-2 w-full h-full antialiased"} style={layoutStyle}>
        {children}
      </Layout>
    </WindowFrame>
  );
}

import { notification, NotificationArgsProps } from "antd";
import React, { useEffect, useMemo } from "react";

import useAppStore from "@stores/appstore.ts";

export type NotificationPlacement = NotificationArgsProps["placement"];

export const NOTIFICATION_PLACEMENT: NotificationPlacement = "bottomRight";
const Context = React.createContext({ name: "Default" });

export enum NotificationType {
  SUCCESS = "success",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hooks
  const contextValue = useMemo(() => ({ name: "EnzymeML Suite" }), []);
  const [api, contextHolder] = notification.useNotification();

  // Actions
  const setOpenNotification = useAppStore((state) => state.setOpenNotification);

  // Memoize the openNotification function
  const openNotification = useMemo(
    () => (message: string, type: NotificationType, description: string) => {
      api[type]({
        message,
        description,
        placement: NOTIFICATION_PLACEMENT,
        showProgress: true,
      });
    },
    [api]
  );

  // Effects
  useEffect(() => {
    setOpenNotification(openNotification);
  }, [setOpenNotification, openNotification]); // Add proper dependencies

  return (
    <Context.Provider value={contextValue}>
      {contextHolder}
      {children}
    </Context.Provider>
  );
}

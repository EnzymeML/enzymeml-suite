import {notification, NotificationArgsProps} from "antd";
import React, {useEffect, useMemo} from "react";
import useAppStore from "../stores/appstore.ts";

export type NotificationPlacement = NotificationArgsProps['placement'];

const NOTIFICATION_PLACEMENT: NotificationPlacement = 'bottomRight';
const Context = React.createContext({name: 'Default'});

export enum NotificationType {
    SUCCESS = 'success',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
}

export default function NotificationProvider(
    {children}: { children: React.ReactNode }
) {
    // Hooks
    const contextValue = useMemo(() => ({name: 'EnzymeML Suite'}), []);
    const [api, contextHolder] = notification.useNotification();

    // Actions
    const setOpenNotification = useAppStore(state => state.setOpenNotification);

    // Define the openNotification function to be used all over the app
    const openNotification = (message: string, type: NotificationType, description: string) => {
        api[type]({
            message: message,
            description: <Context.Consumer>{() => (description)}</Context.Consumer>,
            // @ts-ignore
            placement: NOTIFICATION_PLACEMENT,
            showProgress: true,
        });
    };

    // Effects
    useEffect(() => {
        // Set the openNotification function in the store on mount
        setOpenNotification(openNotification);
    }, []);

    return (
        <Context.Provider value={contextValue}>
            {contextHolder}
            {children}
        </Context.Provider>
    )
}
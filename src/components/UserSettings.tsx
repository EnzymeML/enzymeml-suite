import { Dropdown, DropdownProps, MenuProps } from "antd";
import { CheckOutlined, SettingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { emit } from "@tauri-apps/api/event";

import useAppStore from "@stores/appstore.ts";

export enum ThemeSubMenuKeys {
    LIGHT = "theme-light",
    DARK = "theme-dark",
    SYSTEM = "theme-system"
}

const initialItems: MenuProps["items"] = [
    {
        key: "theme",
        label: "App Theme",
        type: "group",
        children: [
            {
                key: "theme-light",
                label: "Light"
            },
            {
                key: "theme-dark",
                label: "Dark"
            },
            {
                key: "theme-system",
                label: "System"
            }
        ]
    },
    {
        key: "databases",
        label: "Databases",
        type: "group",
        children: [
            {
                key: "db-pubchem",
                label: "PubChem",
            },
            {
                key: "db-uniprot",
                label: "UniProt",
            }
        ]
    }
];

const changeThemeIcon = (items: MenuProps["items"], themePreference: string) => {
    if (items && items.length > 0) {
        // @ts-expect-error - items is not typed
        const updatedChildren = items[0].children.map((item) => {
            if (item && item.key === `theme-${themePreference}`) {
                return {
                    ...item,  // create a new item object
                    icon: <CheckOutlined />
                };
            } else {
                return {
                    ...item,  // create a new item object
                    icon: null
                };
            }
        });

        return [
            {
                ...items[0],
                children: updatedChildren
            },
            ...items.slice(1)
        ];
    }
    return items;
};

const changeDatabaseIcon = (items: MenuProps["items"], databasesToUse: string[]) => {
    if (items && items.length > 0) {
        // @ts-expect-error - Items is not typed
        const updatedChildren = items[1].children.map((item) => {
            if (databasesToUse.includes(item.key.split("-")[1])) {
                return {
                    ...item,  // create a new item object
                    icon: <CheckOutlined />
                };
            } else {
                return {
                    ...item,  // create a new item object
                    icon: null
                };
            }
        });

        return [
            items[0],
            {
                ...items[1],
                children: updatedChildren
            },
            items.slice(2)
        ];
    }
    return items;
}

export default function UserSettings() {
    // States
    const [open, setOpen] = useState<boolean>(false)
    const [items, setItems] = useState<MenuProps["items"]>(initialItems);
    const themePreference = useAppStore((state) => state.themePreference);
    const databasesToUse = useAppStore((state) => state.databasesToUse);

    // Effects
    useEffect(() => {
        const changedItems = changeDatabaseIcon(initialItems, databasesToUse);
        // @ts-expect-error - items is not typed
        setItems(changeThemeIcon(changedItems, themePreference));
    }, [themePreference, databasesToUse]);  // React when themePreference changes

    // Actions
    const setThemePreference = useAppStore((state) => state.setThemePreference);
    const setDatabasesToUse = useAppStore((state) => state.setDatabasesToUse);

    // Handlers
    const onClick: MenuProps["onClick"] = ({ key }) => {
        if (key.startsWith("theme")) {
            handleThemeChange(key);
        } else if (key.startsWith("db")) {
            handleDatabaseChange(key);
        }
    };

    const handleThemeChange = (key: string) => {
        switch (key) {
            case ThemeSubMenuKeys.LIGHT:
                storeTheme("light");
                break;
            case ThemeSubMenuKeys.DARK:
                storeTheme("dark");
                break;
            case ThemeSubMenuKeys.SYSTEM:
                storeTheme("system");
                break;
        }
    };

    const handleDatabaseChange = (key: string) => {
        const db = key.split("-")[1];
        if (databasesToUse.includes(db)) {
            setDatabasesToUse(databasesToUse.filter((item) => item !== db));
        } else {
            setDatabasesToUse([...databasesToUse, db]);
        }
    }

    const storeTheme = (theme: string) => {
        setThemePreference(theme);
        emit(
            'theme-change',
            { theme: theme }
        ).catch((error) => console.error("Error emitting theme-change event:", error));
    };

    const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
        if (info.source === 'trigger' || nextOpen) {
            setOpen(nextOpen);
        }
    };

    return (
        <Dropdown
            overlayStyle={{ width: "200px" }}
            onOpenChange={handleOpenChange}
            open={open}
            menu={{
                items,
                onClick,
            }}
        >
            <a onClick={(e) => e.preventDefault()}>
                <SettingOutlined />
            </a>
        </Dropdown>
    );
}
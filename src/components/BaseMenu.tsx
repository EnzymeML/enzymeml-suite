import { Menu, theme } from "antd";
import { MenuProps } from "antd";

import useAppStore from "@stores/appstore.ts";

interface BaseMenuProps {
    onClick?: MenuProps['onClick'];
    items: {
        key: string;
        icon?: React.ReactNode;
        label: string;
        route?: string;
    }[]
}

export default function BaseMenu(
    { items, onClick }: BaseMenuProps
) {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const { token } = theme.useToken();

    return (
        <Menu className={"py-2 h-auto shadow-sm"}
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: 0,
                borderBottomLeftRadius: token.borderRadiusLG,
                borderBottomRightRadius: token.borderRadiusLG,
                borderBottom: 1,
                borderStyle: 'solid',
                borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
            }}
            theme={darkMode ? "dark" : "light"}
            mode="vertical"
            items={items}
            onClick={onClick}
        />
    )
}
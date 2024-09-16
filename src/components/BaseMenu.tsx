import {Menu, theme} from "antd";
import useAppStore from "../stores/appstore.ts";

interface BaseMenuProps {
    onClick?: (e: any) => void;
    items: {
        key: string;
        icon?: JSX.Element;
        label: string;
        route?: string;
    }[]
}

export default function BaseMenu(
    {items, onClick}: BaseMenuProps
) {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    return (
        <Menu className={"h-auto py-2 shadow-sm"}
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
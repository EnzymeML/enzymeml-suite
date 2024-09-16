import {theme} from "antd";
import useAppStore from "../stores/appstore.ts";

export default function Footer() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    const {token} = theme.useToken();

    return (
        <div className={"h-2"}
             style={{
                 height: 10,
                 background: darkMode ? token.colorBgBase : token.colorBgLayout,
                 borderBottomLeftRadius: token.borderRadiusLG,
                 borderBottomRightRadius: token.borderRadiusLG,
                 color: token.colorText,
                 borderColor: token.colorBorder,
                 borderBottomWidth: 1,
                 borderLeftWidth: 1,
                 borderRightWidth: 1,
                 borderStyle: 'solid',
             }}
        />
    )
}
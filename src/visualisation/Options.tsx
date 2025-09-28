import { Checkbox, Menu, theme } from "antd";

import Grow from "@animations/Grow";
import useVizStore from "@stores/vizstore";
import useAppStore from "@stores/appstore";

export default function Options() {

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const useLines = useVizStore(state => state.useLines);
    const usePoints = useVizStore(state => state.usePoints);

    // Actions
    const setUseLines = useVizStore(state => state.setUseLines);
    const setUsePoints = useVizStore(state => state.setUsePoints);

    // Styling
    const { token } = theme.useToken();

    return (
        <Grow>
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
                selectedKeys={[]}
            >
                <Menu.Item>
                    <Checkbox className={"w-full"}
                        value={usePoints}
                        defaultChecked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                    >
                        Points
                    </Checkbox>
                </Menu.Item>
                <Menu.Item>
                    <Checkbox className={"w-full"}
                        value={useLines}
                        defaultChecked={useLines}
                        onChange={(e) => setUseLines(e.target.checked)}
                    >
                        Lines
                    </Checkbox>
                </Menu.Item>
            </Menu>
        </Grow>
    )
}
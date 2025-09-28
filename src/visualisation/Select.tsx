import { useEffect, useState } from "react";
import { Menu, theme } from "antd";

import { listMeasurements } from "@commands/measurements";
import useVizStore from "@stores/vizstore";
import { ListenToEvent, setCollectionIds } from "@tauri/listener";
import Grow from "@animations/Grow";
import useAppStore from "@stores/appstore";
import { MenuItem } from "@components/SubMenu";

export default function Select() {

    // States
    const [measurementIds, setMeasurementIds] = useState<[string, string][]>([])
    const darkMode = useAppStore(state => state.darkMode);

    // Actions
    const setSelectedMeasData = useVizStore(state => state.setSelectedMeasurement);

    // Styling
    const { token } = theme.useToken();

    // Functions
    const setStates = () => {
        setCollectionIds(listMeasurements, setMeasurementIds)
    }

    // Effects
    useEffect(() => setStates(), []);
    useEffect(() => (ListenToEvent("update_measurements", setStates)), []);


    // Handlers
    const handleClick = (e: { key: string }) => {
        setSelectedMeasData(e.key);
    }

    // Build items
    const items: MenuItem[] = measurementIds.map(([id, name]) => {
        return {
            key: id,
            label: name,
        }
    })

    return (
        <Grow>
            <Menu className={"overflow-y-scroll py-2 h-auto shadow-sm scrollbar-hide"}
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
                selectedKeys={[]}
                onClick={handleClick}
            />
        </Grow>
    )
}
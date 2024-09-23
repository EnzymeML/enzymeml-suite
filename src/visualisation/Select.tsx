import {useEffect, useState} from "react";
import {listMeasurements} from "../commands/measurements.ts";
import useVizStore from "../stores/vizstore.ts";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import {Badge, Menu, theme} from "antd";
import Grow from "../animations/Grow.tsx";
import useAppStore from "../stores/appstore.ts";
import {MenuItem} from "../components/SubMenu.tsx";
import {getBadgeColor} from "../components/CardHeader.tsx";

export default function Select() {

    // States
    const [measurementIds, setMeasurementIds] = useState<[string, string][]>([])
    const darkMode = useAppStore(state => state.darkMode);

    // Actions
    const setSelectedMeasData = useVizStore(state => state.setSelectedMeasurement);

    // Styling
    const {token} = theme.useToken();

    // Functions
    const setStates = () => {
        setCollectionIds(listMeasurements, setMeasurementIds)
    }

    // Effects
    useEffect(() => setStates(), []);
    useEffect(() => (ListenToEvent("update_measurements", setStates)), []);

    useEffect(() => {

    }, []);

    // Handlers
    const handleClick = (e: any) => {
        setSelectedMeasData(e.key);
    }

    // Build items
    const items: MenuItem[] = measurementIds.map(([id, name]) => {
        return {
            key: id,
            label: name,
            icon: <Badge count={id}
                         size={"small"}
                         color={getBadgeColor(darkMode)}/>
        }
    })

    return (
        <Grow>
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
                  selectedKeys={[]}
                  onClick={handleClick}
            />
        </Grow>
    )
}
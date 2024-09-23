import useVizStore from "../stores/vizstore.ts";
import {useEffect, useState} from "react";
import {getMeasurement} from "../commands/measurements.ts";
import CardHeader from "../components/CardHeader.tsx";
import LineChart from "../components/LineChart.tsx";
import {getDataPoints, VisData} from "../commands/visualisation.ts";
import {theme} from "antd";
import useAppStore from "../stores/appstore.ts";

export default function Visualisation() {

    // States
    const [data, setData] = useState<VisData | null>(null)
    const [measurementName, setMeasurementName] = useState<string | null>(null)
    const selectedMeasId = useVizStore(state => state.selectedMeasurement);
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    // Effects
    useEffect(() => {
        if (!selectedMeasId) {
            return;
        }
        // Set the name
        getMeasurement(selectedMeasId).then(
            (data) => {
                setMeasurementName(data.name);
            }
        )

        // Set the data
        getDataPoints(selectedMeasId).then(
            (data) => {
                setData(data);
            }
        ).catch(
            (err) => {
                console.error(err);
            }
        )

    }, [selectedMeasId]);

    if (!measurementName) {
        return null;
    }

    if (!selectedMeasId) {
        return null;
    }
    return (
        <div className={"h-full w-full py-2 shadow-sm"}
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
        >
            <div className={"ml-12 my-2"}>
                <CardHeader id={selectedMeasId}
                            name={measurementName}
                            placeholder={"Measurement"}
                            switchDir
                />
            </div>
            {data && <LineChart data={data}/>}
        </div>
    )
}
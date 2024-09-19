import {useEffect, useState} from "react";
import {listMeasurements} from "../commands/measurements.ts";
import {listen} from "@tauri-apps/api/event";
import {getMeasurementHashMap, VisData} from "../commands/visualisation.ts";
import {Button} from "antd";

export default function Visualisation() {

    // States
    const [measurementIds, setMeasurementIds] = useState<string[]>([])
    const [selectedMeasData, setSelectedMeasData] = useState<VisData | null>(null)

    useEffect(() => {
        listMeasurements().then(
            (data) => {
                setMeasurementIds(data.map(measurement => measurement[0]));

                if (data.length > 0) {
                    getMeasurementHashMap(data[0][0]).then(
                        (hashMap) => {
                            setSelectedMeasData(hashMap);
                        }
                    ).catch(
                        (error) => {
                            console.error('Error:', error);
                        }
                    )
                } else {
                    setSelectedMeasData(null);
                }
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Tauri listens for changes in the system theme
    useEffect(() => {
        const unlisten = listen('update_vis', () => {
            listMeasurements().then(
                (data) => {
                    setMeasurementIds(data.map(measurement => measurement[0]));
                }
            ).catch(
                (error) => {
                    console.error('Error:', error);
                }
            )
        });

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    // Handler
    const handleMeasurementSelect = (id: string) => {
        getMeasurementHashMap(id).then(
            (hashMap) => {
                setSelectedMeasData(hashMap);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }

    return (
        <div>
            {
                measurementIds.length > 0 ? (
                    <ul>
                        {measurementIds.map(id => (
                            <Button key={id} onClick={() => handleMeasurementSelect(id)}>
                                {id}
                            </Button>
                        ))}
                    </ul>
                ) : (
                    <p>No measurements found.</p>
                )
            }
            {selectedMeasData ? JSON.stringify(selectedMeasData) : null}
        </div>
    )
}
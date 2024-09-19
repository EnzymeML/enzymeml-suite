import './style.css';
import useAppStore from "../stores/appstore.ts";
import React, {useEffect, useState} from "react";
import {
    createMeasurement,
    deleteMeasurement,
    getMeasurement,
    listMeasurements,
    updateMeasurement
} from "../commands/measurements.ts";
import {listen} from "@tauri-apps/api/event";
import DataProvider from "../components/DataProvider.tsx";
import {Measurement} from "../../../enzymeml-ts/src";
import DetailView from "../components/DetailView.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import MeasurementForm from "./MeasurementForm.tsx";

// @ts-ignore
const MeasurementContext = React.createContext<ChildProps<Measurement>>({})

export default function Measurements() {

    // States
    const [measurements, setMeasurements] = useState<[string, string][]>([]);

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listMeasurements().then(
            (data) => {
                setMeasurements(data);

                if (data.length > 0) {
                    setSelectedId(data[0][0]);
                }
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Re-fetch small molecules on update
    useEffect(() => {
        const unlisten = listen('update_measurements', () => {
            listMeasurements().then(
                (data) => {
                    setMeasurements(data);
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

    // Create the items for the Collapsible component
    const items = measurements.map(([id]) => {
        return (
            <DataProvider<Measurement>
                key={`measurement_${id}`}
                targetKey={`measurement_${id}`}
                id={id}
                fetchObject={getMeasurement}
                updateObject={updateMeasurement}
                deleteObject={deleteMeasurement}
                context={MeasurementContext}
            >
                <div id={id}>
                    <DetailView context={MeasurementContext}
                                placeholder={"Measurement"}
                                nameKey={"name"}
                                FormComponent={MeasurementForm}
                    />
                </div>
            </DataProvider>
        );
    });

    if (measurements.length === 0) {
        return (
            <EmptyPage type={"Measurement"}
                       handleCreate={createMeasurement}/>
        )
    }

    return (
        <Collection items={items}
                    handleCreateObject={createMeasurement}
                    type={"Measurement"}
        />
    );
};


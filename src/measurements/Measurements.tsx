import './style.css';
import useAppStore from "../stores/appstore.ts";
import React, {useCallback, useEffect, useState} from "react";
import {
    createMeasurement,
    deleteMeasurement,
    getMeasurement,
    listMeasurements,
    updateMeasurement
} from "../commands/measurements.ts";
import DataProvider from "../components/DataProvider.tsx";
import {Measurement} from "../../../enzymeml-ts/src";
import DetailView from "../components/DetailView.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import MeasurementForm from "./MeasurementForm.tsx";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";

// @ts-ignore
const MeasurementContext = React.createContext<ChildProps<Measurement>>({})

export default function Measurements() {

    // States
    const [measurements, setMeasurements] = useState<[string, string][]>([]);
    const selectedId = useAppStore(state => state.selectedId);

    // State handlers
    const setState = useCallback(() => {
        setCollectionIds(listMeasurements, setMeasurements);
    }, [listMeasurements, setMeasurements]);

    // Fetch items on mount
    useEffect(() => setState(), [selectedId]);
    useEffect(() => ListenToEvent("update_measurements", setState), []);

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
                                listOfIds={measurements}
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


import 'react-json-view-lite/dist/index.css';
import React, {useCallback, useEffect, useState} from "react";
import DataProvider from "../components/DataProvider.tsx";
import {Vessel} from "../../../enzymeml-ts/src";
import {createVessel, deleteVessel, getVessel, listVessels, updateVessel} from "../commands/vessels.ts";
import DetailView from "../components/DetailView.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import VesselForm from "./VesselForm.tsx";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";

// @ts-ignore
const VesselContext = React.createContext<ChildProps<Vessel>>({})

export default function Vessels() {

    // States
    const [vessels, setVessels] = useState<[string, string][]>([]);
    const selectedId = useAppStore(state => state.selectedId);

    // State handlers
    const setState = useCallback(() => {
        setCollectionIds(listVessels, setVessels);
    }, [listVessels, setVessels]);

    // Fetch items on mount
    useEffect(() => setState(), [selectedId]);
    useEffect(() => ListenToEvent("update_vessels", setState), []);

    // Create the items for the Collapsible component
    const items = vessels.map(([id]) => {
        return (
            <DataProvider<Vessel>
                key={`vessel_${id}`}
                targetKey={`vessel_${id}`}
                id={id}
                fetchObject={getVessel}
                updateObject={updateVessel}
                deleteObject={deleteVessel}
                context={VesselContext}
            >
                <div id={id}>
                    <DetailView context={VesselContext}
                                placeholder={"Vessel"}
                                nameKey={"name"}
                                FormComponent={VesselForm}
                                listOfIds={vessels}
                    />
                </div>
            </DataProvider>
        );
    });

    if (vessels.length === 0) {
        return (
            <EmptyPage type={"Vessel"}
                       handleCreate={createVessel}/>
        )
    }

    return (
        <Collection items={items}
                    handleCreateObject={createVessel}
                    type={"Vessel"}/>
    );
}
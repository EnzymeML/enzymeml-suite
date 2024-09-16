import 'react-json-view-lite/dist/index.css';
import React, {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataProvider from "../components/DataProvider.tsx";
import {Vessel} from "../../../enzymeml-ts/src";
import {createVessel, deleteVessel, getVessel, listVessels, updateVessel} from "../commands/vessels.ts";
import DetailView from "../components/DetailView.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import VesselForm from "./VesselForm.tsx";

// @ts-ignore
const VesselContext = React.createContext<ChildProps<Vessel>>({})

export default function Vessels() {

    // States
    const [vessels, setVessels] = useState<[string, string][]>([]);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listVessels().then(
            (data) => {
                setVessels(data);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Re-fetch small molecules on update
    useEffect(() => {
        const unlisten = listen('update_vessels', () => {
            listVessels().then(
                (data) => {
                    setVessels(data);
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

    const handleCreateVessel = () => {
        createVessel().then(
            () => {
                console.log('Small molecule created');
            }
        )
    }

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
                <DetailView context={VesselContext}
                            placeholder={"Vessel"}
                            nameKey={"name"}
                            FormComponent={VesselForm}/>
            </DataProvider>
        );
    });

    if (vessels.length === 0) {
        return (
            <EmptyPage type={"Vessel"} handleCreate={handleCreateVessel}/>
        )
    }

    return (
        <div className={"flex flex-col"}>
            <FloatingCreate handleCreate={handleCreateVessel} type={"Vessel"}/>
            <Collection items={items}/>
        </div>
    );
}
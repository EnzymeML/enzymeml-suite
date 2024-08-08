import 'react-json-view-lite/dist/index.css';
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataHandle from "../components/datafetch.tsx";
import {ChildProps} from "../types.ts";
import {Vessel} from "../../../enzymeml-ts/src";
import {createVessel, deleteVessel, getVessel, listVessels, updateVessel} from "../commands/vessels.ts";
import VesselDetail from "./components/vesseldetail.tsx";

export default function Vessels() {

    // States
    const [vessels, setVessels] = useState<[string, string][] | null>(null);

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

    return (
        <div>
            <div style={
                {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflow: 'scroll',
                    maxHeight: '100vh'
                }
            }>
                <button onClick={handleCreateVessel}>Create Vessel</button>
                {
                    vessels?.map(([id]) => {
                        return (
                            <DataHandle<Vessel>
                                key={`vessel_fetcher_${id}`}
                                id={id}
                                fetchObject={getVessel}
                                updateObject={updateVessel}
                                deleteObject={deleteVessel}
                            >
                                {(props: ChildProps<Vessel>) => (<VesselDetail {...props} key={`vessel_${id}`}/>)}
                            </DataHandle>
                        );
                    })
                }
            </div>
        </div>
    );
}
import 'react-json-view-lite/dist/index.css';
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataHandle from "../components/DataFetch.tsx";
import {ChildProps} from "../types.ts";
import {Vessel} from "../../../enzymeml-ts/src";
import {createVessel, deleteVessel, getVessel, listVessels, updateVessel} from "../commands/vessels.ts";
import VesselDetail from "./components/VesselDetail.tsx";
import {Button} from "antd";

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
        <div className={"max-h-screen overflow-scroll scrollbar-hide"}>
            <div className={"flex flex-col gap-10"}>
                <Button onClick={handleCreateVessel}>Create Vessel</Button>
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
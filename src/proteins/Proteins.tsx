import 'react-json-view-lite/dist/index.css';
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataHandle from "../components/DataFetch.tsx";
import {ChildProps} from "../types.ts";
import {Protein} from "../../../enzymeml-ts/src";
import {Button} from "antd";
import {createProtein, deleteProtein, getProtein, listProteins, updateProtein} from "../commands/proteins.ts";
import ProteinDetail from "./components/ProteinDetail.tsx";

export default function Proteins() {

    // States
    const [proteins, setProteins] = useState<[string, string][] | null>(null);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listProteins().then(
            (data) => {
                setProteins(data);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Re-fetch proteins on update
    useEffect(() => {
        const unlisten = listen('update_proteins', () => {
            listProteins().then(
                (data) => {
                    setProteins(data);
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

    const handleCreateProtein = () => {
        createProtein().then(
            () => {
                console.log('Small molecule created');
            }
        )
    }

    return (
        <div className={"max-h-screen overflow-scroll scrollbar-hide"}>
            <div className={"flex flex-col gap-10"}>
                <Button onClick={handleCreateProtein}>Create Protein</Button>
                {
                    proteins?.map(([id]) => {
                        return (
                            <DataHandle<Protein>
                                key={`protein_fetcher_${id}`}
                                id={id}
                                fetchObject={getProtein}
                                updateObject={updateProtein}
                                deleteObject={deleteProtein}
                            >
                                {(props: ChildProps<Protein>) => (<ProteinDetail {...props} key={`protein_${id}`}/>)}
                            </DataHandle>
                        );
                    })
                }
            </div>
        </div>
    );
}
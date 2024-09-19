import React, {useEffect, useState} from "react";
import 'react-json-view-lite/dist/index.css';
import {listen} from "@tauri-apps/api/event";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {createProtein, deleteProtein, getProtein, listProteins, updateProtein} from "../commands/proteins.ts";
import EmptyPage from "../components/EmptyPage.tsx";
import Collection from "../components/Collection.tsx";
import {Protein} from "../../../enzymeml-ts/src";
import ProteinForm from "./ProteinForm.tsx";
import DetailView from "../components/DetailView.tsx";
import useAppStore from "../stores/appstore.ts";

// @ts-ignore
const ProteinContext = React.createContext<ChildProps<Vessel>>({})

export default function Proteins() {

    // States
    const [proteins, setProteins] = useState<[string, string][]>([]);

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listProteins().then(
            (data) => {
                setProteins(data);

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

    // Create the items for the Collapsible component
    const items = proteins.map(([id]) => {
        return (
            <DataProvider<Protein>
                key={`protein_${id}`}
                targetKey={`protein_${id}`}
                id={id}
                fetchObject={getProtein}
                updateObject={updateProtein}
                deleteObject={deleteProtein}
                context={ProteinContext}
            >
                <div id={id}>
                    <DetailView context={ProteinContext}
                                placeholder={"Protein"}
                                nameKey={"name"}
                                FormComponent={ProteinForm}/>
                </div>
            </DataProvider>
        );
    });

    if (proteins.length === 0) {
        return (
            <EmptyPage type={"Protein"}
                       handleCreate={createProtein}/>
        );
    }

    return (
        <Collection items={items}
                    handleCreateObject={createProtein}
                    type={"Protein"}/>
    );
}
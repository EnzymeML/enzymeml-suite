import React, {useEffect, useState} from "react";
import 'react-json-view-lite/dist/index.css';
import {listen} from "@tauri-apps/api/event";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {createProtein, deleteProtein, getProtein, listProteins, updateProtein} from "../commands/proteins.ts";
import EmptyPage from "../components/EmptyPage.tsx";
import Collection from "../components/Collection.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import {Protein} from "../../../enzymeml-ts/src";
import ProteinForm from "./ProteinForm.tsx";
import DetailView from "../components/DetailView.tsx";

// @ts-ignore
const ProteinContext = React.createContext<ChildProps<Vessel>>({})

export default function Proteins() {

    // States
    const [proteins, setProteins] = useState<[string, string][]>([]);

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
                <DetailView context={ProteinContext}
                            placeholder={"Protein"}
                            nameKey={"name"}
                            FormComponent={ProteinForm}/>
            </DataProvider>
        );
    });

    if (proteins.length === 0) {
        return (
            <EmptyPage type={"Protein"} handleCreate={handleCreateProtein}/>
        );
    }

    return (
        <div className={"flex flex-col"}>
            <FloatingCreate handleCreate={handleCreateProtein} type={"Protein"}/>
            <Collection items={items}/>
        </div>
    );
}
import 'react-json-view-lite/dist/index.css';
import {
    createSmallMolecule,
    deleteSmallMolecule,
    getSmallMolecule,
    listSmallMolecules,
    updateSmallMolecule
} from "../commands/smallmols.ts";
import React, {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {SmallMolecule} from "../../../enzymeml-ts/src";
import EmptyPage from "../components/EmptyPage.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import Collection from "../components/Collection.tsx";
import DetailView from "../components/DetailView.tsx";
import SmallMoleculeForm from "./SmallMoleculeForm.tsx";

// @ts-ignore
const SmallMoleculeContext = React.createContext<ChildProps<SmallMolecule>>({})

export default function SmallMolecules() {

    // States
    const [smallMolecules, setSmallMolecules] = useState<[string, string][]>([]);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listSmallMolecules().then(
            (data) => {
                setSmallMolecules(data);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Re-fetch small molecules on update
    useEffect(() => {
        const unlisten = listen('update_small_mols', () => {
            listSmallMolecules().then(
                (data) => {
                    setSmallMolecules(data);
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

    const handleCreateSmallMolecule = () => {
        createSmallMolecule().then(
            () => {
                console.log('Small molecule created');
            }
        )
    }

    // Create the items for the Collapsible component
    const items = smallMolecules.map(([id]) => {
        return (
            <DataProvider<SmallMolecule>
                key={`small_mol_${id}`}
                targetKey={`small_mol_${id}`}
                id={id}
                fetchObject={getSmallMolecule}
                updateObject={updateSmallMolecule}
                deleteObject={deleteSmallMolecule}
                context={SmallMoleculeContext}
            >
                <DetailView context={SmallMoleculeContext}
                            placeholder={"Small Molecule"}
                            nameKey={"name"}
                            FormComponent={SmallMoleculeForm}/>
            </DataProvider>
        );
    });

    if (smallMolecules.length === 0) {
        return (
            <EmptyPage type={"Small Molecule"} handleCreate={handleCreateSmallMolecule}/>
        );
    }

    return (
        <div className={"flex flex-col"}>
            <FloatingCreate handleCreate={handleCreateSmallMolecule} type={"Small Molecule"}/>
            <Collection items={items}/>
        </div>
    );
}
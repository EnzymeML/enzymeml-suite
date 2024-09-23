import 'react-json-view-lite/dist/index.css';
import {
    createSmallMolecule,
    deleteSmallMolecule,
    getSmallMolecule,
    listSmallMolecules,
    updateSmallMolecule
} from "../commands/smallmols.ts";
import React, {useCallback, useEffect, useState} from "react";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {SmallMolecule} from "../../../enzymeml-ts/src";
import EmptyPage from "../components/EmptyPage.tsx";
import Collection from "../components/Collection.tsx";
import DetailView from "../components/DetailView.tsx";
import SmallMoleculeForm from "./SmallMoleculeForm.tsx";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";

// @ts-ignore
const SmallMoleculeContext = React.createContext<ChildProps<SmallMolecule>>({})

export default function SmallMolecules() {

    // States
    const [smallMolecules, setSmallMolecules] = useState<[string, string][]>([]);
    const selectedId = useAppStore(state => state.selectedId);

    // State handlers
    const setState = useCallback(() => {
        setCollectionIds(listSmallMolecules, setSmallMolecules);
    }, [listSmallMolecules, setSmallMolecules]);

    // Fetch items on mount
    useEffect(() => setState(), [selectedId]);
    useEffect(() => ListenToEvent("update_small_mols", setState), []);

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
                <div id={id}>
                    <DetailView context={SmallMoleculeContext}
                                placeholder={"Small Molecule"}
                                nameKey={"name"}
                                FormComponent={SmallMoleculeForm}
                                listOfIds={smallMolecules}
                    />
                </div>
            </DataProvider>
        );
    });

    if (smallMolecules.length === 0) {
        return (
            <EmptyPage type={"Small Molecule"} handleCreate={createSmallMolecule}/>
        );
    }

    return (
        <Collection items={items}
                    handleCreateObject={createSmallMolecule}
                    type={"Small Molecule"}/>
    );
}
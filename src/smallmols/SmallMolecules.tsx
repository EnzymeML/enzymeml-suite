import 'react-json-view-lite/dist/index.css';
import {
    createSmallMolecule,
    deleteSmallMolecule,
    getSmallMolecule,
    listSmallMolecules,
    updateSmallMolecule
} from "../commands/smallmols.ts";
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataHandle from "../components/DataFetch.tsx";
import SmallMoleculeDetail from "./components/SmallMoleculeDetail.tsx";
import {ChildProps} from "../types.ts";
import {SmallMolecule} from "../../../enzymeml-ts/src";
import EmptyPage from "../components/EmptyPage.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import {theme, Typography} from "antd";

export default function SmallMolecules() {

    // States
    const [smallMolecules, setSmallMolecules] = useState<[string, string][] | null>(null);

    // Styling
    const {token} = theme.useToken();

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

    if (!smallMolecules) {
        return null;
    } else if (smallMolecules.length === 0) {
        return (
            <EmptyPage type={"Small Molecule"} handleCreate={handleCreateSmallMolecule}/>
        );
    }

    // Create the items for the Collapsible component


    return (
        <div className={"flex flex-col"}>
            <Typography.Title className={"pl-1.5 font-light"}
                              level={3}
                              style={{color: token.colorTextDescription}}
            >
                Small Molecules
            </Typography.Title>
            <FloatingCreate handleCreate={handleCreateSmallMolecule} type={"Small Molecule"}/>
            {
                smallMolecules?.map(([id]) => {
                    return (
                        <DataHandle<SmallMolecule>
                            key={`small_mol_fetcher_${id}`}
                            id={id}
                            fetchObject={getSmallMolecule}
                            updateObject={updateSmallMolecule}
                            deleteObject={deleteSmallMolecule}
                        >
                            {(props: ChildProps<SmallMolecule>) => (
                                <SmallMoleculeDetail {...props} key={`small_mol_${id}`}/>
                            )}
                        </DataHandle>
                    );
                })
            }
        </div>
    );
}
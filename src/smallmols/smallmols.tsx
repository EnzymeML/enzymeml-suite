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
import DataHandle from "../components/datafetch.tsx";
import SmallMoleculeDetail from "./components/smallmoldetail.tsx";
import {ChildProps} from "../types.ts";
import {SmallMolecule} from "../../../enzymeml-ts/src";
import {Button} from "antd";

export default function SmallMolecules() {

    // States
    const [smallMolecules, setSmallMolecules] = useState<[string, string][] | null>(null);

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

    return (
        <div className={"max-h-screen overflow-scroll scrollbar-hide"}>
            <div className={"flex flex-col gap-10"}>
                <Button onClick={handleCreateSmallMolecule}>Create Small Molecule</Button>
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
        </div>
    );
}
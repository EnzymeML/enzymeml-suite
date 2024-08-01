import 'react-json-view-lite/dist/index.css';
import {createSmallMolecule, listSmallMolecules} from "../commands/smallmols.ts";
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import SmallMoleculeEntry from "./components/smallmol.tsx";

export default function SmallMolecules() {

    // States
    const [smallMoleculeIDs, setSmallMoleculeIDs] = useState<string[] | null>(null);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listSmallMolecules().then(
            (data) => {
                setSmallMoleculeIDs(data);
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
                    setSmallMoleculeIDs(data);
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
        <div>
            <div style={
                {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }
            }>
                <button onClick={handleCreateSmallMolecule}>Create Small Molecule</button>
                {
                    smallMoleculeIDs?.map((id) => {
                        return (
                            <SmallMoleculeEntry key={id} id={id}/>
                        );
                    })
                }
            </div>
        </div>
    );
}
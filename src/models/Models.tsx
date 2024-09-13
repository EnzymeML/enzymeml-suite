import 'react-json-view-lite/dist/index.css';
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import {listAllNonConstantSpeciesIds} from "../commands/enzmldoc.ts";
import {getEquation, updateEquation} from "../commands/equations.ts";
import {deleteSmallMolecule} from "../commands/smallmols.ts";
import {ChildProps} from "../types.ts";
import {Equation} from "../../../enzymeml-ts/src";
import DataHandle from '../components/DataFetch.tsx';
import Model from "./components/Model.tsx";
import {Button} from "antd";
import {openSimulation} from "../commands/simulation.ts";
import Parameters from "./components/Parameters.tsx";

export default function Models() {

    // States
    const [nonConstantSpecies, setNonConstantSpecies] = useState<string[]>([])

    // Effects
    useEffect(() => {
        // Function to fetch and set the non-constant species
        const fetchAndSetNonConstantSpecies = () => {
            listAllNonConstantSpeciesIds()
                .then((data) => {
                    setNonConstantSpecies(data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        };

        // Call the function on mount
        fetchAndSetNonConstantSpecies();

        // Listen for the event and call the function again
        const unlisten = listen('update_equations', () => {
            fetchAndSetNonConstantSpecies();
        });

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    const items = nonConstantSpecies?.map((id) => {
            return {
                key: id,
                label: id,
            }
        }
    );

    // Handlers
    const handleMenuClick = (e: any) => {
        setSelectedSpecies(e.key);
    }

    return (
        <div className={"max-h-screen overflow-scroll scrollbar-hide"}>
            <Button onClick={() => {
                openSimulation().then(() => {
                });
            }}>Simulate</Button>
            <div>
                <div className={"flex flex-col"}>
                    {
                        nonConstantSpecies?.map((id) => {
                            return (
                                <DataHandle<Equation>
                                    key={`eq_fetcher_${id}`}
                                    id={id}
                                    alternativeIdCol="species_id"
                                    fetchObject={getEquation}
                                    updateObject={updateEquation}
                                    deleteObject={deleteSmallMolecule}
                                >
                                    {(props: ChildProps<Equation>) => (
                                        <Model {...props} key={`eq_${id}`}/>
                                    )}
                                </DataHandle>
                            );
                        })
                    }
                </div>
            </div>
            <Parameters/>
        </div>
    );
}
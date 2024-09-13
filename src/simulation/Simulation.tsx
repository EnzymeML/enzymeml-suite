import {InitialConditionsType, simulateDocument, SimulationResult} from "../commands/simulation.ts";
import {SimulationPlot} from "./Plot.tsx";
import {useEffect, useState} from "react";
import {getSpeciesNameByID, listAllNonConstantSpeciesIds} from "../commands/enzmldoc.ts";
import {Form, InputNumber} from "antd";

export type speciesIdMapType = {
    [key: string]: string
}

export default function Simulation() {
    // States
    const [results, setResults] = useState<SimulationResult[]>([])
    const [initialConditions, setInitialConditions] = useState<InitialConditionsType>({})
    const [speciesIDMap, setSpeciesIDMap] = useState<speciesIdMapType>({})

    // Effects
    useEffect(() => {
        listAllNonConstantSpeciesIds().then((data) => {
            data.forEach((id) => {
                setInitialConditions((prev) => {
                    return {
                        ...prev,
                        [id]: 0
                    }
                })

                getSpeciesNameByID(id).then((name) => {
                    setSpeciesIDMap((prev) => {
                        return {
                            ...prev,
                            [id]: name
                        }
                    })
                })
            })
        });
    }, []);

    useEffect(() => {
        // When no initial conditions are set, return
        if (Object.keys(initialConditions).length === 0) {
            return;
        }

        // When any initial condition is null or undefined, return
        if (Object.values(initialConditions).some((value) => value === null || value === undefined)) {
            return;
        }

        simulateDocument(initialConditions).then((data) => {
            setResults(data);
        });
    }, [initialConditions]);

    // Handlers
    const changeInitialCondition = (speciesID: string, value: number) => {
        setInitialConditions((prev) => {
            return {
                ...prev,
                [speciesID]: value
            }
        });
    }

    return (
        <>
            <div className={"flex flex-col gap-2"}>
                {
                    Object.keys(initialConditions).map((speciesID) => {
                        return (
                            <Form.Item
                                key={speciesID}
                                label={speciesIDMap[speciesID]}
                            >
                                <InputNumber
                                    type={"number"}
                                    value={initialConditions[speciesID]}
                                    step={0.1}
                                    placeholder={`Initial condition for ${speciesID}`}
                                    onChange={(e) => changeInitialCondition(speciesID, e as number)}
                                />
                            </Form.Item>
                        )
                    })
                }
            </div>
            <SimulationPlot results={results} speciesIDMap={speciesIDMap}/>
        </>
    )
}
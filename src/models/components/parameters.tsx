import DataHandle from "../../components/datafetch.tsx";
import {ChildProps} from "../../types.ts";
import ParameterDetail from "./parameter.tsx";
import {getParameter, listAllParametersIds, updateParameter} from "../../commands/parameters.ts";
import {Parameter} from "../../../../enzymeml-ts/src";
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";

export default function Parameters() {

    // States
    const [parameterIDs, setParameterIDs] = useState<string[]>([])

    // Effects
    useEffect(() => {
        const fetchAndSetParameterIDs = () => {
            listAllParametersIds().then(
                (data) => {
                    setParameterIDs(data);
                }
            ).catch(
                (error) => {
                    console.error('Error:', error);
                }
            )
        }

        // Call the function on mount
        fetchAndSetParameterIDs()

        // Listen for the event and call the function again
        const unlisten = listen('update_parameters', () => fetchAndSetParameterIDs());

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        }
    }, []);

    return (
        <div className={"flex flex-col gap-10 w-full"}>
            {
                parameterIDs.map((id: string) => {
                    return (
                        <DataHandle<Parameter>
                            key={`param_${id}`}
                            id={id}
                            fetchObject={getParameter}
                            updateObject={updateParameter}
                        >
                            {(props: ChildProps<Parameter>) => (
                                <ParameterDetail {...props} key={`param_${id}`}/>
                            )}
                        </DataHandle>
                    );
                })
            }
        </div>
    );
}
import {listAllParametersIds} from "../../commands/parameters.ts";
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

    console.log(parameterIDs)

    return (
        <div className={"flex flex-col gap-10 w-full"}>

        </div>
    );
}
import {listen} from "@tauri-apps/api/event";
import React from "react";

export type SetFunctionType = () => void;

export function ListenToEvent(trigger: string, setFunction: SetFunctionType) {
    const unlisten = listen(trigger, () => setFunction());

    setFunction();

    // Clean up the event listener on component unmount
    return () => {
        unlisten.then((fn) => fn());
    };
}

export function setCollectionIds(
    listFun: () => Promise<[string, string][]>,
    setFun: (value: React.SetStateAction<[string, string][]>) => void,
) {
    listFun().then(
        (data) => {
            setFun(data);
        }
    ).catch(
        (error) => {
            console.error('Error:', error);
        }
    )
}

export function handleDelete(
    id: string,
    selectedId: string | null,
    setSelectedId: (selectedId: string | null) => void,
    listOfIds: [string, string][],
    deleteFun: () => void,
) {
    // Get the index of the id
    const index = listOfIds.map(
        ([id]) => id
    ).indexOf(id);

    if (index === -1) {
        console.error(`Id ${id} not found in list of ids: ${listOfIds}`);
        return
    }

    // If the id is selected, select the next id
    if (selectedId === id) {
        if (index === 0) {
            if (listOfIds.length === 1) {
                setSelectedId(null);
            } else if (listOfIds.length === 0) {
                setSelectedId(null);
            } else {
                setSelectedId(listOfIds[1][0]);
            }
        } else {
            setSelectedId(listOfIds[index - 1][0]);
        }
    }

    // Delete the object
    deleteFun();
}
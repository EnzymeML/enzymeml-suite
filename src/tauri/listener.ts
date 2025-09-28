import { listen } from "@tauri-apps/api/event";
import React from "react";

/**
 * Type definition for a function that triggers a state update or side effect
 */
export type SetFunctionType = () => void;

/**
 * Sets up an event listener for Tauri events and handles cleanup
 * 
 * @param trigger - The event name to listen for
 * @param setFunction - Function to call when the event is triggered
 * @returns Cleanup function to remove the event listener
 */
export function ListenToEvent(trigger: string, setFunction: SetFunctionType) {
    const unlisten = listen(trigger, () => setFunction());

    setFunction();

    // Clean up the event listener on component unmount
    return () => {
        unlisten.then((fn) => fn());
    };
}

/**
 * Fetches collection IDs and updates the state with the retrieved data
 * 
 * @param listFun - Async function that returns an array of [id, name] tuples
 * @param setFun - React state setter function to update the collection IDs
 */
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

/**
 * Handles deletion of an item from a collection with smart selection management
 * 
 * When deleting an item:
 * - If the deleted item is currently selected, automatically selects the next appropriate item
 * - If deleting the first item, selects the second item (if available)
 * - If deleting any other item, selects the previous item
 * - If deleting the last remaining item, clears the selection
 * 
 * @param id - ID of the item to delete
 * @param selectedId - Currently selected item ID (or null if none selected)
 * @param setSelectedId - Function to update the selected item ID
 * @param listOfIds - Array of [id, name] tuples representing all items in the collection
 * @param deleteFun - Function to execute the actual deletion
 */
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
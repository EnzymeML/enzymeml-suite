import React, {useEffect, useState} from 'react';
import {Form} from "antd";
import {ChildProps, Identifiable} from "../types.ts";
import {listen} from "@tauri-apps/api/event";
import Reveal from "../animations/Reveal.tsx";
import NotificationProvider from "./NotificationProvider.tsx";

export type AlternativeStringCol<T, K extends keyof T> = T[K] extends string ? K : never;

export interface DataHandlingProps<T extends Identifiable> {
    id: string,
    fetchObject: (id: string) => Promise<T | undefined>;
    updateObject: (id: string, data: T) => Promise<void>;
    deleteObject?: (id: string) => Promise<void>;
    alternativeIdCol?: AlternativeStringCol<T, keyof T> | string;
    targetKey: string;
}

interface DataFetchProps<T extends Identifiable> extends DataHandlingProps<T> {
    children: React.ReactNode;
    context: React.Context<ChildProps<T>>;
}

export default function DataProvider<T extends Identifiable>(
    {
        id,
        fetchObject,
        children,
        updateObject,
        deleteObject,
        alternativeIdCol,
        targetKey,
        context,
    }: DataFetchProps<T>
): React.ReactElement | null {
    // States
    const [form] = Form.useForm<T>();
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [locked, setLocked] = useState<boolean>(false)

    // If there is no delete function, replace with identity function
    if (!deleteObject) {
        deleteObject = () => Promise.resolve();
    }

    // Effects
    useEffect(() => {
        // Function to fetch and set
        const fetchAndSetData = () => {
            fetchObject(id).then(
                (data: T | undefined) => {
                    if (data) {
                        setData(data);
                        setIsLoading(false);
                    }
                }
            ).catch(
                (error) => {
                    setError(error);
                }
            )
        }

        // Call the function on mount
        fetchAndSetData();

        // Re-render upon event
        const unlisten = listen(id, () => fetchAndSetData());

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    // Generic function to update the data
    const handleUpdateObject = () => {
        form.validateFields().then(
            (values) => {
                // Make sure the ID is set
                if (alternativeIdCol) {
                    // @ts-ignore
                    (values as T)[alternativeIdCol as string] = id;
                } else {
                    values.id = id;
                }
                values = Object.assign({}, data, values)
                updateObject(id, values).then(() => {
                    setData(values);
                });
            }
        ).catch(
            (error) => {
                setError(error);
            }
        )
    }

    // Generic function to delete the data
    const handleDeleteObject = () => {
        if (data) {
            if (alternativeIdCol) {
                // @ts-ignore
                deleteObject(data[alternativeIdCol as string]).then(
                    () => {
                        console.log('Object deleted');
                    }
                )
            } else {
                if (!data.id) {
                    throw new Error(`No ID found in data: ${JSON.stringify(data, null, 2)}`);
                }

                deleteObject(data.id).then(
                    () => {
                        console.log('Object deleted');
                    }
                )
            }
        }
    }

    if (!data) {
        return null;
    }

    return (
        <NotificationProvider>
            <Reveal targetKey={`${targetKey}_${id}`}>
                <context.Provider value={{
                    data: data,
                    error: error,
                    form: form,
                    isLoading: isLoading,
                    handleDeleteObject: handleDeleteObject,
                    handleUpdateObject: handleUpdateObject,
                    locked: locked,
                    setLocked: setLocked,
                }}>
                    {children}
                </context.Provider>
            </Reveal>
        </NotificationProvider>
    );
}
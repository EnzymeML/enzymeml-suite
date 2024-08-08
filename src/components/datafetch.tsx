import React, {ReactNode, useEffect, useState} from 'react';
import {Form} from "antd";
import {ChildProps, Identifiable} from "../types.ts";

type AlternativeStringCol<T, K extends keyof T> = T[K] extends string ? K : never;

type DataFetchProps<T extends Identifiable> = {
    id: string,
    fetchObject: (id: string) => Promise<T | undefined>;
    updateObject: (id: string, data: T) => Promise<void>;
    deleteObject: (id: string) => Promise<void>;
    children: (props: ChildProps<T>) => ReactNode;
    alternativeIdCol?: AlternativeStringCol<T, keyof T>;
};

export default function DataHandle<T extends Identifiable>(
    {
        id,
        fetchObject,
        children,
        updateObject,
        deleteObject,
        alternativeIdCol,
    }: DataFetchProps<T>
): React.ReactElement {
    // States
    const [form] = Form.useForm<T>();
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Used to fetch the data for the first time, upon
    // component mount
    useEffect(() => {
        // Fetch small molecule
        fetchObject(id).then(
            (data) => {
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
                deleteObject(data.id).then(
                    () => {
                        console.log('Object deleted');
                    }
                )
            }
        }
    }

    if (!data) {
        return (
            <div>

            </div>
        );
    }

    return (
        <>
            {children(
                {
                    data,
                    error,
                    form,
                    isLoading,
                    handleUpdateObject,
                    handleDeleteObject,
                }
            )}
        </>
    );
}
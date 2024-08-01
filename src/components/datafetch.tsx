import React, {ReactNode, useEffect, useState} from 'react';
import {Form} from "antd";
import {ChildProps, Identifiable} from "../types.ts";

type DataFetchProps<T extends Identifiable> = {
    id: string,
    fetchObject: (id: string) => Promise<T>;
    updateObject: (id: string, data: T) => Promise<void>;
    deleteObject: (id: string) => Promise<void>;
    children: (props: ChildProps<T>) => ReactNode;
};

export default function DataFetch<T extends Identifiable>(
    {
        id,
        fetchObject,
        children,
        updateObject,
        deleteObject,
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
        if (data) {
            form.validateFields().then(
                (values) => {
                    // Make sure the ID is set
                    values.id = id;
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
    }

    // Generic function to delete the data
    const handleDeleteObject = () => {
        if (data) {
            deleteObject(data.id).then(
                () => {
                    console.log('Small molecule deleted');
                }
            )
        }
    }

    if (!data) {
        return (
            <div>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <>
            {children(
                {
                    data,
                    error,
                    isLoading,
                    handleUpdateObject,
                    handleDeleteObject,
                }
            )}
        </>
    );
}
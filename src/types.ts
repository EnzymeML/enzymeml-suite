import {FormInstance} from "antd";
import {AlternativeStringCol} from "./components/DataProvider.tsx";
import React from "react";

export interface Identifiable {
    id?: string;
    species_id?: string | null;

    [key: string]: any
}

export interface ChildProps<T extends Identifiable> {
    data: T,
    error: Error | null,
    form: FormInstance<T>,
    isLoading: boolean,
    handleUpdateObject: () => void,
    handleDeleteObject: () => void,
    alternativeIdCol?: AlternativeStringCol<T, keyof T> | string;
    locked: boolean;
    setLocked: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface FormViewProps<T extends Identifiable> {
    context: React.Context<ChildProps<T>>
}
import {FormInstance} from "antd";

export interface Identifiable {
    id?: string;
    species_id?: string | null;
}

export interface ChildProps<T extends Identifiable> {
    data: T,
    error: Error | null,
    form: FormInstance<T>,
    isLoading: boolean,
    handleUpdateObject: () => void,
    handleDeleteObject?: () => void,
}
export interface Identifiable {
    id: string;
}

export interface ChildProps<T extends Identifiable> {
    data: T,
    error: Error | null,
    isLoading: boolean,
    handleUpdateObject: () => void,
    handleDeleteObject: (id: string) => void,
}
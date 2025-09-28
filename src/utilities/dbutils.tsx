import DBEntryRow from "@components/DBEntryRow";

export type DBOption = {
    id: string | number;
    name: string;
    database?: string;
    value?: number;
}

export function assembleOptions(
    options: DBOption[],
    baseUri: string | null,
    color: string,
    label: string,
    database: string
) {
    return {
        label: <span>{label}</span>,
        title: label,
        options: options.map(({ id, name }) => ({
            value: id,
            database: database,
            label: <DBEntryRow value={name} baseUri={baseUri} id={id} color={color} database={database} />,
        })),
    };
}
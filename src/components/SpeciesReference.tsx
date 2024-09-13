import {Badge} from "antd";

export default function SpeciesReference(
    {
        name,
        id
    }: {
        name: string,
        id: string
    }) {
    return (
        <div className={"flex flex-row gap-1 place-items-center"}>
            <span>{name}</span>
            <Badge count={id}
                   size={"small"}
                   color={"cyan"}
                   className={"scale-90 opacity-75"}
            />
        </div>
    )

}
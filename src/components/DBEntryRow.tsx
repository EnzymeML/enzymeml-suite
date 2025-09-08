import { Tag } from "antd";
import { RiExternalLinkLine } from "react-icons/ri";
import capitalize from "antd/lib/_util/capitalize";

export default function DBEntryRow({ value, database, baseUri, id, color }: {
    value: string,
    database: string,
    baseUri?: string | null,
    id: string | number,
    color?: string,
}) {
    return (
        <div className={"flex flex-row justify-between"}>
            <p>{capitalize(value)}</p>
            <div className="flex flex-row gap-2">
                <Tag color={color || "default"} className="justify-start scale-90">
                    {baseUri ? (
                        <a className={"flex flex-row gap-2 place-items-center"} href={baseUri + id} target={"_blank"}>
                            {database}
                            <RiExternalLinkLine />
                        </a>
                    ) : (
                        <span className={"flex flex-row gap-2 place-items-center"}>
                            {database}
                        </span>
                    )}
                </Tag>
            </div>
        </div>
    )
}
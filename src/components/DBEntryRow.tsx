import {Tag} from "antd";
import {RiExternalLinkLine} from "react-icons/ri";
import capitalize from "antd/lib/_util/capitalize";

export default function DBEntryRow({value, database, baseUri, id}: {
    value: string,
    database: string,
    baseUri: string,
    id: string
}) {
    let href = baseUri + id;
    return (
        <div className={"flex flex-row justify-between"}>
            <p>{capitalize(value)}</p>
            <Tag color="blue" className="scale-90">
                <a className={"flex flex-row gap-2 place-items-center"} href={href} target={"_blank"}>
                    {database}
                    <RiExternalLinkLine/>
                </a>
            </Tag>
        </div>
    )
}
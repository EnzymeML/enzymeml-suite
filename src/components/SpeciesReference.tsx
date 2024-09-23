import {Badge} from "antd";
import useAppStore from "../stores/appstore.ts";
import {getBadgeColor} from "./CardHeader.tsx";

interface SpeciesReferenceProps {
    name: string;
    id: string;
}

export default function SpeciesReference(
    {name, id}: SpeciesReferenceProps
) {

    // States
    const badgeColor = getBadgeColor(useAppStore(state => state.darkMode));

    return (
        <div className={"flex flex-row gap-1 place-items-center justify-between"}>
            <span>{
                name.length > 20 ? `${name.slice(0, 20)}...` : name
            }</span>
            <Badge count={id}
                   size={"small"}
                   color={badgeColor}
                   className={"scale-90"}
            />
        </div>
    )

}
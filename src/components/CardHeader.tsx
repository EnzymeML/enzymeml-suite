import React from "react";
import {Badge} from "antd";

interface CardHeaderProps {
    id: string,
    name: string,
    placeholder: string,
}

export default function CardHeader(
    {
        id,
        name,
        placeholder,
    }: CardHeaderProps
): React.ReactElement {

    let displayName
    let headingStyle

    if (name.length == 0) {
        displayName = placeholder
        headingStyle = "text-2xl font-semibold text-gray-400"
    } else {
        displayName = name
        headingStyle = "text-2xl font-semibold"
    }

    return (
        <div className="flex flex-row gap-2 place-items-center">
            <h2 className={headingStyle}>{displayName}</h2>
            <Badge count={id} size={"small"} color={"lime"}/>
        </div>
    );
}
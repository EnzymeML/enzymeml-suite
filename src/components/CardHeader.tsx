import React from "react";
import { Badge } from "antd";
import useAppStore from "../stores/appstore.ts";

interface CardHeaderProps {
    id: string,
    name: string,
    placeholder: string,
    switchDir?: boolean,
}

export function getBadgeColor(darkMode: boolean) {
    return darkMode ? "lime" : "#ce097b";
}

export default function CardHeader(
    {
        id,
        name,
        placeholder,
        switchDir,
    }: CardHeaderProps
): React.ReactElement {

    // States
    const darkMode = useAppStore(state => state.darkMode);

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
            {
                !switchDir ? (
                    <>
                        <h2 className={headingStyle}>{displayName}</h2>
                        <Badge count={id} size={"small"} color={getBadgeColor(darkMode)} />
                    </>
                ) : (
                    <>
                        <Badge count={id} size={"small"} color={getBadgeColor(darkMode)} />
                        <h2 className={headingStyle}>{displayName}</h2>
                    </>

                )
            }
        </div>
    )
        ;
}
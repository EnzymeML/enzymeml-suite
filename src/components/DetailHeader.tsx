import CardHeader from "./CardHeader.tsx";
import DetailButtons from "./DetailButtons.tsx";
import React from "react";

export interface DetailHeaderProps {
    id: string;
    speciesName: string;
    placeholder: string;
    handleDeleteObject: (id: string) => void;
    setLocked: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DetailHeader(
    {
        id,
        speciesName,
        placeholder,
        handleDeleteObject,
        setLocked
    }: DetailHeaderProps
) {

    return (
        <div className={"flex flex-row justify-between"}>
            <CardHeader id={id} name={speciesName} placeholder={placeholder}/>
            <DetailButtons onLock={() => setLocked((locked) => !locked)}
                           onDelete={() => handleDeleteObject(id)}/>
        </div>
    )
}
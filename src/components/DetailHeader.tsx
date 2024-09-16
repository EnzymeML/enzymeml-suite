import CardHeader from "./CardHeader.tsx";
import DetailButtons from "./DetailButtons.tsx";
import React from "react";
import useAppStore from "../stores/appstore.ts";

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
        setLocked,
    }: DetailHeaderProps
) {

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    return (
        <div className={"flex flex-row justify-between cursor-pointer"}>
            <div onClick={() => setSelectedId(id)}>
                <CardHeader id={id}
                            name={speciesName}
                            placeholder={placeholder}/>

            </div>
            <DetailButtons onLock={() => setLocked((locked) => !locked)}
                           onDelete={() => handleDeleteObject(id)}
            />
        </div>
    )
}
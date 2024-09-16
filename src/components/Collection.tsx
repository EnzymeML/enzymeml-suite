import {AnimatePresence} from "framer-motion";
import React from "react";
import FloatingCreate from "./FloatingCreate.tsx";
import useAppStore from "../stores/appstore.ts";

interface CollectionProps {
    items: React.ReactNode[];
    handleCreateObject: () => Promise<string>;
    type: string;
}

export default function Collection(
    {
        items,
        handleCreateObject,
        type,
    }: CollectionProps
) {

    if (items.length === 0) {
        return null;
    }

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    // Handlers
    const onCreate = () => {
        handleCreateObject().then(
            (id) => {
                setSelectedId(id);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }

    return (
        <AnimatePresence>
            <div className={"flex flex-col"}>
                <FloatingCreate handleCreate={onCreate} type={type}/>
                {items.map((element) => element)}
                <div className={"mb-96"}/>
            </div>
        </AnimatePresence>
    )
}
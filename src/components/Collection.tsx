import {AnimatePresence} from "framer-motion";
import React from "react";

interface CollectionProps {
    items: React.ReactNode[];
}

export default function Collection(
    {items}: CollectionProps) {

    if (items.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            {items.map((element) => element)}
            <div className={"mb-96"}/>
        </AnimatePresence>
    )
}
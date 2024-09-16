import {AnimatePresence} from "framer-motion";
import React from "react";

export default function Collection(
    {
        items,
    }: {
        items: React.ReactNode[]
    }) {
    return (
        <AnimatePresence>
            {items.map((element) => element)}
        </AnimatePresence>
    )
}
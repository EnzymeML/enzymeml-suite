import {AnimatePresence, LayoutGroup, motion} from "framer-motion";
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
                console.log("Created from Collection. Setted selectedId to: ", id)
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }

    return (
        <AnimatePresence>
            <motion.div
                className={"flex flex-col"}
                key={type}
                initial={{opacity: 0.0}}
                animate={{opacity: 1}}
                transition={{duration: 0.1, ease: "easeInOut"}}
                style={{overflow: 'hidden'}}
            >
                <FloatingCreate handleCreate={onCreate} type={type}/>
                <LayoutGroup>
                    {items.map((element) => element)}
                    <div className={"mb-72"}/>
                </LayoutGroup>
            </motion.div>
        </AnimatePresence>
    )
}
import React from "react";
import {motion} from "framer-motion"

interface RevealProps {
    children: React.ReactNode;
    targetKey: string;
    useTranslate?: boolean;
}

export default function Reveal(
    {children, targetKey, useTranslate}: RevealProps
) {

    let translateY

    if (useTranslate) {
        translateY = 40
    } else {
        translateY = 0.0
    }

    return (
        <motion.div key={targetKey}
                    initial={{opacity: 0, translateY: translateY}}
                    exit={{opacity: 0, translateY: translateY}}
                    animate={{opacity: 1, translateY: 0.0}}
                    transition={{duration: 0.1}}
        >
            {children}
        </motion.div>)
}
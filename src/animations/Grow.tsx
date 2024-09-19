import {AnimatePresence, motion} from "framer-motion";
import React from "react";

export default function Grow(
    {children}: { children: React.ReactNode }
) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{height: 0}}
                animate={{height: 'auto'}}
                exit={{opacity: 0, height: 0}}
                transition={{
                    height: {duration: 0.20, ease: 'easeInOut'},
                }}
                style={{overflow: 'hidden'}}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
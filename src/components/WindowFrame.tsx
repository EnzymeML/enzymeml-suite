import React from "react";

import TitleBar from "@components/TitleBar.tsx";
import Footer from "@components/Footer.tsx";

export default function WindowFrame(
    {
        children,
        useButtons = true,
    }: {
        children: React.ReactNode
        useButtons?: boolean
    }
) {
    return (
        <div className={"flex z-50 flex-col h-screen"}>
            <TitleBar useButtons={useButtons} />
            {children}
            <Footer />
        </div>
    )
}
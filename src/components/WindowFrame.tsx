import React from "react";
import TitleBar from "./TitleBar.tsx";
import Footer from "./Footer.tsx";

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
        <div className={"h-screen flex flex-col z-50"}>
            <TitleBar useButtons={useButtons}/>
            {children}
            <Footer/>
        </div>
    )
}
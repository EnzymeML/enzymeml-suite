import React from "react";
import TitleBar from "./TitleBar.tsx";
import Footer from "./Footer.tsx";

export default function WindowFrame(
    {
        children
    }: {
        children: React.ReactNode
    }
) {
    return (
        <div className={"h-screen flex flex-col z-50"}>
            <TitleBar/>
            {children}
            <Footer/>
        </div>
    )
}
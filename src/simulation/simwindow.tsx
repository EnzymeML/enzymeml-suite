import React from "react";
import ReactDOM from "react-dom/client";
import Simulation from "./simulation.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Simulation/>
    </React.StrictMode>,
);

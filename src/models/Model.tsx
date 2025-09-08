import Equations from "./Equations.tsx";
import Parameters from "../modelling/components/Parameters.tsx";

export default function Model() {
    return (
        <div className={"flex flex-col"}>
            <Equations />
            <Parameters />
        </div>
    )
}
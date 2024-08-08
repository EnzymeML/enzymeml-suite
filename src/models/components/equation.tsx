import {convertLatexToAsciiMath, MathfieldElement} from "mathlive";
import "//unpkg.com/mathlive";
import React, {useEffect, useState} from "react";
import {extractVariables} from "../utils.ts";
import "./equation.css";
import {Badge} from "antd";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
        }
    }
}

function Equation() {
    // States
    const [latexEquation, setLatexEquation] = useState<string>("");
    const [plainEquation, setPlainEquation] = useState<string>("");
    const [variables, setVariables] = useState<string[]>([])

    // Effects
    useEffect(() => {
        const extractedVars = extractVariables(plainEquation);
        if (extractedVars) {
            // Create a set from the extracted variables to remove duplicates
            setVariables([...new Set(extractedVars)]);
        }

    }, [plainEquation]);


    // Handlers
    const onMathInput = (evt: React.FormEvent<MathfieldElement>) => {
        // @ts-ignore
        let value = evt.target.value;

        // Replace \max with max
        value = value.replace(/\\max/g, 'max');

        setLatexEquation(value);
        setPlainEquation(
            convertLatexToAsciiMath(value)
                .replace(/_\(([^)]+)\)/g, '_$1')
        );
    }

    return (
        <div className={"flex flex-col w-full"}>
            <span>Equation</span>
            <div className={"flex flex-row place-items-center h-auto"}>
                <math-field read-only={true}>
                    {`\\frac{ds_{0}}{dt} = `}
                </math-field>
                <math-field className={"w-full"}
                            onInput={onMathInput}
                >
                    {latexEquation}
                </math-field>
            </div>
            {latexEquation}
            {
                variables.length > 0 &&
                <div className={"flex flex-col gap-2"}>
                    <span>Variables</span>
                    <ul>
                        {variables.map((variable, index) => {
                            return <Badge count={variable} key={index} color={"cyan"}/>
                        })}
                    </ul>
                </div>
            }
        </div>
    );
}

export default Equation;
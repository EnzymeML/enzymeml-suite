import {convertLatexToAsciiMath, MathfieldElement} from "mathlive";
import "//unpkg.com/mathlive";
import React, {useEffect, useState} from "react";
import {asciiToLatex, convertSpeciesIDsToUnderscore, convertUnderscoreSpeciesToIDs, idToLatex} from "../utils.ts";
import "./equation.css";
import {Form} from "antd";
import {ChildProps} from "../../types.ts";
import {Equation} from "enzymeml/src";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
        }
    }
}

function RateLaw(props: {
    id: string | null | undefined,
    onInput: (evt: React.FormEvent<MathfieldElement>) => void,
    latexEquation: string
}) {
    return <div className={"flex flex-row place-items-center justify-start h-auto"}>
        <math-field read-only={true} id={"static-math-field"}>
            {`\\frac{d ${idToLatex(props.id)} }{dt} = `}
        </math-field>
        <math-field className={"w-full"}
                    id={"dynamic-math-field"}
                    onBlur={props.onInput}
                    onKeyDown={(evt) => {
                        // If the event is enter key, blur the field
                        if (evt.key === "Enter") {
                            evt.currentTarget.blur();
                        }

                        // If escape is pressed, return to the previous value
                        if (evt.key === "Escape") {
                            // @ts-ignore
                            evt.target.value = props.latexEquation;
                            evt.currentTarget.blur();
                        }
                    }}
        >
            {props.latexEquation}
        </math-field>
    </div>;
}

export default function Model(
    {
        data,
        handleUpdateObject,
        form,
    }: ChildProps<Equation>
) {
    // States
    const [latexEquation, setLatexEquation] = useState<string>("");

    // Effects
    useEffect(() => {
        // Convert IDs to underscores in the equation.css
        convertSpeciesIDsToUnderscore(data.equation)
            .then((converted) => {
                    setLatexEquation(asciiToLatex(converted));
                }
            ).catch((error) => {
                console.error('Error:', error);
            }
        )

    }, []);

    // Handlers
    const onMathInput = (evt: React.FormEvent<MathfieldElement>) => {
        // @ts-ignore
        let value = evt.target.value;

        // Replace \max with max
        value = value.replace(/\\max/g, 'max');
        let asciiEquation = convertLatexToAsciiMath(value)
            .replace(/_\(([^)]+)\)/g, '_$1');

        // Set states in frontend and backend
        setLatexEquation(value);
        convertUnderscoreSpeciesToIDs(asciiEquation).then(
            (converted) => {
                form.setFieldValue('equation', converted);
                handleUpdateObject();
            }
        ).catch((error) => {
            console.error('Error:', error);
        })
    }

    return (
        <Form
            className={"flex flex-col w-full"}
            layout={"vertical"}
            initialValues={data}
            onValuesChange={handleUpdateObject}
            form={form}
        >
            <Form.Item name="equation">
                <RateLaw id={data.species_id} onInput={onMathInput} latexEquation={latexEquation}/>
            </Form.Item>
        </Form>
    );
}

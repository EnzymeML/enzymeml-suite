import React from "react";
import {FormViewProps} from "../types.ts";
import {Equation} from "enzymeml/src";
import FormBase from "../components/FormBase.tsx";
import {Form} from "antd";
import EquationInput from "../components/EquationInput.tsx";
import {asciiToLatex} from "../utilities/equationutils.ts";


export default function EquationForm(
    {context}: FormViewProps<Equation>
) {
    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    // Handlers
    // @ts-ignore
    const handleEquationChange = (equation: string) => {
        form.setFieldsValue({equation: equation});
        handleUpdateObject();
    }

    return (
        <FormBase
            className={"h-auto"}
            form={form}
            data={data}
            handleUpdate={handleUpdateObject}
            locked={locked}
        >
            <Form.Item name={"equation"}
                       style={{
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center',
                       }}
            >
                <div className={"w-full -translate-y-3"}>
                    <EquationInput id={data.species_id}
                                   equation={asciiToLatex(data.equation)}
                                   isOde={data.equation_type === "ode"}
                                   onChange={handleEquationChange}
                    />
                </div>
            </Form.Item>
        </FormBase>
    );
}
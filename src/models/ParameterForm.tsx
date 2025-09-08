import React from "react";
import Latex from 'react-latex-next'
import 'katex/dist/katex.css'
import { FormViewProps } from "../types.ts";
import { Parameter } from "enzymeml";
import FormBase from "../components/FormBase.tsx";
import { asciiToLatex } from "../utilities/equationutils.ts";
import { Form, InputNumber } from "antd";


export default function ParameterForm(
    { context }: FormViewProps<Parameter>
) {
    // Context
    const { handleUpdateObject, form, data, locked } = React.useContext(context);

    return (
        <FormBase
            className={"h-auto"}
            form={form}
            data={data}
            handleUpdate={handleUpdateObject}
            locked={locked}
        >
            <Latex>{`$ \\large ${asciiToLatex(data.name)} $`}</Latex>
            <Form.Item name={"value"} label="Value">
                <InputNumber placeholder="Value" />
            </Form.Item>
        </FormBase>
    );
}
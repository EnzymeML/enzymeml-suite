import {Form, Input, Switch} from "antd";
import {FormViewProps} from "../types.ts";
import {Reaction} from "../../../enzymeml-ts/src";
import React from "react";
import FormBase from "../components/FormBase.tsx";

export default function ReactionForm(
    {context}: FormViewProps<Reaction>
) {

    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    return (

        <FormBase
            form={form}
            data={data}
            handleUpdate={handleUpdateObject}
            locked={locked}
        >
            <Form.Item label="Name" name="name">
                <Input/>
            </Form.Item>
            <Form.Item label="Is reversible" name="reversible" valuePropName="checked">
                <Switch/>
            </Form.Item>
        </FormBase>
    );
}
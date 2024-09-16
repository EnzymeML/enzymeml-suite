import {Form, Input, Switch} from "antd";
import {FormViewProps} from "../types.ts";
import {Reaction} from "../../../enzymeml-ts/src";
import React from "react";

export default function ReactionForm(
    {context}: FormViewProps<Reaction>
) {

    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    return (

        <Form
            form={form}
            labelCol={{span: 4}}
            wrapperCol={{span: 16}}
            layout="horizontal"
            initialValues={data}
            disabled={locked}
            onValuesChange={handleUpdateObject}
        >
            <Form.Item label="Name" name="name">
                <Input/>
            </Form.Item>
            <Form.Item label="Is reversible" name="reversible" valuePropName="checked">
                <Switch/>
            </Form.Item>
        </Form>
    );
}
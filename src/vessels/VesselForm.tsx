import {Form, Input, InputNumber, Switch} from "antd";
import {FormViewProps} from "../types.ts";
import {Vessel} from "../../../enzymeml-ts/src";
import React from "react";

export default function VesselForm(
    {context}: FormViewProps<Vessel>
) {
    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    return (
        <Form
            form={form}
            labelCol={{span: 4}}
            wrapperCol={{span: 16}}
            layout="horizontal"
            disabled={locked}
            initialValues={data}
            onValuesChange={handleUpdateObject}
        >
            <Form.Item label="Name" name="name">
                <Input/>
            </Form.Item>
            <Form.Item label="Volume" name="volume">
                <InputNumber
                    type={"number"}
                    placeholder="Vessel volume"
                />
            </Form.Item>
            <Form.Item label="Unit" name="unit">
                <Input/>
            </Form.Item>
            <Form.Item label="Is constant" name="constant" valuePropName="checked">
                <Switch/>
            </Form.Item>
        </Form>
    );
}
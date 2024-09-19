import {Form, Input, InputNumber, Switch} from "antd";
import {FormViewProps} from "../types.ts";
import {Vessel} from "../../../enzymeml-ts/src";
import React from "react";
import FormBase from "../components/FormBase.tsx";

export default function VesselForm(
    {context}: FormViewProps<Vessel>
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
            <Form.Item label="Volume" name="volume">
                <InputNumber
                    className={"w-full"}
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
        </FormBase>
    );
}
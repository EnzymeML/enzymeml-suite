import {Form, Input, Radio} from "antd";
import {FormViewProps} from "../types.ts";
import {Vessel} from "enzymeml/src";
import React from "react";
import FormBase from "../components/FormBase.tsx";
import QuantityForm from "../components/QuantityForm.tsx";
import {UnitTypes} from "../commands/units.ts";

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
            <Form.Item label="Volume">
                <QuantityForm name={"volume"}
                              unitPath={"unit"}
                              label={"Volume"}
                              unitTypes={[UnitTypes.VOLUME]}
                              required={false}
                              handleUpdateObject={handleUpdateObject}
                />
            </Form.Item>
            <Form.Item label={"Constant"} name={"constant"}>
                <Radio.Group defaultValue={true} className={"flex flex-row w-full"}>
                    <Radio.Button
                        className={"flex-1 text-center"}
                        value={true}
                    >
                        Constant
                    </Radio.Button>
                    <Radio.Button
                        className={"flex-1 text-center"}
                        value={false}
                    >
                        Not Constant
                    </Radio.Button>
                </Radio.Group>
            </Form.Item>
        </FormBase>
    );
}
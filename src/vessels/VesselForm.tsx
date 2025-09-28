import React from "react";
import { Form, Input, Radio } from "antd";
import { Vessel } from "enzymeml";

import { FormViewProps } from "@suite-types/types";
import FormBase from "@components/FormBase";
import QuantityForm from "@components/QuantityForm";
import { UnitTypes } from "@commands/units";

export default function VesselForm({ context }: FormViewProps<Vessel>) {
  // Context
  const { handleUpdateObject, form, data, locked } = React.useContext(context);

  // Memoize handleUpdateObject to prevent unnecessary re-renders
  const memoizedHandleUpdate = React.useCallback(() => {
    handleUpdateObject();
  }, [handleUpdateObject]);

  return (
    <FormBase
      form={form}
      data={data}
      handleUpdate={memoizedHandleUpdate}
      locked={locked}
    >
      <Form.Item label="Name" name="name">
        <Input />
      </Form.Item>
      <Form.Item label="Volume">
        <QuantityForm
          name={"volume"}
          unitPath={"unit"}
          label={"Volume"}
          unitTypes={[UnitTypes.VOLUME]}
          required={false}
          handleUpdateObject={memoizedHandleUpdate}
          form={form}
        />
      </Form.Item>
      <Form.Item label={"Constant"} name={"constant"}>
        <Radio.Group defaultValue={true} className={"flex flex-row w-full"}>
          <Radio.Button className={"flex-1 text-center"} value={true}>
            Constant
          </Radio.Button>
          <Radio.Button className={"flex-1 text-center"} value={false}>
            Not Constant
          </Radio.Button>
        </Radio.Group>
      </Form.Item>
    </FormBase>
  );
}

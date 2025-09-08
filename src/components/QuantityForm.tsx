import { getUnitGroups, UnitMap, UnitTypes } from "../commands/units.ts";
import {
  Form,
  FormInstance,
  InputNumber,
  Select,
  SelectProps,
  Space,
} from "antd";
import { useEffect, useState } from "react";

interface QuantityFormProps {
  name: string | (string | number)[];
  unitPath: string | (string | number)[];
  label: string;
  unitTypes: UnitTypes[];
  required: boolean;
  handleUpdateObject: () => void;
  form: FormInstance;
}

export default function QuantityForm({
  name,
  required,
  label,
  unitPath,
  unitTypes,
  handleUpdateObject,
  form,
}: QuantityFormProps) {
  // States
  const [unitOptions, setUnitOptions] = useState<SelectProps["options"]>([]);
  const [unitMap, setUnitMap] = useState<UnitMap>({});
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Effects: Fetch unit options
  useEffect(() => {
    getUnitGroups(unitTypes)
      .then((data) => {
        setUnitMap(data);
        setUnitOptions(
          Object.entries(data).map(([name, unit]) => ({
            label: name,
            value: name,
            unit: unit,
          }))
        );

        // Effect: Set selected unit based on form values
        // This is done, because the unit is not a string, but an object
        const currentUnit = form.getFieldValue(unitPath);
        const unitName = Object.entries(data).find(
          ([_, unit]) => JSON.stringify(unit) === JSON.stringify(currentUnit)
        )?.[0];

        if (unitName) {
          setSelectedUnit(unitName);
        }
      })
      .catch((error) => {
        console.error("Error fetching units:", error);
      });
  }, [unitTypes]);

  return (
    <Space.Compact className={"w-full"}>
      <Form.Item noStyle name={name} rules={[{ required }]}>
        <InputNumber
          placeholder={label}
          onChange={handleUpdateObject}
          style={{ width: "60%" }}
        />
      </Form.Item>

      {/* Hidden Form.Item that actually stores the value */}
      {/* This is done, because the unit is not a string, but an object */}
      <Form.Item noStyle hidden name={unitPath} rules={[{ required }]} />

      {/* Visible Select that acts as a proxy */}
      {/* This select displays the unit options, but the value is the unit name */}
      <Select
        options={unitOptions}
        placeholder="Unit"
        value={selectedUnit}
        onChange={(value) => {
          setSelectedUnit(value);
          form.setFieldsValue({
            [Array.isArray(unitPath) ? unitPath.join(".") : unitPath]:
              unitMap[value],
          });
          handleUpdateObject();
        }}
        style={{ width: "40%" }}
      />
    </Space.Compact>
  );
}

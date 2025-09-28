import { useEffect, useState } from "react";
import {
  Form,
  FormInstance,
  InputNumber,
  Select,
  SelectProps,
  Space,
} from "antd";

import { getUnitGroups, UnitMap, UnitTypes } from "@commands/units.ts";

/**
 * Props interface for the QuantityForm component
 */
interface QuantityFormProps {
  /** Form field name for the numeric value */
  name: string | (string | number)[];
  /** Form field path for the unit object */
  unitPath: string | (string | number)[];
  /** Label/placeholder text for the input field */
  label: string;
  /** Array of unit types to filter available units */
  unitTypes: UnitTypes[];
  /** Whether the field is required */
  required: boolean;
  /** Callback function to handle object updates */
  handleUpdateObject: () => void;
  /** Ant Design form instance */
  form: FormInstance;
}

/**
 * QuantityForm component that provides a combined input for numeric values and their units
 * 
 * Features:
 * - Numeric input field for quantity values
 * - Unit selector with filtered options based on unit types
 * - Automatic form synchronization with proper unit object storage
 * - Support for both string and array-based form field paths
 * 
 * The component uses a dual approach for unit handling:
 * - A hidden Form.Item stores the actual unit object
 * - A visible Select acts as a proxy displaying unit names
 * 
 * @param props - The component props
 * @returns JSX element containing the quantity form with numeric input and unit selector
 */
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
  /** Available unit options for the select dropdown */
  const [unitOptions, setUnitOptions] = useState<SelectProps["options"]>([]);
  /** Map of unit names to unit objects */
  const [unitMap, setUnitMap] = useState<UnitMap>({});
  /** Currently selected unit name (for display purposes) */
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Effects
  /**
   * Fetches available unit options based on the provided unit types
   * Also synchronizes the selected unit with the current form value
   */
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

        // Synchronize selected unit with current form value
        // This is necessary because the unit is stored as an object, not a string
        const currentUnit = form.getFieldValue(unitPath);
        const unitName = Object.entries(data).find(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      {/* Numeric input field for the quantity value */}
      <Form.Item noStyle name={name} rules={[{ required }]}>
        <InputNumber
          placeholder={label}
          onChange={handleUpdateObject}
          style={{ width: "60%" }}
        />
      </Form.Item>

      {/* Hidden Form.Item that stores the actual unit object */}
      {/* This approach is used because units are complex objects, not simple strings */}
      <Form.Item noStyle hidden name={unitPath} rules={[{ required }]} />

      {/* Visible Select that acts as a proxy for unit selection */}
      {/* Displays unit names but stores unit objects in the hidden form field */}
      <Select
        options={unitOptions}
        placeholder="Unit"
        value={selectedUnit}
        onChange={(value) => {
          setSelectedUnit(value)

          // Handle both string and array-based field paths properly
          if (Array.isArray(unitPath)) {
            form.setFieldValue(unitPath, unitMap[value]);
          } else {
            form.setFieldsValue({
              [unitPath]: unitMap[value],
            });
          }

          handleUpdateObject();
        }}
        style={{ width: "40%" }}
      />
    </Space.Compact>
  );
}

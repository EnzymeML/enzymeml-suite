import { Button, Form, FormListFieldData, FormListOperation, Input, InputNumber, SelectProps } from "antd";
import React, { useEffect, useState } from "react";
import { DataTypes, Measurement } from "enzymeml";
import { AutoCompleteProps } from "antd/lib";

import FormBase from "@components/FormBase";
import { listAllSpeciesIdsNames } from "@commands/enzmldoc";
import { FormViewProps } from "@suite-types/types";
import SpeciesReference from "@components/SpeciesReference";
import { UnitTypes } from "@commands/units";
import QuantityForm from "@components/QuantityForm";

import InitialsField from "@measurements/components/InitialsField";

export const mapSpeciesToOption = (
  species: [string, string][]
): AutoCompleteProps["options"] => {
  return species
    .map(([id, name]) => ({
      value: id,
      label: <SpeciesReference name={name} id={id} />,
    }))
    .filter((option) => option !== null) as AutoCompleteProps["options"];
};

export default function MeasurementForm({
  context,
}: FormViewProps<Measurement>) {
  // States
  const [availableSpecies, setAvailableSpecies] = useState<
    SelectProps["options"]
  >([]);

  // Context
  const { handleUpdateObject, form, data, locked } = React.useContext(context);

  // Memoize handlers
  const handleAddSpecies = React.useCallback(
    () => ({
      data_type: DataTypes.CONCENTRATION,
      is_simulated: false,
    }),
    []
  );

  // Add a debug wrapper for handleUpdateObject
  const handleUpdateMeasurement = React.useCallback(async () => {
    try {
      console.log('Form data before update:', form.getFieldsValue());
      console.log('Current data:', data);

      // Call the original handler
      await handleUpdateObject();

      console.log('Update successful');
    } catch (error) {
      console.error('Update failed:', error);
    }
  }, [form, data, handleUpdateObject]);

  // Effects with cleanup
  useEffect(() => {
    let mounted = true;

    listAllSpeciesIdsNames()
      .then((data) => {
        if (!mounted) return;
        setAvailableSpecies(
          mapSpeciesToOption(data) as AutoCompleteProps["options"]
        );
      })
      .catch((e) => console.log("Failed to fetch species: ", e));

    return () => {
      mounted = false;
    };
  }, []);

  // Memoize the form fields rendering
  const renderInitialsFields = (fields: FormListFieldData[], subOpt: FormListOperation) => (
    <div style={{ display: "flex", flexDirection: "column", rowGap: 16 }}>
      {fields.map((field) => (
        <InitialsField
          key={field.key}
          field={field}
          subOpt={subOpt}
          availableSpecies={availableSpecies}
          handleUpdateObject={handleUpdateObject}
          form={form}
        />
      ))}
      <Button
        type="dashed"
        onClick={() => subOpt.add(handleAddSpecies())}
        block
      >
        + Add Species
      </Button>
    </div>
  );

  return (
    <FormBase
      form={form}
      data={data}
      handleUpdate={handleUpdateMeasurement}
      locked={locked}
    >
      <Form.Item label="Name" name="name">
        <Input />
      </Form.Item>
      <Form.Item
        label="pH"
        name="ph"
        rules={[
          {
            type: "number",
            min: 0,
            max: 14,
            message: "pH must be between 0 and 14",
          },
        ]}
      >
        <InputNumber className="w-full" type="number" placeholder="pH value" />
      </Form.Item>
      <Form.Item label={"Temperature"}>
        <QuantityForm
          name={"temperature"}
          unitPath={"temperature_unit"}
          label={"Temperature"}
          unitTypes={[UnitTypes.TEMPERATURE]}
          required={false}
          handleUpdateObject={handleUpdateObject}
          form={form}
        />
      </Form.Item>
      <Form.Item label={"Initials"}>
        <Form.List name="species_data">{renderInitialsFields}</Form.List>
      </Form.Item>
    </FormBase>
  );
}

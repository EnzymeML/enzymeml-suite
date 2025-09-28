import React, { useEffect, useState } from "react";
import { EquationType, Reaction, ReactionElement } from "enzymeml";
import {
  AutoCompleteProps,
  Button,
  Form,
  Input,
  Radio,
  SelectProps,
} from "antd";

import { FormViewProps } from "@suite-types/types";
import FormBase from "@components/FormBase";
import { listAllSpeciesIdsNames } from "@commands/enzmldoc";
import { mapSpeciesToOption } from "@measurements/MeasurementForm";
import KineticLawDisplay from "@kineticlaw/KineticLawDisplay";

import ReactionElementField from "@reactions/components/ReactionElementField";
import ModifierElementField from "@reactions/components/ModifierElementField";

export interface EquationDisplayProps {
  reactants: ReactionElement[];
  products: ReactionElement[];
  isReversible: boolean;
}

export default function ReactionForm({ context }: FormViewProps<Reaction>) {
  // States
  const [availableSpecies, setAvailableSpecies] = useState<
    SelectProps["options"]
  >([]);

  // Context
  const { handleUpdateObject, form, data, locked } = React.useContext(context);

  // Memoize add reactant/product handlers
  const handleAddElement = React.useCallback(
    () => ({ stoichiometry: 1, species_id: null }),
    []
  );
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



  return (
    <FormBase
      form={form}
      data={data}
      handleUpdate={handleUpdateObject}
      locked={locked}
    >
      {/* <Grow>{chemicalReaction}</Grow> */}
      <Form.Item label="Name" name="name">
        <Input />
      </Form.Item>
      <Form.Item label="Reversible" name="reversible">
        <Radio.Group defaultValue={false} className={"flex flex-row w-full"}>
          <Radio.Button className={"flex-1 text-center"} value={true}>
            Reversible
          </Radio.Button>
          <Radio.Button className={"flex-1 text-center"} value={false}>
            Irreversible
          </Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label={"Reactants"}>
        <Form.List name={"reactants"}>
          {(fields, subOpt) => (
            <div
              style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
            >
              {fields.map((field) => {
                return (
                  <ReactionElementField
                    key={field.key}
                    field={field}
                    subOpt={subOpt}
                    availableSpecies={availableSpecies}
                    handleUpdateObject={handleUpdateObject}
                  />
                );
              })}
              <Button
                type="dashed"
                onClick={() => subOpt.add(handleAddElement())}
                block
              >
                + Add Reactant
              </Button>
            </div>
          )}
        </Form.List>
      </Form.Item>
      <Form.Item label={"Products"}>
        <Form.List name={"products"}>
          {(fields, subOpt) => (
            <div
              style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
            >
              {fields.map((field) => {
                return (
                  <ReactionElementField
                    key={field.key}
                    field={field}
                    subOpt={subOpt}
                    availableSpecies={availableSpecies}
                    handleUpdateObject={handleUpdateObject}
                  />
                );
              })}
              <Button
                type="dashed"
                onClick={() => subOpt.add(handleAddElement())}
                block
              >
                + Add Product
              </Button>
            </div>
          )}
        </Form.List>
      </Form.Item>
      <Form.Item label={"Modifiers"}>
        <Form.List name={"modifiers"}>
          {(fields, subOpt) => (
            <div
              style={{ display: "flex", flexDirection: "column", rowGap: 16 }}
            >
              {fields.map((field) => (
                <ModifierElementField
                  key={field.key}
                  field={field}
                  subOpt={subOpt}
                  availableSpecies={availableSpecies}
                  handleUpdateObject={handleUpdateObject}
                />
              ))}
              <Button type="dashed" onClick={() => subOpt.add()} block>
                + Add Modifier
              </Button>
            </div>
          )}
        </Form.List>
      </Form.Item>
      <Form.Item label={"Kinetic Law"}>
        <KineticLawDisplay
          reactionId={data.id}
          kineticLaw={data.kinetic_law}
          onUpdate={handleUpdateObject}
          disabled={locked}
        />
      </Form.Item>
      <Form.Item name={["kinetic_law", "equation"]} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={["kinetic_law", "equation_type"]} hidden>
        <Input value={EquationType.RATE_LAW} />
      </Form.Item>
    </FormBase>
  );
}

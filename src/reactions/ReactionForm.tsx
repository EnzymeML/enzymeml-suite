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
import { listSmallMoleculesWithSMILES } from "@suite/commands/smallmols";
import createReactionSMILES from "@reactions/utils";
import ReactionDrawerContainer from "@reactions/components/ReactionDrawerContainer";

/**
 * Props for the EquationDisplay component
 */
export interface EquationDisplayProps {
  /** Array of reactant elements in the reaction */
  reactants: ReactionElement[];
  /** Array of product elements in the reaction */
  products: ReactionElement[];
  /** Whether the reaction is reversible */
  isReversible: boolean;
}

/**
 * ReactionForm component for creating and editing chemical reactions
 * 
 * This component provides a comprehensive form interface for managing chemical reactions,
 * including reactants, products, modifiers, and kinetic laws. It features:
 * - Visual reaction representation using SMILES notation
 * - Dynamic form fields for reaction elements
 * - Kinetic law configuration
 * - Species selection from available options
 * 
 * @param context - Form view context containing form data and handlers
 * @returns JSX element representing the reaction form
 */
export default function ReactionForm({ context }: FormViewProps<Reaction>) {
  // States
  /** Available species options for dropdowns */
  const [availableSpecies, setAvailableSpecies] = useState<
    SelectProps["options"]
  >([]);
  /** SMILES string representation of the reaction for visual display */
  const [reactionSMILES, setReactionSMILES] = useState<string>("");

  // Context
  const { handleUpdateObject, form, data, locked } = React.useContext(context);

  /**
   * Memoized handler for adding new reaction elements
   * Returns default structure for new reactants/products
   */
  const handleAddElement = React.useCallback(
    () => ({ stoichiometry: 1, species_id: null }),
    []
  );

  /**
   * Effect to fetch available species for selection dropdowns
   * Includes cleanup to prevent state updates on unmounted component
   */
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

  /**
   * Effect to generate SMILES representation of the reaction
   * Updates whenever reactants or products change
   */
  useEffect(() => {
    // If not defined in the data, return
    if (!data.reactants && !data.products) return;

    const reactants = data.reactants || [];
    const products = data.products || [];

    const reactantIds = reactants.map((reactant) => reactant.species_id);
    const productIds = products.map((product) => product.species_id);
    listSmallMoleculesWithSMILES().then((smallMolecules) => {
      setReactionSMILES(createReactionSMILES(reactantIds, productIds, smallMolecules));
    });
  }, [data.reactants, data.products]);



  return (
    <FormBase
      form={form}
      data={data}
      handleUpdate={handleUpdateObject}
      locked={locked}
    >
      {/* Visual reaction representation */}
      {reactionSMILES.length > 0 && (
        <ReactionDrawerContainer
          className="mb-10"
          smilesStr={reactionSMILES}
          width={700}
          height={170}
          participants={data.reactants.concat(data.products)}
        />
      )}
      {/* <Grow>{chemicalReaction}</Grow> */}

      {/* Basic reaction information */}
      <Form.Item label="Name" name="name">
        <Input />
      </Form.Item>

      {/* Reversibility selection */}
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

      {/* Reactants section */}
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

      {/* Products section */}
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

      {/* Modifiers section */}
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

      {/* Kinetic law configuration */}
      <Form.Item label={"Kinetic Law"}>
        <KineticLawDisplay
          reactionId={data.id}
          kineticLaw={data.kinetic_law}
          onUpdate={handleUpdateObject}
          disabled={locked}
        />
      </Form.Item>

      {/* Hidden fields for kinetic law data */}
      <Form.Item name={["kinetic_law", "equation"]} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={["kinetic_law", "equation_type"]} hidden>
        <Input value={EquationType.RATE_LAW} />
      </Form.Item>
    </FormBase>
  );
}

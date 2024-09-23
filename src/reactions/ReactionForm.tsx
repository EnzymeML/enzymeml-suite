import {Button, Form, Input, Radio, SelectProps} from "antd";
import {FormViewProps} from "../types.ts";
import {EquationType, Reaction, ReactionElement} from "enzymeml/src";
import React, {useEffect, useState} from "react";
import FormBase from "../components/FormBase.tsx";
import {listAllSpeciesIdsNames} from "../commands/enzmldoc.ts";
import {mapSpeciesToOption} from "../measurements/MeasurementForm.tsx";
import ReactionElementField from "./components/ReactionElementField.tsx";
import ModifierElementField from "./components/ModifierElementField.tsx";
import EquationInput, {PLACEHOLDER} from "../components/EquationInput.tsx";
import {asciiToLatex} from "../utilities/equationutils.ts";
import ChemicalReaction from "./components/ChemicalReaction.tsx";
import {motion} from "framer-motion";
import Grow from "../animations/Grow.tsx";


export interface EquationDisplayProps {
    reactants: ReactionElement[],
    products: ReactionElement[],
    isReversible: boolean
}

const convertToDisplayOptions = (
    isReversible: boolean,
    elements?: ReactionElement[] | null,
): EquationDisplayProps => {
    if (!elements) {
        return {
            reactants: [],
            products: [],
            isReversible: isReversible
        }
    }

    const reactants = elements
        .filter(
            (e) => e.stoichiometry < 0)
        .map(
            (e) => e
        )

    const products = elements
        .filter(
            (e) => e.stoichiometry > 0)
        .map(
            (e) => e
        )

    return {
        reactants: reactants,
        products: products,
        isReversible: isReversible
    }
}


export default function ReactionForm(
    {context}: FormViewProps<Reaction>
) {
    // States
    const [availableSpecies, setAvailableSpecies] = useState<SelectProps["options"]>([])

    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    // Effects
    useEffect(() => {
        listAllSpeciesIdsNames().then(
            (data) => {
                setAvailableSpecies(mapSpeciesToOption(data));
            }
        ).catch(
            (e) => console.log("Failed to fetch species: ", e)
        )
    }, []);

    // Handlers
    const handleEquationChange = (equation: string) => {
        if (equation === PLACEHOLDER) {
            handleUpdateObject();
            return;
        }

        const kinetic_law = {
            species_id: data.id,
            equation_type: EquationType.RATE_LAW,
            equation: equation
        }

        form.setFieldsValue({kinetic_law: kinetic_law});
        handleUpdateObject();
    }

    return (

        <FormBase
            form={form}
            data={data}
            handleUpdate={handleUpdateObject}
            locked={locked}
        >
            <Grow>
                {
                    // @ts-ignore
                    data.species.length > 0 ? (
                        <motion.div
                            className={"flex justify-center pb-6 translate-x-10"}
                            animate={{}}
                        >
                            <ChemicalReaction {...convertToDisplayOptions(data.reversible, data.species)}/>
                        </motion.div>
                    ) : null
                }
            </Grow>
            <Form.Item label="Name" name="name">
                <Input/>
            </Form.Item>
            <Form.Item label="Reversible" name="reversible">
                <Radio.Group defaultValue={false} className={"flex flex-row w-full"}>
                    <Radio.Button
                        className={"flex-1 text-center"}
                        value={true}
                    >
                        Reversible
                    </Radio.Button>
                    <Radio.Button
                        className={"flex-1 text-center"}
                        value={false}
                    >
                        Irreversible
                    </Radio.Button>
                </Radio.Group>
            </Form.Item>
            <Form.Item label={"Reactants"}>
                <Form.List name={"species"}>
                    {(fields, subOpt) => (
                        <div style={{display: 'flex', flexDirection: 'column', rowGap: 16}}>
                            {fields.map((field) => {
                                    if (form.getFieldValue(["species", field.name]).stoichiometry < 0) {
                                        return <ReactionElementField field={field}
                                                                     subOpt={subOpt}
                                                                     availableSpecies={availableSpecies}
                                                                     handleUpdateObject={handleUpdateObject}
                                        />
                                    }
                                }
                            )}
                            <Button type="dashed" onClick={() => subOpt.add(
                                {stoichiometry: -1, species_id: null}
                            )} block>
                                + Add Reactant
                            </Button>
                        </div>
                    )}
                </Form.List>
            </Form.Item>
            <Form.Item label={"Products"}>
                <Form.List name={"species"}>
                    {(fields, subOpt) => (
                        <div style={{display: 'flex', flexDirection: 'column', rowGap: 16}}>
                            {fields.map((field) => {
                                    if (form.getFieldValue(["species", field.name]).stoichiometry > 0) {
                                        return <ReactionElementField field={field}
                                                                     subOpt={subOpt}
                                                                     availableSpecies={availableSpecies}
                                                                     handleUpdateObject={handleUpdateObject}
                                        />
                                    }
                                }
                            )}
                            <Button type="dashed" onClick={() => subOpt.add(
                                {stoichiometry: 1, species_id: null}
                            )} block>
                                + Add Product
                            </Button>
                        </div>
                    )}
                </Form.List>
            </Form.Item>
            <Form.Item label={"Modifiers"}>
                <Form.List name={"modifiers"}>
                    {(fields, subOpt) => (
                        <div style={{display: 'flex', flexDirection: 'column', rowGap: 16}}>
                            {fields.map((field) => (
                                    <ModifierElementField field={field}
                                                          subOpt={subOpt}
                                                          availableSpecies={availableSpecies}
                                                          handleUpdateObject={handleUpdateObject}
                                    />
                                )
                            )}
                            <Button type="dashed" onClick={() => subOpt.add()} block>
                                + Add Modifier
                            </Button>
                        </div>
                    )}

                </Form.List>
            </Form.Item>
            <Form.Item label={"Kinetic Law"}
                       name={['kinetic_law', 'equation']}
                       style={{
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center',
                           paddingTop: 16
                       }}
            >
                <div className={"w-full -translate-y-3"}>
                    <EquationInput id={"v(t)"}
                                   equation={
                                       data.kinetic_law ?
                                           asciiToLatex(data.kinetic_law.equation)
                                           : ""
                                   }
                                   isOde={false}
                                   onChange={handleEquationChange}
                    />
                </div>
            </Form.Item>
            <Form.Item name={['kinetic_law', 'equation_type']} hidden>
                <Input value={EquationType.RATE_LAW}/>
            </Form.Item>
        </FormBase>
    );
}
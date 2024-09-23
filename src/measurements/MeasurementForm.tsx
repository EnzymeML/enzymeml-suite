import {Button, Form, Input, InputNumber, SelectProps} from "antd";
import {FormViewProps} from "../types.ts";
import React, {useEffect, useState} from "react";
import FormBase from "../components/FormBase.tsx";
import {DataTypes, Measurement} from "enzymeml/src";
import {listAllSpeciesIdsNames} from "../commands/enzmldoc.ts";
import {AutoCompleteProps} from "antd/lib";
import SpeciesReference from "../components/SpeciesReference.tsx";
import {UnitTypes} from "../commands/units.ts";
import QuantityForm from "../components/QuantityForm.tsx";
import InitialsField from "./components/InitialsField.tsx";

export const mapSpeciesToOption = (species: [string, string][]): AutoCompleteProps["options"] => {
    const options = species.map(
        ([id, name]) => {
            return {value: id, label: <SpeciesReference name={name} id={id}/>}
        }
    )

    return options.filter(
        (option) => option !== null
    ) as AutoCompleteProps["options"]
}

export default function MeasurementForm({context}: FormViewProps<Measurement>) {
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
            <Form.Item
                label="pH"
                name="ph"
                rules={[
                    {
                        type: 'number',
                        min: 0,
                        max: 14,
                        message: 'pH must be between 0 and 14',
                    },
                ]}
            >
                <InputNumber
                    className="w-full"
                    type="number"
                    placeholder="pH value"
                />
            </Form.Item>
            <Form.Item label={"Temperature"}>
                <QuantityForm name={"temperature"}
                              unitPath={"temperature_unit"}
                              label={"Temperature"}
                              unitTypes={[UnitTypes.TEMPERATURE]}
                              required={false}
                              handleUpdateObject={handleUpdateObject}
                />
            </Form.Item>
            <Form.Item label={"Initials"}>
                <Form.List name="species_data">
                    {(fields, subOpt) => (
                        <div style={{display: 'flex', flexDirection: 'column', rowGap: 16}}>
                            {fields.map((field) => (
                                    <>
                                        <InitialsField field={field}
                                                       subOpt={subOpt}
                                                       availableSpecies={availableSpecies}
                                                       handleUpdateObject={handleUpdateObject}
                                        />
                                    </>
                                )
                            )}
                            <Button type="dashed" onClick={() => subOpt.add({
                                data_type: DataTypes.CONCENTRATION,
                                is_simulated: false
                            })}
                                    block>
                                + Add Species
                            </Button>
                        </div>
                    )}
                </Form.List>
            </Form.Item>
        </FormBase>
    );
}
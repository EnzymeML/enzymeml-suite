import {getUnitGroups, UnitMap, UnitTypes} from "../commands/units.ts";
import {Form, InputNumber, Select, SelectProps, Space} from "antd";
import {useEffect, useState} from "react";

interface QuantityFormProps {
    name: string | (string | number)[];
    unitPath: string | (string | number)[];
    label: string;
    unitTypes: UnitTypes[];
    required: boolean;
    handleUpdateObject: () => void;
}

export default function QuantityForm(
    {
        name,
        required,
        label,
        unitPath,
        unitTypes,
        handleUpdateObject,
    }: QuantityFormProps) {
    // States
    const [unitOptions, setUnitOptions] = useState<SelectProps["options"]>([]);
    const [unitMap, setUnitMap] = useState<UnitMap>({})

    // Effects: Fetch unit options
    useEffect(() => {
        getUnitGroups(unitTypes)
            .then((data) => {
                setUnitMap(data);
                setUnitOptions(
                    Object.entries(data).map(([name, unit]) => ({
                        label: name,
                        value: name,
                        unit: unit, // Include the full unit object in the option
                    }))
                );
            })
            .catch((error) => {
                console.error("Error fetching units:", error);
            });
    }, [unitTypes]);

    return (
        <Space.Compact className={"w-full"}>
            {/* Input for the numeric value */}
            <Form.Item noStyle name={name} rules={[{required}]}>
                <InputNumber
                    placeholder={label}
                    onChange={handleUpdateObject}
                    style={{width: '60%'}}
                />
            </Form.Item>
            <Form.Item
                noStyle
                name={unitPath}
                rules={[{required}]}
                getValueFromEvent={(value) => unitMap[value]}
            >
                <Select
                    options={unitOptions}
                    placeholder="Unit"
                    onChange={handleUpdateObject}
                    style={{width: '40%'}}
                />
            </Form.Item>
        </Space.Compact>
    );
}
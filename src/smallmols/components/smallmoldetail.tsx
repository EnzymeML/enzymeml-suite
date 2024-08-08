import React, {useEffect, useState} from "react";
import {AutoComplete, Badge, Button, Form, Input, Select, Switch, Tag} from "antd";
import {ChildProps} from "../../types.ts";
import {SmallMolecule} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/cardheading.tsx";
import {listVessels} from "../../commands/vessels.ts";
import {fetchFromPubChem, fetchPubChemDetails} from "../fetchutils.ts";
import {RiExternalLinkLine} from "react-icons/ri";
import {AutoCompleteProps} from "antd/lib";

interface Option {
    label: string | React.ReactElement,
    value: string,
}

const OptionBadge = ({value}: { value: string }) => {
    let href = `https://pubchem.ncbi.nlm.nih.gov/compound/${value}`;
    return (
        <div className={"flex flex-row justify-between"}>
            <span className="text-gray-600">{value}</span>
            <Tag color="blue" className="scale-90">
                <a className={"flex flex-row gap-2 place-items-center"} href={href} target={"_blank"}>
                    PubChem
                    <RiExternalLinkLine/>
                </a>
            </Tag>
        </div>
    )
}

const VesselBadge = ({name, id}: { name: string, id: string }) => {
    return (
        <div className={"flex flex-row gap-1 place-items-center"}>
            <span>{name}</span>
            <Badge count={id}
                   size={"small"}
                   color={"cyan"}
                   className={"scale-90 opacity-75"}
            />
        </div>
    )

}

export default function SmallMoleculeDetail(
    {
        data,
        handleUpdateObject,
        handleDeleteObject,
        form,
    }: ChildProps<SmallMolecule>
) {

    // States
    const [vesselOptions, setVesselOptions] = useState<Option[]>([])
    const [pubChemOptions, setPubChemOptions] = useState<AutoCompleteProps["options"]>([])

    // Effects
    useEffect(() => {
        // Fetch vessel IDs
        listVessels().then(
            (data) => {
                let options = data.map(
                    ([id, name]) => (
                        {
                            label: <VesselBadge name={name} id={id}/>,
                            value: id
                        }
                    )
                );
                setVesselOptions(options);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Handler
    const handlePreUpdateObject = () => {
        const references = form.getFieldValue("references");
        // Add back as an array if it is a string
        if (typeof references === "string") {
            form.setFieldsValue({references: [references]});
        }
        handleUpdateObject();
    }

    const onSearch = (searchText: string) => {
        fetchFromPubChem(searchText, 15).then(
            (res) => {
                const options = res.map(
                    (item) => {
                        return {value: item, label: <OptionBadge value={item}/>}
                    }
                );
                setPubChemOptions(options);
            }
        );
    }

    const onSelect = (name: string) => {
        fetchPubChemDetails(name, form).then(() => {
            handleUpdateObject();
        })
    }

    // Functions
    const extractHref = (value: string | string[] | undefined | null) => {
        let href

        if (typeof value === "string") {
            href = value;
        } else if (Array.isArray(value)) {
            href = value[0];
        } else {
            return undefined;
        }

        // If the value is not a URL return undefined
        if (!href.startsWith("http")) {
            return undefined;
        }

        return href;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className={"flex flex-row justify-between"}>
                <CardHeader id={data.id} name={data.name} placeholder={"Small Molecule"}/>
                <Button onClick={handleDeleteObject}>Delete</Button>
            </div>
            <Form
                form={form}
                layout="vertical"
                initialValues={data}
                onValuesChange={handlePreUpdateObject}
            >
                <Form.Item label="Name" name="name" rules={[{required: true}]}>
                    <AutoComplete
                        className={"w-full"}
                        options={pubChemOptions}
                        onSearch={onSearch}
                        onSelect={onSelect}
                        onChange={handlePreUpdateObject}
                    />
                </Form.Item>
                <Form.Item label="Is constant" name="constant" valuePropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item label="Vessel" name="vessel_id">
                    <Select options={vesselOptions}/>
                </Form.Item>
                <Form.Item label="Canonical SMILES" name="canonical_smiles">
                    <Input/>
                </Form.Item>
                <Form.Item label="InChIKey" name="inchikey">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label={
                        extractHref(form.getFieldValue("references")) ?
                            <a className={"flex flex-row gap-1 place-items-baseline"}
                               href={extractHref(form.getFieldValue("references"))}
                               target={"_blank"}
                            >
                                Reference
                                <RiExternalLinkLine size={11}/>
                            </a> : "Reference"
                    }
                    name="references">
                    <Input/>
                </Form.Item>
            </Form>
        </div>
    );
}
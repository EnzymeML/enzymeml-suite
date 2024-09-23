import {AutoComplete, Col, Form, Input, Radio, Row, Select} from "antd";
import {RiExternalLinkLine} from "react-icons/ri";
import capitalize from "antd/lib/_util/capitalize";
import DBEntryRow from "../components/DBEntryRow.tsx";
import {fetchFromPubChem, fetchPubChemDetails} from "./fetchutils.ts";
import React, {useEffect, useState} from "react";
import {Option} from "../types/options.ts";
import {AutoCompleteProps} from "antd/lib";
import {listVessels} from "../commands/vessels.ts";
import SpeciesReference from "../components/SpeciesReference.tsx";
import {ChildProps} from "../types.ts";
import {SmallMolecule} from "enzymeml/src";
import useAppStore from "../stores/appstore.ts";
import SmileDrawerContainer from "./components/SmilesDrawerContainer.tsx";
import FormBase from "../components/FormBase.tsx";

export const extractHref = (value: string | string[] | undefined | null) => {
    let href

    if (typeof value === "string") {
        href = value;
    } else if (Array.isArray(value)) {
        href = value[0];
    } else {
        return undefined;
    }

    // If the value is not a URL return undefined
    if (!href?.startsWith("http")) {
        return undefined;
    }

    return href;
}

export default function SmallMoleculeForm(
    {context}: { context: React.Context<ChildProps<SmallMolecule>> }
) {
    // States
    const [vesselOptions, setVesselOptions] = useState<Option[]>([])
    const [pubChemOptions, setPubChemOptions] = useState<AutoCompleteProps["options"]>([])
    const databasesToUse = useAppStore((state) => state.databasesToUse);

    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    // Effects
    useEffect(() => {
        // Fetch vessel IDs
        listVessels().then(
            (data) => {
                let options = data.map(
                    ([id, name]) => (
                        {
                            label: <SpeciesReference name={name} id={id}/>,
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

        // Capitalize the name
        const name = form.getFieldValue("name");
        form.setFieldsValue({name: capitalize(name)});

        handleUpdateObject();
    }

    const onSearch = (searchText: string) => {
        if (!databasesToUse.includes("pubchem")) {
            return;
        }

        fetchFromPubChem(searchText, 15).then(
            (res) => {
                const options = res.map(
                    (item) => {
                        return {
                            value: item,
                            label: <DBEntryRow value={item} database={"PubChem"}
                                               baseUri={"https://pubchem.ncbi.nlm.nih.gov/compound/"}
                                               id={item}
                            />
                        }
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

    return (
        <FormBase
            form={form}
            data={data}
            handleUpdate={handlePreUpdateObject}
            locked={locked}
        >
            <Row gutter={16} align={"top"}>
                <Col span={17}>
                    <Form.Item label="Name" name="name" rules={[{required: true}]}>
                        <AutoComplete
                            className={"w-full"}
                            options={pubChemOptions}
                            onSearch={onSearch}
                            onSelect={onSelect}
                            onChange={handlePreUpdateObject}
                        />
                    </Form.Item>
                    <Form.Item label="Vessel" name="vessel_id">
                        <Select options={vesselOptions}/>
                    </Form.Item>
                    <Form.Item label={"Constant"} name={"constant"}>
                        <Radio.Group defaultValue={true} className={"flex flex-row w-full"}>
                            <Radio.Button
                                className={"flex-1"}
                                value={true}
                            >
                                Constant
                            </Radio.Button>
                            <Radio.Button
                                className={"flex-1"}
                                value={false}
                            >
                                Not Constant
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="SMILES" name="canonical_smiles">
                        <Input.TextArea/>
                    </Form.Item>
                    <Form.Item label="InChIKey" name="inchikey">
                        <Input.TextArea/>
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
                </Col>
                <Col span={5}>
                    <SmileDrawerContainer smilesStr={form.getFieldValue("canonical_smiles")}/>
                </Col>
            </Row>
        </FormBase>
    )
}
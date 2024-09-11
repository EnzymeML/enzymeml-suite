import {AutoComplete, Button, Form, Input, Select, Switch} from "antd";
import {ChildProps} from "../../types.ts";
import {Protein} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/cardheading.tsx";
import React, {useEffect, useState} from "react";
import {listVessels} from "../../commands/vessels.ts";
import {extractHref, Option, OptionBadge, VesselBadge} from "../../smallmols/components/smallmoldetail.tsx";
import {AutoCompleteProps} from "antd/lib";
import {fetchFromUniProt, UniProtEntry} from "../fetchutils.ts";
import {RiExternalLinkLine} from "react-icons/ri";

export default function ProteinDetail(
    {
        data,
        handleUpdateObject,
        handleDeleteObject,
        form,
    }: ChildProps<Protein>
) {
    const [vesselOptions, setVesselOptions] = useState<Option[]>([])
    const [uniprotOptions, setUniprotOptions] = useState<AutoCompleteProps["options"]>([])
    const [unitProtResult, setUnitProtResult] = useState<UniProtEntry[]>()

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

    // Reference handler
    const handlePreUpdateObject = () => {
        const references = form.getFieldValue("references");
        // Add back as an array if it is a string
        if (typeof references === "string") {
            form.setFieldsValue({references: [references]});
        }
        handleUpdateObject();
    }

    // Search and autocomplete Uniprot
    const onSearch = (searchText: string) => {
        fetchFromUniProt(searchText, 15).then(
            (res) => {
                if (res === null) {
                    return;
                }

                const options = res.map(
                    (item) => {
                        return {
                            value: item.primaryAccession,
                            label: <OptionBadge value={item.proteinDescription.recommendedName.fullName.value}
                                                database={"UniProt"} baseUri={"https://www.uniprot.org/uniprotkb/"}/>
                        }
                    }
                );

                setUniprotOptions(options);
                setUnitProtResult(res);
            }
        );
    }

    const onSelect = (uniprotId: string) => {
        const entry = unitProtResult?.find((item) => item.primaryAccession === uniprotId);

        console.log(entry)

        if (entry === undefined) {
            return;
        }

        // Extract the data from the UniProt entry
        if (entry.proteinDescription.recommendedName.ecNumbers !== undefined) {
            form.setFieldsValue({
                ecnumber: entry.proteinDescription.recommendedName.ecNumbers[0].value
            });
        } else {
            form.setFieldsValue({
                ecnumber: null
            });
        }

        form.setFieldsValue({
            name: entry.proteinDescription.recommendedName.fullName.value,
            sequence: entry.sequence.value,
            organism: entry.organism.scientificName,
            organism_tax_id: String(entry.organism.taxonId),
            references: [`https://www.uniprot.org/uniprot/${uniprotId}`],
        });

        handleUpdateObject();

        setUniprotOptions([])
        setUnitProtResult([])
    }

    return (
        <div className="flex flex-col gap-4">
            <div className={"flex flex-row justify-between"}>
                <CardHeader id={data.id} name={data.name} placeholder={"Protein"}/>
                <Button onClick={handleDeleteObject}>Delete</Button>
            </div>
            <Form
                form={form}
                labelCol={{span: 4}}
                wrapperCol={{span: 16}}
                layout="horizontal"
                initialValues={data}
                onValuesChange={handlePreUpdateObject}
            >
                <Form.Item label="Name" name="name" rules={[{required: true}]}>
                    <AutoComplete
                        className={"w-full"}
                        options={uniprotOptions}
                        onSearch={onSearch}
                        onSelect={onSelect}
                        onChange={handlePreUpdateObject}
                    />
                </Form.Item>
                <Form.Item label="Vessel" name="vessel_id">
                    <Select options={vesselOptions}/>
                </Form.Item>
                <Form.Item label="Is constant" name="constant" valuePropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item label="Sequence" name="sequence">
                    <Input.TextArea/>
                </Form.Item>
                <Form.Item label="EC Number" name="ecnumber">
                    <Input/>
                </Form.Item>
                <Form.Item label="Organism" name="organism">
                    <Input/>
                </Form.Item>
                <Form.Item label="Taxonomy ID" name="organism_tax_id">
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
import {AutoComplete, Form, Input, Select, Switch} from "antd";
import {FormViewProps} from "../types.ts";
import {Protein} from "../../../enzymeml-ts/src";
import React, {ChangeEvent, useEffect, useState} from "react";
import {listVessels} from "../commands/vessels.ts";
import {AutoCompleteProps} from "antd/lib";
import {fetchFromUniProt, UniProtEntry} from "./fetchutils.ts";
import {RiExternalLinkLine} from "react-icons/ri";
import SpeciesReference from "../components/SpeciesReference.tsx";
import DBEntryRow from "../components/DBEntryRow.tsx";
import {Option} from "../types/options.ts";
import {extractHref} from "../smallmols/SmallMoleculeForm.tsx";
import useAppStore from "../stores/appstore.ts";
import FormBase from "../components/FormBase.tsx";

function check(value: string | number | undefined | null): string | null {
    if (value === undefined || value === null) {
        return null;
    } else {
        return String(value)
    }
}

export default function ProteinForm(
    {context}: FormViewProps<Protein>
) {
    // States
    const [vesselOptions, setVesselOptions] = useState<Option[]>([])
    const [uniprotOptions, setUniprotOptions] = useState<AutoCompleteProps["options"]>([])
    const [unitProtResult, setUnitProtResult] = useState<UniProtEntry[]>()
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
        if (!databasesToUse.includes("uniprot")) {
            return;
        }

        fetchFromUniProt(searchText, 15).then(
            (res) => {
                if (res === null) {
                    return;
                }

                const options = res.map(
                    (item) => {
                        return {
                            value: item.primaryAccession,
                            label: <DBEntryRow value={item.proteinDescription.recommendedName.fullName.value}
                                               database={"UniProt"} baseUri={"https://www.uniprot.org/uniprotkb/"}
                                               id={item.primaryAccession}
                            />
                        }
                    }
                );

                setUniprotOptions(options);
                setUnitProtResult(res);
            }
        );
    }

    const onEcNumberSearch = (searchText: string) => {
        onSearch(`ec:${searchText} *`)
    }

    const onSelect = (uniprotId: string) => {
        const entry = unitProtResult?.find((item) => item.primaryAccession === uniprotId);

        if (entry === undefined) {
            return;
        } else {
            processEntry(entry);
        }
    }

    const onSetReference = (uniprotURI: string) => {
        let uniprotId;
        if (uniprotURI.startsWith("https://www.uniprot.org")) {
            const url = new URL('https://www.uniprot.org/uniprot/P12345');
            const pathParts = url.pathname.split('/');
            uniprotId = pathParts[2];
        }

        if (uniprotId === undefined) {
            return;
        }

        fetchFromUniProt(uniprotId, 1).then(
            (res) => {
                if (res === null) {
                    return;
                }

                const entry = res[0];
                processEntry(entry);
            }
        );
    }

    const processEntry = (entry: UniProtEntry) => {
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
            sequence: check(entry.sequence.value),
            organism: check(entry.organism.scientificName),
            organism_tax_id: check(entry.organism.taxonId),
            references: [`https://www.uniprot.org/uniprot/${entry.primaryAccession}`],
        });

        handleUpdateObject();

        setUniprotOptions([])
        setUnitProtResult([])
    }

    return (

        <FormBase
            form={form}
            data={data}
            handleUpdate={handlePreUpdateObject}
            locked={locked}
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
            <Form.Item label="EC Number"
                       name="ecnumber"
                       rules={
                           [
                               {
                                   pattern: new RegExp("^\\d+\\.\\d+\\.\\d+\\.\\d+$"),
                                   message: "Please enter a valid EC number"
                               }
                           ]
                       }
            >
                <AutoComplete
                    className={"w-full"}
                    options={uniprotOptions}
                    onSearch={onEcNumberSearch}
                    onSelect={onSelect}
                    onChange={handlePreUpdateObject}
                />
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
                <Input onChange={(e: ChangeEvent<HTMLInputElement>) => onSetReference(e.target.value)}/>
            </Form.Item>
        </FormBase>
    );
}
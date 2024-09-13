import {useEffect, useState} from "react";
import {AutoComplete, Col, Form, Input, Layout, Row, Select, Switch, theme} from "antd";
import {ChildProps} from "../../types.ts";
import {SmallMolecule} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/CardHeading.tsx";
import {listVessels} from "../../commands/vessels.ts";
import {fetchFromPubChem, fetchPubChemDetails} from "../fetchutils.ts";
import {RiExternalLinkLine} from "react-icons/ri";
import {AutoCompleteProps} from "antd/lib";
import {Content} from "antd/lib/layout/layout";
import capitalize from "antd/lib/_util/capitalize";
import DetailButtons from "../../components/DetailButtons.tsx";
import SpeciesReference from "../../components/SpeciesReference.tsx";
import DBEntryRow from "../../components/DBEntryRow.tsx";
import {Option} from "../../types/options.ts";
import useAppStore from "../../stores/stylestore.ts";


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
    if (!href.startsWith("http")) {
        return undefined;
    }

    return href;
}

export default function SmallMoleculeDetail(
    {
        data,
        handleUpdateObject,
        handleDeleteObject,
        form,
    }: ChildProps<SmallMolecule>
) {

    // Hooks
    const {token} = theme.useToken();

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const [vesselOptions, setVesselOptions] = useState<Option[]>([])
    const [pubChemOptions, setPubChemOptions] = useState<AutoCompleteProps["options"]>([])
    const [locked, setLocked] = useState<boolean>(false)

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
        <Layout className={"flex flex-col overflow-auto"}>
            <Content>
                <div className={"shadow-sm mb-2"} style={{
                    padding: 24,
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadiusLG,
                    borderBottom: 1,
                    borderStyle: 'solid',
                    borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                    color: token.colorText,
                }}>
                    <div className="flex flex-col gap-2">
                        <div className={"flex flex-row justify-between"}>
                            <CardHeader id={data.id} name={data.name} placeholder={"Small Molecule"}/>
                            <DetailButtons onLock={() => setLocked(!locked)}
                                           onDelete={handleDeleteObject}
                            />
                        </div>
                        <Form
                            className={"my-6"}
                            form={form}
                            labelCol={{span: 4}}
                            wrapperCol={{span: 18}}
                            layout="horizontal"
                            initialValues={data}
                            onValuesChange={handlePreUpdateObject}
                            disabled={locked}
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
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Vessel" name="vessel_id" labelCol={{span: 8}}
                                               wrapperCol={{span: 16}}>
                                        <Select options={vesselOptions}/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Is constant" name="constant" valuePropName="checked"
                                               labelCol={{span: 8}}
                                               wrapperCol={{span: 8}}>
                                        <Switch/>
                                    </Form.Item>
                                </Col>
                            </Row>
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
                        </Form>
                    </div>
                </div>
            </Content>
        </Layout>
    );
}
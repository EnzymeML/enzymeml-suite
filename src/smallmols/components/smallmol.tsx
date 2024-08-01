import {useEffect, useState} from "react";
import {SmallMolecule} from "../../../../enzymeml-ts/src";
import {deleteSmallMolecule, getSmallMolecule, updateSmallMolecule} from "../../commands/smallmols.ts";
import {Form, Input, Switch} from "antd";

export default function SmallMoleculeEntry(
    {
        id
    }: {
        id: string
    }
) {
    // States
    const [form] = Form.useForm<SmallMolecule>();
    const [smallMolecule, setSmallMolecule] = useState<SmallMolecule | null>(null);

    useEffect(() => {
        // Fetch small molecule
        getSmallMolecule(id).then(
            (data) => {
                if (data) {
                    setSmallMolecule(data);
                }
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Handlers
    const handleUpdateSmallMolecule = () => {
        if (smallMolecule) {
            form.validateFields().then(
                (values) => {
                    // Make sure the ID is set
                    values.id = id;
                    updateSmallMolecule(id, values).then(() => {
                        setSmallMolecule(values);
                    });
                }
            ).catch(
                (error) => {
                    console.error('Error:', error);
                }
            )
        }
    }

    const handleDeleteSmallMolecule = () => {
        if (smallMolecule) {
            deleteSmallMolecule(smallMolecule.id).then(
                () => {
                    console.log('Small molecule deleted');
                }
            )
        }
    }

    if (!smallMolecule) {
        return (
            <div>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div>
            <h2>{smallMolecule.id}</h2>
            <button onClick={handleDeleteSmallMolecule}>Delete</button>
            <Form
                form={form}
                layout="vertical"
                initialValues={smallMolecule}
                onValuesChange={handleUpdateSmallMolecule}
            >
                <Form.Item label="Name" name="name">
                    <Input/>
                </Form.Item>
                <Form.Item label="Constant" name="constant" valuePropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item label="Vessel ID" name="vessel_id">
                    <Input/>
                </Form.Item>
                <Form.Item label="Canonical SMILES" name="canonical_smiles">
                    <Input/>
                </Form.Item>
                <Form.Item label="InChIKey" name="inchikey">
                    <Input/>
                </Form.Item>
                <Form.Item label="References" name="references">
                    <Input/>
                </Form.Item>
            </Form>
        </div>
    );
}
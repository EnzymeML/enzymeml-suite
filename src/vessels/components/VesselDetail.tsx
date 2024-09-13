import {Button, Form, Input, InputNumber, Switch} from "antd";
import {ChildProps} from "../../types.ts";
import {Vessel} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/CardHeading.tsx";

export default function VesselDetail(
    {
        data,
        handleUpdateObject,
        handleDeleteObject,
        form,
    }: ChildProps<Vessel>
) {
    return (
        <div className="flex flex-col gap-4">
            <div className={"flex flex-row justify-between"}>
                <CardHeader id={data.id} name={data.name} placeholder={"Vessel"}/>
                <Button onClick={handleDeleteObject}>Delete</Button>
            </div>
            <Form
                form={form}
                labelCol={{span: 4}}
                wrapperCol={{span: 16}}
                layout="horizontal"
                initialValues={data}
                onValuesChange={handleUpdateObject}
            >
                <Form.Item label="Name" name="name">
                    <Input/>
                </Form.Item>
                <Form.Item label="Volume" name="volume">
                    <InputNumber
                        type={"number"}
                        placeholder="Vessel volume"
                    />
                </Form.Item>
                <Form.Item label="Unit" name="unit">
                    <Input/>
                </Form.Item>
                <Form.Item label="Is constant" name="constant" valuePropName="checked">
                    <Switch/>
                </Form.Item>
            </Form>
        </div>
    );
}
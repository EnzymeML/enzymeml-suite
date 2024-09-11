import {Button, Form, Input, Switch} from "antd";
import {ChildProps} from "../../types.ts";
import {Reaction} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/cardheading.tsx";

export default function ReactionDetail(
    {
        data,
        handleUpdateObject,
        handleDeleteObject,
        form,
    }: ChildProps<Reaction>
) {

    return (
        <div className="flex flex-col gap-4">
            <div className={"flex flex-row justify-between"}>
                <CardHeader id={data.id} name={data.name} placeholder={"Reaction"}/>
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
                <Form.Item label="Is reversible" name="reversible" valuePropName="checked">
                    <Switch/>
                </Form.Item>
            </Form>
        </div>
    );
}
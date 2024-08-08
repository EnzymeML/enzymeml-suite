import {Button, Form, Input} from "antd";
import {ChildProps} from "../../types.ts";
import {Vessel} from "../../../../enzymeml-ts/src";
import CardHeader from "../../components/cardheading.tsx";

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
                layout="vertical"
                initialValues={data}
                onValuesChange={handleUpdateObject}
            >
                <Form.Item label="Name" name="name">
                    <Input/>
                </Form.Item>
            </Form>
        </div>
    );
}
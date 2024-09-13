import "//unpkg.com/mathlive";
import {ChildProps} from "../../types.ts";
import {Parameter} from "../../../../enzymeml-ts/src";
import {Badge, Form, InputNumber} from "antd";

export default function ParameterDetail(
    {
        data,
        handleUpdateObject,
        form,
    }: ChildProps<Parameter>
) {
    return (
        <div className={"flex flex-row w-full gap-2"}>
            <Badge count={data.id} style={{backgroundColor: '#52c41a'}}/>
            <Form
                className={"flex flex-col w-full"}
                layout={"horizontal"}
                initialValues={data}
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}
                onValuesChange={handleUpdateObject}
                form={form}
                component={false}
            >
                <Form.Item name="species_id" hidden={true}/>
                <Form.Item name="value" label="Value">
                    <InputNumber placeholder="Value"/>
                </Form.Item>
            </Form>
        </div>
    );
}

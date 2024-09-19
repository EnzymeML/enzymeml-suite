import {Button, Form, Input, InputNumber, Table} from "antd";
import {FormViewProps} from "../types.ts";
import React from "react";
import FormBase from "../components/FormBase.tsx";
import {Measurement} from "../../../enzymeml-ts/src";
import {PlusOutlined} from "@ant-design/icons";

export default function Component({context}: FormViewProps<Measurement>) {
    // Context
    const {handleUpdateObject, form, data, locked} = React.useContext(context);

    const columns = [
        {
            title: 'Species ID',
            dataIndex: 'species_id',
            key: 'species_id',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, "species_id"]}
                    noStyle
                >
                    <Input
                        placeholder="Species"
                        variant={"borderless"}
                    />
                </Form.Item>
            ),
        },
        {
            title: 'Initial Concentration',
            dataIndex: 'initial',
            key: 'initial',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, "initial"]}
                    noStyle
                >
                    <InputNumber
                        placeholder="Concentration"
                        variant={"borderless"}
                    />
                </Form.Item>
            ),
        },
        {
            title: 'Prepared Concentration',
            dataIndex: 'initial',
            key: 'initial',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, "prepared"]}
                    noStyle
                >
                    <InputNumber
                        placeholder="Prepared Concentration"
                        variant={"borderless"}
                    />
                </Form.Item>
            ),
        },
    ];

    return (
        <FormBase
            form={form}
            data={data}
            handleUpdate={handleUpdateObject}
            locked={locked}
        >
            <Form.Item label="Name" name="name">
                <Input/>
            </Form.Item>
            <Form.Item
                label="pH"
                name="ph"
                rules={[
                    {
                        type: 'number',
                        min: 0,
                        max: 14,
                        message: 'pH must be between 0 and 14',
                    },
                ]}
            >
                <InputNumber
                    className="w-full"
                    type="number"
                    placeholder="pH value"
                />
            </Form.Item>
            <Form.Item label="Temperature" name="temperature">
                <InputNumber
                    className="w-full"
                    type="number"
                    placeholder="temperature value"
                />
            </Form.Item>
            <div className={"flex flex-row justify-center"}>
                <Form.List name="species_data">
                    {(fields, {add, remove}) => (
                        <Table
                            className={"m-5"}
                            dataSource={fields}
                            size={"small"}
                            columns={columns}
                            pagination={false}
                            rowKey={record => record.key}
                            footer={() => (
                                <Button size={"small"} onClick={() => add()}>
                                    <PlusOutlined/>
                                </Button>
                            )}
                        />
                    )}
                </Form.List>
            </div>
        </FormBase>
    );
}
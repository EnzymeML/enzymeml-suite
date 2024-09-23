import {Form, FormInstance} from "antd";
import React from "react";
import {Identifiable} from "../types.ts";

interface FormBaseProps<T extends Identifiable> {
    form: FormInstance<T>;
    data: T;
    locked: boolean;
    handleUpdate: () => void;
    children: React.ReactNode;
    size?: "small" | "middle" | "large";
    className?: string;
}

export default function FormBase<T extends Identifiable>(
    {
        form,
        data,
        locked,
        handleUpdate,
        children,
        className = "my-6",
        size = "middle",
    }: FormBaseProps<T>
) {
    return (
        <Form
            className={className}
            form={form}
            labelCol={{span: 5}}
            wrapperCol={{span: 17}}
            size={size}
            layout="horizontal"
            initialValues={data}
            onValuesChange={handleUpdate}
            disabled={locked}
        >
            {children}
        </Form>
    )
}
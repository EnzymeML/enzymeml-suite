import {PlusOutlined} from "@ant-design/icons";
import {FloatButton} from "antd";

interface FloatingCreateProps {
    handleCreate: () => void;
    type: string;
}

export default function FloatingCreate(
    {
        handleCreate,
        type,
    }: FloatingCreateProps
) {
    return (
        <FloatButton
            shape="square"
            type="primary"
            icon={<PlusOutlined/>}
            tooltip={<div>Add {type}</div>}
            onClick={handleCreate}
        />
    )
}
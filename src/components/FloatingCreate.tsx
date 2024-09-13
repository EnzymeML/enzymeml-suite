import {PlusOutlined} from "@ant-design/icons";
import {FloatButton} from "antd";

export default function FloatingCreate(
    {
        handleCreate,
        type,
    }: {
        handleCreate: () => void,
        type: string,
    }
) {
    return (
        <FloatButton
            shape="square"
            type="primary"
            icon={<PlusOutlined/>}
            tooltip={<div>{type}</div>}
            onClick={handleCreate}
        />
    )
}
import { PlusOutlined } from "@ant-design/icons";
import { FloatButton } from "antd";
import { BsStars } from "react-icons/bs";

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
        <FloatButton.Group
            trigger="hover"
            type="primary"
            style={{ insetInlineEnd: 94 }}
            icon={<PlusOutlined />}
        >
            <FloatButton
                shape="square"
                type="default"
                icon={<BsStars size={20} />}
                tooltip={<div>From text</div>}
            />
            <FloatButton
                shape="square"
                type="default"
                icon={<PlusOutlined />}
                tooltip={<div>Add {type}</div>}
                onClick={handleCreate}
            />
        </FloatButton.Group >
    )
}
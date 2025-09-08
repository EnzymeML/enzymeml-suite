import { useState } from 'react';
import { Button, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, LockOutlined, SaveOutlined, UnlockOutlined } from '@ant-design/icons';

interface DetailButtonsProps {
    onLock: () => void,
    onDelete?: () => void,
    saveObject: () => void,
}

export default function DetailButtons(
    {
        onLock,
        onDelete,
        saveObject,
    }: DetailButtonsProps
) {

    // States
    const [isLocked, setIsLocked] = useState(false);

    // Handlers
    const confirm = () => {
        onDelete ? onDelete() : null;
    };

    const toggleLock = () => {
        setIsLocked(!isLocked);
    };

    return (
        <Button.Group>
            <Tooltip placement="left"
                title={"Lock Form"}
            >
                <Button
                    icon={isLocked ? <LockOutlined style={{ color: "orangered" }} /> : <UnlockOutlined />}
                    onClick={() => {
                        onLock();
                        toggleLock();
                    }}
                />
            </Tooltip>

            <Tooltip placement="bottom"
                title={"Save to Database"}
            >
                <Button
                    icon={<SaveOutlined />}
                    onClick={() => {
                        if (saveObject) {
                            saveObject();
                        }
                    }}
                />
            </Tooltip>

            <Popconfirm
                placement={"bottomLeft"}
                title="Delete Item"
                description="Are you sure to delete this item?"
                onConfirm={confirm}
                okText="Yes"
                cancelText="No"
            >
                <Tooltip placement="bottom"
                    title={"Delete Item"}
                >
                    <Button
                        icon={<DeleteOutlined />}
                        onClick={() => {
                        }}
                    />
                </Tooltip>
            </Popconfirm>
        </Button.Group>
    );
}
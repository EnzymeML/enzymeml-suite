import {useState} from 'react';
import {Button, Popconfirm, Tooltip} from 'antd';
import {DeleteOutlined, LockOutlined, UnlockOutlined} from '@ant-design/icons';

export default function DetailButtons(
    {
        onLock,
        onDelete,
    }: {
        onLock: () => void,
        onDelete?: () => void,
    }
) {

    // States
    const [isLocked, setIsLocked] = useState(false);

    // Handlers
    const confirm = () => {
        onDelete ? onDelete() : null;
    };

    const cancel = () => {
        console.log("Delete action cancelled");
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
                    icon={isLocked ? <LockOutlined style={{color: "orangered"}}/> : <UnlockOutlined/>}
                    onClick={() => {
                        onLock();
                        toggleLock();
                    }}
                />
            </Tooltip>

            <Popconfirm
                placement={"bottomLeft"}
                title="Delete Item"
                description="Are you sure to delete this item?"
                onConfirm={confirm}
                onCancel={cancel}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    icon={<DeleteOutlined/>}
                    onClick={() => {
                    }}
                />
            </Popconfirm>
        </Button.Group>
    );
}
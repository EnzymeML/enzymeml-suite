import {useState} from 'react';
import {Button} from 'antd';
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
    const [isLocked, setIsLocked] = useState(false);

    const toggleLock = () => {
        setIsLocked(!isLocked);
    };

    return (
        <Button.Group>
            <Button
                icon={isLocked ? <LockOutlined style={{color: "orangered"}}/> : <UnlockOutlined/>}
                onClick={() => {
                    onLock();
                    toggleLock();
                }}
            />
            <Button
                icon={<DeleteOutlined/>}
                onClick={() => {
                    onDelete ? onDelete() : null;
                }}
            />
        </Button.Group>
    );
}
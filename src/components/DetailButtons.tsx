import { useEffect, useState } from 'react';
import { Button, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import ValidationIndicator from '@suite/validation/components/ValidationIndicator';
import { ValidationResult } from '@suite/commands/validation';
import { useRouterTauriListener } from '@suite/hooks/useTauriListener';
import { getValidationReportById } from '@suite/validation/utils';
import ValidationModal from '@suite/validation/ValidationModal';

interface DetailButtonsProps {
    id: string,
    onLock: () => void,
    onDelete?: () => void,
    saveObject: () => void,
}

export default function DetailButtons(
    {
        id,
        onDelete,
        saveObject,
    }: DetailButtonsProps
) {
    // States
    const [, setErrors] = useState<ValidationResult[]>([]);
    const [open, setOpen] = useState(false);

    // Effects
    useEffect(() => {
        getValidationReportById(id).then((report: ValidationResult[]) => {
            setErrors(report);
        });
    }, []);

    // Hooks
    useRouterTauriListener("update_report", () => {
        getValidationReportById(id).then((report: ValidationResult[]) => {
            setErrors(report);
        });
    }, [id]);

    // Handlers
    const confirm = () => {
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <Button.Group>
            <Tooltip placement="left"
                title={"Validation Report"}
            >
                <Button
                    className='flex gap-1 justify-center items-center'
                    style={{ minWidth: '25px' }}
                    icon={<ValidationIndicator verbose={false} tooltip={false} id={id} />}
                    onClick={() => {
                        setOpen(true);
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
            <ValidationModal
                open={open}
                onClose={() => setOpen(false)}
                id={id}
            />
        </Button.Group>
    );
}

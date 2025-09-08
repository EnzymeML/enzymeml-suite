import { useState } from 'react';
import { Button, Card, theme, Form } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import LatexRenderer from '../components/LatexRenderer';
import KineticLawBuilder from './KineticLawBuilder';

interface KineticLawDisplayProps {
    reactionId: string;
    kineticLaw?: {
        species_id: string;
        equation_type: string;
        equation: string;
    } | null;
    onUpdate: () => void;
    disabled?: boolean;
}

export default function KineticLawDisplay({
    reactionId,
    kineticLaw,
    onUpdate,
    disabled = false
}: KineticLawDisplayProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const { token } = theme.useToken();
    const form = Form.useFormInstance();

    const handleKineticLawApply = (equation: string, equationType: string) => {
        // Update the form with the new kinetic law
        form.setFieldsValue({
            kinetic_law: {
                equation: equation,
                equation_type: equationType,
                species_id: reactionId
            }
        });

        setModalOpen(false);
        onUpdate();
    };

    const handleModalClose = () => {
        setModalOpen(false);
    };

    return (
        <>
            <Card
                size="small"
                style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorder,
                    boxShadow: `0 1px 2px 0 ${token.colorFill}`,
                    width: 'fit-content',
                    maxWidth: '400px',
                }}
                bodyStyle={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '40px',
                }}
            >
                {kineticLaw && kineticLaw.equation ? (
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-4 items-center">
                            <LatexRenderer equation={kineticLaw.equation || ''} />
                        </div>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => setModalOpen(true)}
                            title="Edit kinetic law"
                            disabled={disabled}
                            style={{
                                color: token.colorText,
                                borderColor: 'transparent',
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex justify-center items-center">
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setModalOpen(true)}
                            disabled={disabled}
                            style={{
                                borderColor: token.colorPrimary,
                                color: token.colorPrimary,
                            }}
                        >
                            Add Kinetic Law
                        </Button>
                    </div>
                )}
            </Card>

            <KineticLawBuilder
                reactionId={reactionId}
                kineticLaw={kineticLaw}
                open={modalOpen}
                onCancel={handleModalClose}
                onOk={handleKineticLawApply}
            />
        </>
    );
} 
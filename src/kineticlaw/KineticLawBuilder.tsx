import { useState, useEffect } from 'react';
import { Modal, Form, Typography, Space, Button, theme } from 'antd';

import { KineticLawDefinition, SpeciesInfo } from '@reactions/types';
import { listProteins } from '@commands/proteins';
import { listSmallMolecules } from '@commands/smallmols';
import useAppStore from '@stores/appstore';

import { KINETIC_LAWS } from '@kineticlaw/kineticLaws';
import { Selector, SpeciesMapping } from '@kineticlaw/components';

const { Text } = Typography;

interface KineticLawBuilderProps {
    reactionId: string;
    kineticLaw?: {
        species_id: string;
        equation_type: string;
        equation: string;
    } | null;
    open: boolean;
    onCancel: () => void;
    onOk: (equation: string, equationType: string) => void;
}

export default function KineticLawBuilder({
    kineticLaw,
    open,
    onCancel,
    onOk
}: KineticLawBuilderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedLaw, setSelectedLaw] = useState<KineticLawDefinition | null>(null);
    const [equation, setEquation] = useState<string>('');
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [availableSpecies, setAvailableSpecies] = useState<SpeciesInfo[]>([]);
    const [form] = Form.useForm();

    // Styling
    const { token } = theme.useToken();
    const darkMode = useAppStore((state) => state.darkMode);

    // Helper function to apply assignments to equation for preview
    const applyAssignmentsToEquation = (baseEquation: string, assignmentsToApply: Record<string, string>): string => {
        if (!selectedLaw) return baseEquation;

        let updatedEquation = baseEquation;

        selectedLaw.species.forEach(placeholder => {
            const assignedId = assignmentsToApply[placeholder.id];
            if (assignedId) {
                // Replace placeholder with assigned species ID
                const placeholderPattern = new RegExp(`\\b${placeholder.id}\\b`, 'g');
                updatedEquation = updatedEquation.replace(placeholderPattern, assignedId);
            }
        });

        return updatedEquation;
    };

    useEffect(() => {
        if (open) {
            fetchAvailableSpecies();
            if (!kineticLaw?.equation) {
                setCurrentStep(0);
                setAssignments({});

                // Initially select SBO:0000047 by default
                const defaultLaw = KINETIC_LAWS.find(law => law.id === 'SBO:0000047');
                if (defaultLaw) {
                    setSelectedLaw(defaultLaw);
                    setEquation(defaultLaw.equation);
                    form.setFieldsValue({ lawId: defaultLaw.id });
                } else {
                    setSelectedLaw(null);
                    setEquation('');
                    form.resetFields();
                }
            }
        }
    }, [open, form, kineticLaw]);

    useEffect(() => {
        if (kineticLaw?.equation && open) {
            const matchingLaw = KINETIC_LAWS.find(law => law.equation === kineticLaw.equation);
            if (matchingLaw) {
                setSelectedLaw(matchingLaw);
                setEquation(kineticLaw.equation);
                setCurrentStep(1);
                form.setFieldsValue({ lawId: matchingLaw.id });
            }
        }
    }, [kineticLaw, open, form]);

    const fetchAvailableSpecies = async () => {
        try {
            const [proteinData, smallMolData] = await Promise.all([
                listProteins(),
                listSmallMolecules()
            ]);

            const proteins = proteinData.map(([id, name]) => ({ id, name, type: 'protein' as const }));
            const smallMols = smallMolData.map(([id, name]) => ({ id, name, type: 'small_molecule' as const }));

            setAvailableSpecies([...proteins, ...smallMols]);
        } catch (error) {
            console.error('Error fetching species:', error);
        }
    };

    const handleLawSelect = (lawId: string) => {
        const law = KINETIC_LAWS.find(l => l.id === lawId);
        setSelectedLaw(law || null);
        setEquation(law?.equation || '');
        setAssignments({}); // Reset assignments when selecting a new law

        if (law) {
            const resetValues: Record<string, undefined> = {};
            law.species.forEach(species => {
                resetValues[`species_${species.id}`] = undefined;
            });
            form.setFieldsValue({ lawId, ...resetValues });
        }
    };

    const handleDeselect = () => {
        setSelectedLaw(null);
        setEquation('');
        setAssignments({});
        form.resetFields();
    };

    const handleSpeciesAssignment = (placeholderId: string, speciesId: string) => {
        if (!selectedLaw) return;

        // Update form value
        form.setFieldsValue({ [`species_${placeholderId}`]: speciesId });

        // Update assignments record
        setAssignments(prev => ({
            ...prev,
            [placeholderId]: speciesId
        }));
    };

    const handleNext = () => {
        setCurrentStep(1);
    };

    const handlePrevious = () => {
        setCurrentStep(0);
    };

    const canProceedToStep2 = (): boolean => {
        return !!selectedLaw;
    };

    const canApply = (): boolean => {
        if (!selectedLaw || !equation || currentStep !== 1) return false;

        const requiredSpecies = selectedLaw.species.filter(s => s.required);
        const formValues = form.getFieldsValue();

        return requiredSpecies.every(species => formValues[`species_${species.id}`]);
    };

    const handleApply = () => {
        if (!selectedLaw) return;

        // Generate final equation with all assignments applied
        const finalEquation = applyAssignmentsToEquation(selectedLaw.equation, assignments);
        onOk(finalEquation, 'rateLaw');
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            width="100%"
            height="80%"
            centered
            maskClosable={false}
            footer={null}
            styles={{
                header: {
                    backgroundColor: token.colorBgLayout,
                    borderRadius: token.borderRadiusLG,
                    overflow: 'hidden'
                },
                content: {
                    backgroundColor: token.colorBgLayout,
                    borderRadius: token.borderRadiusLG,
                    overflow: 'hidden',
                    boxShadow: token.boxShadow,
                    border: darkMode ? `1px solid ${token.colorBorderBg}` : "none"
                },
                body: {
                    padding: 0,
                    backgroundColor: token.colorBgLayout,
                    height: 'calc(90vh - 100px)',
                    borderRadius: token.borderRadius
                },
                mask: {
                    borderRadius: token.borderRadiusLG
                }
            }}
        >
            <div className="flex flex-col h-full">
                {/* Content Area */}
                <div
                    className="overflow-hidden flex-1 p-4 pb-0"
                    style={{
                        height: 'calc(100% - 128px)' // Account for header (64px) + footer (64px)
                    }}
                >
                    <Form form={form} layout="vertical" className="h-full">
                        <div className="h-full">
                            {currentStep === 0 && (
                                <Selector
                                    selectedLaw={selectedLaw}
                                    onLawSelect={handleLawSelect}
                                    onDeselect={handleDeselect}
                                />
                            )}
                            {currentStep === 1 && (
                                <SpeciesMapping
                                    selectedLaw={selectedLaw}
                                    equation={equation}
                                    availableSpecies={availableSpecies}
                                    onSpeciesAssignment={handleSpeciesAssignment}
                                    form={form}
                                />
                            )}
                        </div>
                    </Form>
                </div>

                {/* Footer Actions */}
                <div
                    className="flex justify-between items-center px-4 py-4 mx-4 rounded-b-lg border-t"
                    style={{
                        borderColor: token.colorBorder,
                        backgroundColor: token.colorBgElevated
                    }}
                >
                    <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                            <div
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${currentStep === 0 ? 'opacity-100' : 'opacity-30'}`}
                                style={{ backgroundColor: token.colorPrimary }}
                            />
                            <div
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${currentStep === 1 ? 'opacity-100' : 'opacity-30'}`}
                                style={{ backgroundColor: token.colorPrimary }}
                            />
                        </div>
                        <Text className="ml-2 text-xs" style={{ color: token.colorTextSecondary }}>
                            Step {currentStep + 1} of 2
                        </Text>
                    </div>

                    <Space>
                        {currentStep === 1 && (
                            <Button
                                onClick={handlePrevious}
                                size="small"
                                style={{
                                    borderRadius: token.borderRadiusSM,
                                    height: '36px'
                                }}
                            >
                                Previous
                            </Button>
                        )}
                        {currentStep === 0 && (
                            <Button
                                type="primary"
                                onClick={handleNext}
                                size='middle'
                                disabled={!canProceedToStep2()}
                            >
                                Next: Assign Species
                            </Button>
                        )}
                        {currentStep === 1 && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleApply}
                                disabled={!canApply()}
                                style={{
                                    borderRadius: token.borderRadiusSM,
                                    height: '36px',
                                    fontWeight: 500
                                }}
                            >
                                Apply Kinetic Law
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </Modal>
    );
}
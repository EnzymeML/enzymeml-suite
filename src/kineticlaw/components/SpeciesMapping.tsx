import React from 'react';
import { Typography, Space, Card, theme, FormInstance } from 'antd';

import { KineticLawDefinition, SpeciesInfo } from '@reactions/types';
import LatexRenderer from '@components/LatexRenderer';

import SpeciesAssignmentCard from '@kineticlaw/components/SpeciesAssignmentCard';
import { createColoredSymbolsMap, getEquationSize } from '@kineticlaw/utils';

const { Text } = Typography;

interface SpeciesMappingProps {
    selectedLaw: KineticLawDefinition | null;
    equation: string;
    availableSpecies: SpeciesInfo[];
    onSpeciesAssignment: (placeholderId: string, speciesId: string) => void;
    form: FormInstance;
}

const SpeciesMapping: React.FC<SpeciesMappingProps> = ({
    selectedLaw,
    equation,
    availableSpecies,
    onSpeciesAssignment,
    // form
}) => {
    const { token } = theme.useToken();
    // const formValues = form.getFieldsValue();
    const coloredSymbolsMap = createColoredSymbolsMap(selectedLaw);
    const size = getEquationSize(selectedLaw?.equation || '');

    return (
        <div className="overflow-y-auto pr-2 h-full">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Equation Display */}
                <Card
                    title={
                        <Text strong style={{ fontSize: '13px', color: token.colorText }}>
                            Selected Kinetic Law
                        </Text>
                    }
                    size="small"
                    styles={{
                        header: {
                            backgroundColor: token.colorBgElevated,
                            borderBottom: `1px solid ${token.colorBorder}`,
                            minHeight: '40px'
                        },
                        body: { padding: '16px' }
                    }}
                    style={{
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: token.borderRadius,
                        boxShadow: token.boxShadowTertiary,
                        backgroundColor: token.colorBgContainer
                    }}

                >
                    <div
                        style={{
                            padding: '24px',
                            backgroundColor: token.colorFillQuaternary,
                            borderRadius: token.borderRadius,
                            border: `1px solid ${token.colorBorder}`,
                            textAlign: 'center',
                            minHeight: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'auto',
                            width: '100%'
                        }}
                    >
                        <div style={{ minWidth: 'max-content' }}>
                            <LatexRenderer
                                equation={equation}
                                size={size}
                                coloredSymbolsMap={coloredSymbolsMap}
                            />
                        </div>
                    </div>
                </Card>

                {/* Species Assignment */}
                <SpeciesAssignmentCard
                    selectedLaw={selectedLaw}
                    availableSpecies={availableSpecies}
                    onSpeciesAssignment={onSpeciesAssignment}
                />
            </Space>
        </div>
    );
};

export default SpeciesMapping; 
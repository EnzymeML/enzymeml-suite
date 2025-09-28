import React from 'react';
import { Typography, Space, Card, theme, FormInstance } from 'antd';

import { KineticLawDefinition, SpeciesInfo } from '@reactions/types';
import LatexRenderer from '@components/LatexRenderer';

import SpeciesAssignmentCard from '@kineticlaw/components/SpeciesAssignmentCard';
import { SPECIES_ROLE_COLORS, createColoredSymbolsMap, getEquationSize } from '@kineticlaw/utils';

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

                {/* Color Legend */}
                {selectedLaw && selectedLaw.species.length > 0 && (
                    <Card
                        title={
                            <Text strong style={{ fontSize: '13px', color: token.colorText }}>
                                Species Role Legend
                            </Text>
                        }
                        size="small"
                        styles={{
                            header: {
                                backgroundColor: token.colorBgElevated,
                                borderBottom: `1px solid ${token.colorBorder}`,
                                minHeight: '40px'
                            },
                            body: { padding: '12px' }
                        }}
                        style={{
                            border: `1px solid ${token.colorBorder}`,
                            borderRadius: token.borderRadius,
                            boxShadow: token.boxShadowTertiary,
                            backgroundColor: token.colorBgContainer
                        }}

                    >
                        <Space wrap size="middle">
                            {Object.entries(SPECIES_ROLE_COLORS).map(([role, color]) => {
                                // Only show roles that exist in the current law
                                const hasRole = selectedLaw.species.some(s => s.role === role);
                                if (!hasRole) return null;

                                return (
                                    <Space key={role} size="small" align="center">
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: color,
                                                borderRadius: '2px',
                                                border: `1px solid ${token.colorBorder}`
                                            }}
                                        />
                                        <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </Space>
                                );
                            })}
                        </Space>
                    </Card>
                )}

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
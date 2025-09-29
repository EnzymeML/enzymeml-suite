import React from 'react';
import { Typography, Space, Card, Row, Col } from 'antd';

import { KineticLawDefinition, SpeciesInfo } from '@reactions/types';
import SpeciesSelector from '@suite/kineticlaw/components/SpeciesSelector';

const { Text } = Typography;

interface SpeciesAssignmentCardProps {
    selectedLaw: KineticLawDefinition | null;
    availableSpecies: SpeciesInfo[];
    onSpeciesAssignment: (placeholderId: string, speciesId: string) => void;
}

const SpeciesAssignmentCard: React.FC<SpeciesAssignmentCardProps> = ({
    selectedLaw,
    availableSpecies,
    onSpeciesAssignment
}) => {
    if (!selectedLaw) {
        return (
            <Card
                title="Species Assignment"
                size="small"
                style={{ textAlign: 'center', marginBottom: 12 }}
                styles={{ body: { padding: '24px 16px' } }}
            >
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Select a kinetic law to assign species
                </Text>
            </Card>
        );
    }

    // Split species into two columns for better layout
    const midPoint = Math.ceil(selectedLaw.species.length / 2);
    const leftColumnSpecies = selectedLaw.species.slice(0, midPoint);
    const rightColumnSpecies = selectedLaw.species.slice(midPoint);

    return (
        <Card
            title="Species Assignment"
            size="small"
            extra={
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {selectedLaw.species.filter(s => s.required).length} required
                </Text>
            }
            styles={{ body: { padding: '12px' } }}
            style={{ marginBottom: 12 }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {leftColumnSpecies.map(placeholder => (
                            <SpeciesSelector
                                key={placeholder.id}
                                placeholder={placeholder}
                                availableSpecies={availableSpecies}
                                onSpeciesAssignment={onSpeciesAssignment}
                            />
                        ))}
                    </Space>
                </Col>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {rightColumnSpecies.map(placeholder => (
                            <SpeciesSelector
                                key={placeholder.id}
                                placeholder={placeholder}
                                availableSpecies={availableSpecies}
                                onSpeciesAssignment={onSpeciesAssignment}
                            />
                        ))}
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default SpeciesAssignmentCard; 
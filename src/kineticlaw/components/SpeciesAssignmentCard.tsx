import React from 'react';
import { Form, Select, Typography, Space, Tag, Card, Row, Col } from 'antd';

import { KineticLawDefinition, SpeciesInfo } from '@reactions/types';

const { Text } = Typography;
const { Option } = Select;

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
    const getRoleColor = (role: string) => {
        const colors = {
            substrate: 'blue',
            product: 'green',
            inhibitor: 'red',
            activator: 'purple',
            enzyme: 'orange',
            modifier: 'gray'
        };
        return colors[role as keyof typeof colors] || 'default';
    };

    if (!selectedLaw) {
        return (
            <Card
                title="Species Assignment"
                size="small"
                style={{ textAlign: 'center', marginBottom: 12 }}
                bodyStyle={{ padding: '24px 16px' }}
            >
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Select a kinetic law to assign species
                </Text>
            </Card>
        );
    }

    return (
        <Card
            title="Species Assignment"
            size="small"
            extra={
                <Text type="secondary" style={{ fontSize: '11px' }}>
                    {selectedLaw.species.filter(s => s.required).length} required
                </Text>
            }
            bodyStyle={{ padding: '12px' }}
            style={{ marginBottom: 12 }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {selectedLaw.species
                            .filter((_, index) => index % 2 === 0)
                            .map(placeholder => (
                                <div key={placeholder.id}>
                                    <Form.Item
                                        label={
                                            <Space size="small">
                                                <Tag color={getRoleColor(placeholder.role)} style={{ fontSize: '11px', padding: '1px 4px' }}>
                                                    [{placeholder.id}]
                                                </Tag>
                                                <Text strong style={{ fontSize: '12px' }}>{placeholder.name}</Text>
                                                {placeholder.required && (
                                                    <Tag color="red" style={{ fontSize: '10px', padding: '0px 3px' }}>
                                                        Required
                                                    </Tag>
                                                )}
                                            </Space>
                                        }
                                        name={`species_${placeholder.id}`}
                                        style={{ marginBottom: 4 }}
                                    >
                                        <Select
                                            placeholder={`Select ${placeholder.role}`}
                                            onChange={(value) => onSpeciesAssignment(placeholder.id, value)}
                                            allowClear
                                            showSearch
                                            size="small"
                                            filterOption={(input, option) => {
                                                const species = availableSpecies.find(s => s.id === option?.value);
                                                return (
                                                    species?.id.toLowerCase().includes(input.toLowerCase()) ||
                                                    species?.name.toLowerCase().includes(input.toLowerCase())
                                                ) || false;
                                            }}
                                        >
                                            {availableSpecies.map(species => (
                                                <Option key={species.id} value={species.id}>
                                                    <Space size="small">
                                                        <Tag color={species.type === 'protein' ? 'blue' : 'green'} style={{ fontSize: '10px', padding: '0px 3px' }}>
                                                            {species.type === 'protein' ? 'P' : 'SM'}
                                                        </Tag>
                                                        <Text style={{ fontSize: '12px' }}>{species.id}</Text>
                                                        <Text type="secondary" style={{ fontSize: '11px' }}>- {species.name}</Text>
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '11px',
                                            display: 'block',
                                            marginTop: '-4px',
                                            marginBottom: '8px',
                                            marginLeft: '2px'
                                        }}
                                    >
                                        {placeholder.description}
                                    </Text>
                                </div>
                            ))}
                    </Space>
                </Col>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {selectedLaw.species
                            .filter((_, index) => index % 2 === 1)
                            .map(placeholder => (
                                <div key={placeholder.id}>
                                    <Form.Item
                                        label={
                                            <Space size="small">
                                                <Tag color={getRoleColor(placeholder.role)} style={{ fontSize: '11px', padding: '1px 4px' }}>
                                                    [{placeholder.id}]
                                                </Tag>
                                                <Text strong style={{ fontSize: '12px' }}>{placeholder.name}</Text>
                                                {placeholder.required && (
                                                    <Tag color="red" style={{ fontSize: '10px', padding: '0px 3px' }}>
                                                        Required
                                                    </Tag>
                                                )}
                                            </Space>
                                        }
                                        name={`species_${placeholder.id}`}
                                        style={{ marginBottom: 4 }}
                                    >
                                        <Select
                                            placeholder={`Select ${placeholder.role}`}
                                            onChange={(value) => onSpeciesAssignment(placeholder.id, value)}
                                            allowClear
                                            showSearch
                                            size="small"
                                            filterOption={(input, option) => {
                                                const species = availableSpecies.find(s => s.id === option?.value);
                                                return (
                                                    species?.id.toLowerCase().includes(input.toLowerCase()) ||
                                                    species?.name.toLowerCase().includes(input.toLowerCase())
                                                ) || false;
                                            }}
                                        >
                                            {availableSpecies.map(species => (
                                                <Option key={species.id} value={species.id}>
                                                    <Space size="small">
                                                        <Tag color={species.type === 'protein' ? 'blue' : 'green'} style={{ fontSize: '10px', padding: '0px 3px' }}>
                                                            {species.type === 'protein' ? 'P' : 'SM'}
                                                        </Tag>
                                                        <Text style={{ fontSize: '12px' }}>{species.id}</Text>
                                                        <Text type="secondary" style={{ fontSize: '11px' }}>- {species.name}</Text>
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '11px',
                                            display: 'block',
                                            marginTop: '-4px',
                                            marginBottom: '8px',
                                            marginLeft: '2px'
                                        }}
                                    >
                                        {placeholder.description}
                                    </Text>
                                </div>
                            ))}
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default SpeciesAssignmentCard; 
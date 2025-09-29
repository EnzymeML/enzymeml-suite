import React from 'react';
import { Form, Select, Typography, Space, Tag } from 'antd';

import { SpeciesInfo, SpeciesPlaceholder } from '@reactions/types';
import LatexRenderer from '@suite/components/LatexRenderer';
import { SPECIES_ROLE_COLORS } from '@kineticlaw/utils';

const { Text } = Typography;
const { Option } = Select;

interface SpeciesSelectorProps {
    placeholder: SpeciesPlaceholder;
    availableSpecies: SpeciesInfo[];
    onSpeciesAssignment: (placeholderId: string, speciesId: string) => void;
}

const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
    placeholder,
    availableSpecies,
    onSpeciesAssignment
}) => {
    const getRoleColor = (role: string) => {
        return SPECIES_ROLE_COLORS[role as keyof typeof SPECIES_ROLE_COLORS] || '#8c8c8c';
    };

    return (
        <Form.Item
            name={`species_${placeholder.id}`}
            label={
                <Space className='flex justify-center' size="middle">
                    <LatexRenderer
                        inline
                        className="ml-2"
                        equation={placeholder.id}
                        size="large"
                        coloredSymbolsMap={[{ symbols: [placeholder.id], color: getRoleColor(placeholder.role) }]}
                    />
                    <Text strong style={{ fontSize: '14px' }}>{placeholder.name}</Text>
                </Space>
            }
        >
            <Select
                placeholder={`Select ${placeholder.role}`}
                onChange={(value) => onSpeciesAssignment(placeholder.id, value)}
                allowClear
                showSearch
                size="middle"
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
                            <Text>{species.name}</Text>
                        </Space>
                    </Option>
                ))}
            </Select>
        </Form.Item>
    );
};

export default SpeciesSelector;

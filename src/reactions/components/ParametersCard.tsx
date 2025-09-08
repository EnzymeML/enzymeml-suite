import React from 'react';
import { Card, Descriptions, Typography, Space } from 'antd';
import { KineticLawDefinition } from '../types';
import LatexRenderer from '../../components/LatexRenderer';

const { Text } = Typography;

interface ParametersCardProps {
    selectedLaw: KineticLawDefinition;
}

const ParametersCard: React.FC<ParametersCardProps> = ({ selectedLaw }) => {
    if (!selectedLaw.parameters.length) {
        return null;
    }

    return (
        <Card
            title="Parameters"
            size="small"
            bodyStyle={{ padding: '8px 12px' }}
        >
            <Descriptions
                column={1}
                size="small"
                bordered
                style={{ marginBottom: 0 }}
                labelStyle={{ padding: '4px 8px', fontSize: '12px', width: '35%' }}
                contentStyle={{ padding: '4px 8px', fontSize: '12px' }}
            >
                {selectedLaw.parameters.map(param => (
                    <Descriptions.Item
                        key={param.id}
                        label={
                            <div style={{ textAlign: 'center' }}>
                                <Space size="small">
                                    <LatexRenderer equation={param.symbol} inline size="small" />
                                </Space>
                            </div>
                        }
                    >
                        <Text type="secondary" style={{ fontSize: '12px' }}>{param.description}</Text>
                    </Descriptions.Item>
                ))}
            </Descriptions>
        </Card>
    );
};

export default ParametersCard; 
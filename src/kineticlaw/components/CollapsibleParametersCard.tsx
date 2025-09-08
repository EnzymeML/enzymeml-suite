import React, { useState } from 'react';
import { Typography, Collapse, Descriptions, Pagination, theme } from 'antd';
import { KineticLawDefinition } from '../../reactions/types';
import LatexRenderer from '../../components/LatexRenderer';

const { Text } = Typography;

interface CollapsibleParametersCardProps {
    selectedLaw: KineticLawDefinition;
}

const CollapsibleParametersCard: React.FC<CollapsibleParametersCardProps> = ({ selectedLaw }) => {
    const { token } = theme.useToken();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    if (!selectedLaw.parameters.length) {
        return null;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentParameters = selectedLaw.parameters.slice(startIndex, endIndex);

    const items = [
        {
            key: '1',
            label: (
                <Text strong style={{ fontSize: '13px', color: token.colorText }}>
                    Parameters ({selectedLaw.parameters.length})
                </Text>
            ),
            children: (
                <div>
                    <Descriptions
                        column={1}
                        size="small"
                        bordered
                        style={{
                            marginBottom: selectedLaw.parameters.length > pageSize ? '12px' : 0,
                            backgroundColor: token.colorBgContainer,
                            borderRadius: token.borderRadius
                        }}
                        labelStyle={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            width: '30%',
                            backgroundColor: token.colorBgLayout,
                            fontWeight: 500,
                            color: token.colorText
                        }}
                        contentStyle={{
                            backgroundColor: token.colorBgContainer,
                            color: token.colorText
                        }}
                    >
                        {currentParameters.map(param => (
                            <Descriptions.Item
                                key={param.id}
                                label={
                                    <div style={{ textAlign: 'center' }}>
                                        <LatexRenderer equation={param.symbol} inline size="small" />
                                    </div>
                                }
                            >
                                <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                                    {param.description}
                                </Text>
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                    {selectedLaw.parameters.length > pageSize && (
                        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                            <Pagination
                                current={currentPage}
                                total={selectedLaw.parameters.length}
                                pageSize={pageSize}
                                size="small"
                                onChange={setCurrentPage}
                                showSizeChanger={false}
                                showQuickJumper={false}
                                showTotal={(total, range) =>
                                    <Text style={{ fontSize: '11px', color: token.colorTextTertiary }}>
                                        {range[0]}-{range[1]} of {total} parameters
                                    </Text>
                                }
                            />
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <Collapse
            items={items}
            size="middle"
            defaultActiveKey={[]}
            style={{
                backgroundColor: token.colorBgContainer,
                border: 'none',
                boxShadow: token.boxShadowTertiary,
            }}
            onChange={() => setCurrentPage(1)}
        />
    );
};

export default CollapsibleParametersCard; 
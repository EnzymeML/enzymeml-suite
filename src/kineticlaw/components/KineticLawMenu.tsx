import React, { useState } from 'react';
import { Typography, Space, Badge, Menu, Input, theme } from 'antd';

import { KINETIC_LAWS, KINETIC_LAW_CATEGORIES } from '@kineticlaw/kineticLaws';

const { Text } = Typography;
const { Search } = Input;

interface KineticLawMenuProps {
    onSelect: (lawId: string) => void;
    selectedLawId?: string;
}

const KineticLawMenu: React.FC<KineticLawMenuProps> = ({ onSelect, selectedLawId }) => {
    const { token } = theme.useToken();
    const [searchText, setSearchText] = useState('');
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    // Filter laws based on search text
    const getFilteredLaws = (categoryKey: string) => {
        return KINETIC_LAWS
            .filter(law => law.category === categoryKey)
            .filter(law =>
                searchText === '' ||
                law.name.toLowerCase().includes(searchText.toLowerCase()) ||
                law.description.toLowerCase().includes(searchText.toLowerCase())
            );
    };

    // Handle menu open change with accordion behavior
    const onOpenChange = (keys: string[]) => {
        const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
        if (KINETIC_LAW_CATEGORIES.some(category => category.key === latestOpenKey)) {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        } else {
            setOpenKeys(keys);
        }
    };

    // Create menu items from categories and laws
    const menuItems = KINETIC_LAW_CATEGORIES.map(category => {
        const filteredLaws = getFilteredLaws(category.key);

        if (filteredLaws.length === 0 && searchText !== '') {
            return null;
        }

        return {
            key: category.key,
            label: (
                <div className="py-1">
                    <Space size="small" align="center">
                        <Badge color={category.color} />
                        <Text strong style={{ color: token.colorText, letterSpacing: '0.2px' }} className="text-sm">
                            {category.label}
                        </Text>
                        <Text type="secondary" className="text-xs">
                            ({filteredLaws.length})
                        </Text>
                    </Space>
                </div>
            ),
            children: filteredLaws.map(law => ({
                key: law.id,
                label: (
                    <Text
                        className="block text-sm font-normal break-words"
                        style={{
                            color: token.colorTextSecondary,
                            lineHeight: 1.4
                        }}
                    >
                        {law.name}
                    </Text>
                )
            }))
        };
    }).filter(item => item !== null);

    return (
        <div className="flex overflow-hidden flex-col h-full">
            {/* Search Header */}
            <div
                className="p-3 border-b"
                style={{
                    backgroundColor: token.colorBgElevated,
                    borderBottom: `1px solid ${token.colorBorder}`,
                }}
            >
                <Search
                    placeholder="Search kinetic laws..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="middle"
                    allowClear
                    style={{
                        borderRadius: token.borderRadiusSM
                    }}
                />
            </div>

            {/* Menu Content */}
            <div
                className="overflow-y-auto overflow-x-hidden flex-1 mb-14 scrollbar-hide"
                style={{ backgroundColor: token.colorBgContainer }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={selectedLawId ? [selectedLawId] : []}
                    openKeys={openKeys}
                    onOpenChange={onOpenChange}
                    onSelect={({ key }) => onSelect(key as string)}
                    className="h-full border-none"
                    style={{
                        backgroundColor: 'transparent',
                        color: token.colorText,
                        borderRight: "none",
                    }}
                    items={menuItems}
                    inlineIndent={12}
                />
            </div>
        </div>
    );
};

export default KineticLawMenu; 
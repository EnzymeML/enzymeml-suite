import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Typography, Button, Space, theme } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import CardTitle from "@components/CardTitle";
import useAppStore from "@stores/appstore";
import { listSmallMolecules } from "@commands/smallmols";
import { listProteins } from "@commands/proteins";
import { listVessels } from "@commands/vessels";
import { listReactions } from "@commands/reactions";
import { listMeasurements } from "@commands/measurements";
import { useRouterTauriListener } from "@hooks/useTauriListener";
import CreateDropdown from "./CreateDropdown";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

/**
 * Represents an item in the overview table
 */
interface OverviewItem {
    key: string;
    id: string;
    name: string;
    type: "Small Molecule" | "Protein" | "Vessel" | "Reaction" | "Measurement";
    route: string;
}

/**
 * Props for the HomeOverviewTable component
 */
interface HomeOverviewTableProps {
    /** Callback function called when an item is selected */
    onItemSelect?: (id: string, type: string, route: string) => void;
}

/**
 * HomeOverviewTable component displays a comprehensive overview of all items in the current project.
 * 
 * This component provides:
 * - A table view of all vessels, small molecules, proteins, reactions, and measurements
 * - Filtering capabilities by item type
 * - Action buttons for viewing and editing items
 * - Real-time updates when items are added, modified, or deleted
 * - A create dropdown for adding new items
 * 
 * The table automatically refreshes when receiving Tauri events for data updates,
 * ensuring the overview stays synchronized with the backend state.
 * 
 * @param props - Component props
 * @param props.onItemSelect - Optional callback triggered when an item is clicked
 * @returns JSX element containing the overview table
 */
export default function HomeOverviewTable({ onItemSelect }: HomeOverviewTableProps) {
    // States
    const [items, setItems] = useState<OverviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const setSelectedId = useAppStore((state) => state.setSelectedId);

    // Navigation
    const navigate = useNavigate();

    // Styling
    const darkMode = useAppStore((state) => state.darkMode);
    const { token } = theme.useToken();

    /**
     * Fetches all data from the backend and updates the items state.
     * Combines data from all entity types into a single array for display.
     */
    const fetchData = async () => {
        setLoading(true);
        try {
            const [vessels, smallMolecules, proteins, reactions, measurements] = await Promise.all([
                listVessels(),
                listSmallMolecules(),
                listProteins(),
                listReactions(),
                listMeasurements()
            ]);

            const allItems: OverviewItem[] = [
                ...vessels.map(([id, name]): OverviewItem => ({
                    key: `vessel_${id}`,
                    id,
                    name,
                    type: "Vessel",
                    route: "/vessels"
                })),
                ...smallMolecules.map(([id, name]): OverviewItem => ({
                    key: `smallmol_${id}`,
                    id,
                    name,
                    type: "Small Molecule",
                    route: "/small-molecules"
                })),
                ...proteins.map(([id, name]): OverviewItem => ({
                    key: `protein_${id}`,
                    id,
                    name,
                    type: "Protein",
                    route: "/proteins"
                })),
                ...reactions.map(([id, name]): OverviewItem => ({
                    key: `reaction_${id}`,
                    id,
                    name,
                    type: "Reaction",
                    route: "/reactions"
                })),
                ...measurements.map(([id, name]): OverviewItem => ({
                    key: `measurement_${id}`,
                    id,
                    name,
                    type: "Measurement",
                    route: "/measurements"
                }))
            ];

            setItems(allItems);
        } catch (error) {
            console.error("Error fetching overview data:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchData();
    }, []);

    // Listen for updates from Tauri events to keep data synchronized
    useRouterTauriListener("update_vessels", fetchData);
    useRouterTauriListener("update_document", fetchData);
    useRouterTauriListener("update_small_mols", fetchData);
    useRouterTauriListener("update_proteins", fetchData);
    useRouterTauriListener("update_reactions", fetchData);
    useRouterTauriListener("update_measurements", fetchData);

    /**
     * Handles item selection/viewing.
     * Updates the selected ID in the app store and triggers the callback.
     * 
     * @param record - The selected overview item
     */
    const handleView = (record: OverviewItem) => {
        setSelectedId(record.id);
        navigate(record.route);
        onItemSelect?.(record.id, record.type, record.route);
    };

    // Table column definitions
    const columns: ColumnsType<OverviewItem> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: "40%",
            render: (text: string, record) => (
                <Space>
                    <Text strong>{text}</Text>
                    {record.type === "Vessel" && (
                        <Tag color="orange">
                            Vessel
                        </Tag>
                    )}
                    {record.type === "Small Molecule" && (
                        <Tag color="blue">
                            Molecule
                        </Tag>
                    )}
                    {record.type === "Protein" && (
                        <Tag color="green">
                            Protein
                        </Tag>
                    )}
                    {record.type === "Reaction" && (
                        <Tag color="purple">
                            Reaction
                        </Tag>
                    )}
                    {record.type === "Measurement" && (
                        <Tag color="cyan">
                            Measurement
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: "25%",
            filters: [
                { text: "Vessel", value: "Vessel" },
                { text: "Small Molecule", value: "Small Molecule" },
                { text: "Protein", value: "Protein" },
                { text: "Reaction", value: "Reaction" },
                { text: "Measurement", value: "Measurement" },
            ],
            onFilter: (value, record) => record.type === value,
            render: (type: string) => (
                <Text type="secondary">{type}</Text>
            ),
        },
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: "20%",
            render: (text: string) => (
                <Text code>{text}</Text>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: "15%",
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="View details"
                    />
                </Space>
            ),
        },
    ];

    return (
        <Card
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: 0,
                borderBottomLeftRadius: token.borderRadiusLG,
                borderBottomRightRadius: token.borderRadiusLG,
                borderBottom: 1,
                borderStyle: "solid",
                borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
            }}
            className="w-full"
            title={
                <div className="flex justify-between items-center">
                    <CardTitle
                        title="Project Overview"
                        description={`${items.length} items in your current document`}
                    />
                    <CreateDropdown />
                </div>
            }
            styles={{
                body: {
                    padding: "12px"
                }
            }}
        >
            <Table
                columns={columns}
                dataSource={items}
                loading={loading}
                pagination={{
                    total: items.length,
                    pageSize: 8,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total}`,
                    size: "small",
                }}
                scroll={{ x: "max-content" }}
                size="small"
                rowClassName="cursor-pointer"
                onRow={(record) => ({
                    onClick: () => handleView(record),
                })}
            />
        </Card>
    );
}

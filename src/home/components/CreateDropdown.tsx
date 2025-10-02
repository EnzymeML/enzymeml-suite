import React from "react";
import { Dropdown, Space, Flex } from "antd";
import { DownOutlined, OpenAIOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Icon from "@ant-design/icons";

import ProteinIcon from "@icons/protein.svg";
import SmallMoleculeIcon from "@icons/smallmolecule.svg";
import ReactionsIcon from "@icons/reactions1.svg";
import VesselsIcon from "@icons/vessels.svg";
import MeasurementIcon from "@icons/measurements.svg";
import useAppStore from "@stores/appstore";
import { createSmallMolecule } from "@commands/smallmols";
import { createProtein } from "@commands/proteins";
import { createVessel } from "@commands/vessels";
import { createReaction } from "@commands/reactions";
import { createMeasurement } from "@commands/measurements";
import useLLMStore from "@suite/stores/llmstore";

/**
 * Configuration interface for menu items in the create dropdown
 */
interface MenuItem {
    /** Unique identifier for the menu item */
    key: string;
    /** Display label for the menu item */
    label: string;
    /** Icon component to display next to the label */
    icon: React.ReactNode;
    /** Route to navigate to after creation */
    route: string;
    /** Optional type identifier */
    type?: string;
    /** Action function to execute when item is selected */
    action: () => Promise<string>;
}

/**
 * CreateDropdown component provides a dropdown button for creating new entities.
 * 
 * This component offers a unified interface for creating various types of entities
 * in the application, including:
 * - Small Molecules
 * - Proteins
 * - Vessels
 * - Reactions
 * - Measurements
 * - ChatGPT extraction modal
 * 
 * When an item is created, the component automatically:
 * 1. Executes the creation action
 * 2. Sets the newly created item as selected in the app store
 * 3. Navigates to the appropriate route for the entity type
 * 
 * The dropdown uses Ant Design's Dropdown.Button component and includes
 * appropriate icons for each entity type.
 * 
 * @returns JSX element containing the create dropdown button
 */
export default function CreateDropdown() {
    // Global states
    const navigate = useNavigate();
    const setSelectedId = useAppStore((state) => state.setSelectedId);

    // Global actions
    const setExtractionModalVisible = useLLMStore((state) => state.setExtractionModalVisible);

    /**
     * Configuration array defining all available creation actions.
     * Each action includes display information, routing, and the creation function.
     */
    const createActions: MenuItem[] = [
        {
            key: "small_molecule",
            label: "Small Molecule",
            icon: <Icon style={{ fontSize: 16 }} component={SmallMoleculeIcon as unknown as React.ComponentType} />,
            route: "/small-molecules",
            action: createSmallMolecule,
        },
        {
            key: "protein",
            label: "Protein",
            icon: <Icon style={{ fontSize: 16 }} component={ProteinIcon as unknown as React.ComponentType} />,
            route: "/proteins",
            action: createProtein
        },
        {
            key: "vessel",
            label: "Vessel",
            icon: <Icon style={{ fontSize: 16 }} component={VesselsIcon as unknown as React.ComponentType} />,
            route: "/vessels",
            action: createVessel
        },
        {
            key: "reaction",
            label: "Reaction",
            icon: <Icon style={{ fontSize: 16, transform: "rotate(45deg)" }} component={ReactionsIcon as unknown as React.ComponentType} />,
            route: "/reactions",
            action: createReaction
        },
        {
            key: "measurement",
            label: "Measurement",
            icon: <Icon style={{ fontSize: 16 }} component={MeasurementIcon as unknown as React.ComponentType} />,
            route: "/measurements",
            action: createMeasurement
        },
        {
            key: "openai",
            label: "Use ChatGPT",
            icon: <OpenAIOutlined style={{ fontSize: 16 }} />,
            route: "/",
            // @ts-expect-error - action is not typed
            action: () => setExtractionModalVisible(true)
        },
    ];

    /**
     * Handles menu item clicks by executing the corresponding creation action.
     * 
     * For regular entity creation:
     * 1. Calls the creation function to create the entity
     * 2. Sets the newly created entity as selected in the app store
     * 3. Navigates to the entity's detail page
     * 
     * For special actions (like ChatGPT), executes the action directly.
     * 
     * @param key - The key of the selected menu item
     */
    const handleMenuClick = async ({ key }: { key: string }) => {
        const actionConfig = createActions.find(action => action.key === key);
        if (actionConfig) {
            try {
                // Create the item and get the ID
                const id = await actionConfig.action();
                // Set the selected ID in the store
                setSelectedId(id);
                // Navigate to the appropriate route
                navigate(actionConfig.route);
                console.log(`Created ${actionConfig.label} with ID: ${id}`);
            } catch (error) {
                console.error(`Error creating ${actionConfig.label}:`, error);
            }
        }
    };

    /**
     * Transforms the create actions into menu items for the Ant Design dropdown.
     * Each menu item includes an icon and label in a Space component.
     */
    const menuItems = createActions.map(action => ({
        key: action.key,
        label: (
            <Space>
                {action.icon}
                {action.label}
            </Space>
        ),
    }));

    return (
        <Flex align="center" gap="small">
            <Dropdown.Button
                menu={{
                    items: menuItems,
                    onClick: handleMenuClick,
                }}
                icon={<DownOutlined />}
                trigger={['click']}
                size="middle"
                type="primary"
                placement="bottomLeft"
            >
                Create New
            </Dropdown.Button>
        </Flex>
    );
}

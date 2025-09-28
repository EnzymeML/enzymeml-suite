import { Checkbox, List } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { GiMolecule } from "react-icons/gi";

interface ExtractedItemData {
    name?: string;
    title?: string;
    id?: string;
    [key: string]: unknown;
}

export interface ExtractedItem {
    data: ExtractedItemData;
    description: string;
}

interface ExtractedItemListItemProps {
    item: ExtractedItem;
    index: number;
    isSelected: boolean;
    onSelect: (index: number, selected: boolean) => void;
}

export default function ExtractedItemListItem({
    item,
    index,
    isSelected,
    onSelect,
}: ExtractedItemListItemProps) {

    // Extract the name/title from the item (adapt based on your schema)
    const getItemName = (item: ExtractedItem) => {
        return item.data.name || item.data.title || item.data.id || `Item ${index + 1}`;
    };

    const handleCheckboxChange = (e: CheckboxChangeEvent) => {
        onSelect(index, e.target.checked);
    };

    const getReasoning = (item: ExtractedItem) => {
        return item.description || item.data.name || item.data.title || item.data.id || `Item ${index + 1}`;
    };

    return (
        <List.Item
            className="cursor-pointer"
            onClick={() => onSelect(index, !isSelected)}
            actions={[
                <Checkbox
                    key="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                />
            ]}
        >
            <List.Item.Meta
                avatar={<GiMolecule size={24} />}
                title={<span className="font-semibold">{getItemName(item)}</span>}
                description={<span className="text-xs opacity-60">{getReasoning(item)}</span>}
            />
        </List.Item>
    );
}

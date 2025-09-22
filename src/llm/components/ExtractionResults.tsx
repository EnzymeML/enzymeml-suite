import { useState, useMemo } from "react";
import { Button, theme, Checkbox, List } from "antd";
import ExtractedItemListItem from "./ExtractedItemListItem";

interface ExtractionResultsProps {
    extractedData: any[];
    onBack: () => void;
    onComplete: (selectedItems: any[]) => void;
    instructions: {
        title: string;
        description: string;
        selectAll: string;
        selectNone: string;
    };
}

export default function ExtractionResults({
    extractedData,
    onBack,
    onComplete,
    instructions,
}: ExtractionResultsProps) {
    const { token } = theme.useToken();
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const selectedItems = useMemo(() => {
        return extractedData.filter((_, index) => selectedIndices.has(index));
    }, [extractedData, selectedIndices]);

    const handleItemSelect = (index: number, selected: boolean) => {
        setSelectedIndices(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(index);
            } else {
                newSet.delete(index);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedIndices.size === extractedData.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(extractedData.map((_, index) => index)));
        }
    };

    const handleComplete = () => {
        onComplete(selectedItems.map((item) => item.data));
    };

    const allSelected = selectedIndices.size === extractedData.length && extractedData.length > 0;
    const someSelected = selectedIndices.size > 0;

    const cardStyle = {
        padding: 12,
        background: token.colorBgContainer,
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorder}`,
        color: token.colorText,
    };

    return (
        <div className="flex flex-col gap-4 max-h-96">
            {/* Selection Controls */}
            {extractedData.length > 0 && (
                <div className="flex justify-between items-center pb-1">
                    <div className="flex gap-2 items-center">
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={handleSelectAll}
                        />
                        <span className="text-sm font-semibold">
                            {selectedIndices.size} of {extractedData.length} selected
                        </span>
                    </div>

                    <Button
                        type="link"
                        size="small"
                        onClick={handleSelectAll}
                    >
                        {allSelected ? instructions.selectNone : instructions.selectAll}
                    </Button>
                </div>
            )}

            {/* Items List */}
            <div className="overflow-auto flex-1 scrollbar-hide">
                {extractedData.length > 0 ? (
                    <List
                        dataSource={extractedData}
                        renderItem={(item, index) => (
                            <ExtractedItemListItem
                                key={index}
                                item={item}
                                index={index}
                                isSelected={selectedIndices.has(index)}
                                onSelect={handleItemSelect}
                            />
                        )}
                    />
                ) : (
                    <div className="w-full" style={cardStyle}>
                        <div className="text-center">
                            <p className="text-sm opacity-60" style={{ color: token.colorTextSecondary }}>
                                No items extracted. Try adjusting your input.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 justify-between items-center pt-2 border-t" style={{ borderColor: token.colorBorder }}>
                <div className="text-sm opacity-60" style={{ color: token.colorTextSecondary }}>
                    {selectedIndices.size > 0
                        ? `Ready to add ${selectedIndices.size} item${selectedIndices.size > 1 ? 's' : ''}?`
                        : 'Select items above to continue'
                    }
                </div>
                <div className="flex gap-3">
                    <Button onClick={onBack}>
                        Back to Edit
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleComplete}
                        disabled={selectedIndices.size === 0}
                    >
                        Add {selectedIndices.size > 0 ? `${selectedIndices.size} ` : ''}Items
                    </Button>
                </div>
            </div>
        </div>
    );
}

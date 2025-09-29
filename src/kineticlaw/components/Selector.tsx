import React from 'react';
import { Row, Typography, Button, Card, Badge, theme, Modal, Col } from 'antd';

import { KINETIC_LAW_CATEGORIES } from '@kineticlaw/kineticLaws';
import { KineticLawDefinition } from '@reactions/types';
import LatexRenderer from '@components/LatexRenderer';
import CardTitle from '@components/CardTitle';

import CollapsibleParametersCard from '@kineticlaw/components/CollapsibleParametersCard';
import { createColoredSymbolsMap, getEquationSize } from '@kineticlaw/utils';
import KineticLawMenu from '@kineticlaw/components/KineticLawMenu';

const { Text } = Typography;

interface SelectorProps {
    selectedLaw: KineticLawDefinition | null;
    onLawSelect: (lawId: string) => void;
    onDeselect: () => void;
}

interface KineticLawLibraryCardProps {
    selectedLaw: KineticLawDefinition | null;
    onLawSelect: (lawId: string) => void;
}

interface KineticLawDetailViewProps {
    selectedLaw: KineticLawDefinition;
    onDeselect: () => void;
}

interface LawInfoCardProps {
    selectedLaw: KineticLawDefinition;
    onDeselect: () => void;
}

interface EquationDisplayCardProps {
    equation: string;
    selectedLaw?: KineticLawDefinition;
}

interface EquationModalProps {
    isVisible: boolean;
    onClose: () => void;
    equation: string;
    selectedLaw?: KineticLawDefinition;
    lawName?: string;
}

const KineticLawLibraryCard: React.FC<KineticLawLibraryCardProps> = ({ selectedLaw, onLawSelect }) => {
    const { token } = theme.useToken();

    return (
        <Card
            title={
                <CardTitle title="Kinetic Laws" description={''} />
            }
            size="small"
            className="h-full"
            style={{
                boxShadow: token.boxShadowTertiary,
                backgroundColor: token.colorBgContainer,
                border: 'none'
            }}
            styles={{
                header: {
                    backgroundColor: token.colorBgElevated,
                    minHeight: '40px',
                    padding: '0 16px'
                },
                body: {
                    padding: 0,
                    height: 'calc(100% - 40px)',
                    overflow: 'hidden',
                    backgroundColor: token.colorBgContainer
                }
            }}
        >
            <KineticLawMenu
                onSelect={onLawSelect}
                selectedLawId={selectedLaw?.id}
            />
        </Card>
    );
};

const LawInfoCard: React.FC<LawInfoCardProps> = ({ selectedLaw }) => {
    const { token } = theme.useToken();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const getCategoryBadge = (category: string) => {
        const categoryInfo = KINETIC_LAW_CATEGORIES.find(cat => cat.key === category);
        return categoryInfo ? (
            <Badge
                color={categoryInfo.color}
                text={
                    <Text className="text-xs font-medium">
                        {categoryInfo.label}
                    </Text>
                }
            />
        ) : null;
    };

    const description = selectedLaw.description;
    const shouldTruncate = description.length > 150;
    const displayText = isExpanded ? description : (shouldTruncate ? `${description.slice(0, 150)}...` : description);

    return (
        <div
            className="relative p-6 rounded-lg"
            style={{
                backgroundColor: token.colorBgContainer,
                boxShadow: token.boxShadowTertiary
            }}
        >
            {/* Header with title and badge */}
            <div className="pr-12 mb-4">
                <h3
                    className="mb-2 text-lg font-semibold leading-tight break-words"
                    style={{ color: token.colorText }}
                >
                    {selectedLaw.name}
                </h3>
                <div className="flex items-center">
                    {getCategoryBadge(selectedLaw.category)}
                </div>
            </div>

            {/* Description */}
            <div>
                <Text
                    style={{ color: token.colorTextSecondary, lineHeight: 1.6 }}
                    className="block text-xs"
                >
                    {displayText}
                </Text>
                {shouldTruncate && (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0 mt-2 h-auto text-xs"
                        style={{ color: token.colorPrimary }}
                    >
                        {isExpanded ? 'Show less' : 'Show more'}
                    </Button>
                )}
            </div>
        </div>
    );
};

const EquationModal: React.FC<EquationModalProps> = ({ isVisible, onClose, equation, selectedLaw, lawName }) => {
    const { token } = theme.useToken();

    // Create color mapping for species based on their roles
    const coloredSymbolsMap = createColoredSymbolsMap(selectedLaw || null);

    // Use a larger size for the modal display
    const size = 'large'; // Always use large size for modal display

    return (
        <Modal
            title={
                <Text strong style={{ color: token.colorText }}>
                    {lawName ? `${lawName} - Mathematical Expression` : 'Mathematical Expression'}
                </Text>
            }
            open={isVisible}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
            style={{
                maxWidth: '90vw'
            }}
            styles={{
                content: {
                    backgroundColor: token.colorBgContainer,
                    maxHeight: '80vh',
                    overflow: 'auto'
                }
            }}
        >
            <div
                className="p-8 text-center min-h-[120px] flex items-center justify-center overflow-auto w-full"
                style={{
                    backgroundColor: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    margin: '16px 0'
                }}
            >
                <div className="min-w-max">
                    <LatexRenderer
                        equation={equation}
                        size={size}
                        convertAsciiToLatex={true}
                        coloredSymbolsMap={coloredSymbolsMap}
                    />
                </div>
            </div>
        </Modal>
    );
};

const EquationDisplayCard: React.FC<EquationDisplayCardProps> = ({ equation, selectedLaw }) => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = React.useState(false);

    // Create color mapping for species based on their roles
    const coloredSymbolsMap = createColoredSymbolsMap(selectedLaw || null);

    const size = getEquationSize(selectedLaw?.equation || '');

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    const handleExpandClick = () => {
        setIsModalVisible(true);
    };

    return (
        <>
            <Card
                title={
                    <Text strong style={{ color: token.colorText }}>
                        Mathematical Expression
                    </Text>
                }
                size="default"
                style={{
                    boxShadow: token.boxShadowTertiary,
                    backgroundColor: token.colorBgContainer,
                    border: 'none'
                }}
                styles={{
                    header: {
                        backgroundColor: token.colorBgElevated,
                        minHeight: '40px'
                    },
                }}
            >
                <div
                    className="relative p-6 text-center min-h-[80px] flex items-center justify-center overflow-auto w-full cursor-pointer hover:bg-opacity-80"
                    style={{
                        backgroundColor: token.colorFillQuaternary,
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: token.borderRadius
                    }}
                    onClick={handleExpandClick}
                    title="Click to expand equation"
                >
                    <div className="min-w-max">
                        <LatexRenderer
                            equation={equation}
                            size={size}
                            convertAsciiToLatex={true}
                            coloredSymbolsMap={coloredSymbolsMap}
                        />
                    </div>
                </div>
            </Card>

            <EquationModal
                isVisible={isModalVisible}
                onClose={handleModalClose}
                equation={equation}
                selectedLaw={selectedLaw}
                lawName={selectedLaw?.name}
            />
        </>
    );
};

const KineticLawDetailView: React.FC<KineticLawDetailViewProps> = ({ selectedLaw, onDeselect }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Scroll to top when selectedLaw changes
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [selectedLaw]);

    return (
        <div
            ref={scrollContainerRef}
            className="overflow-y-auto pr-2 h-full scrollbar-hide"
        >
            <div className="flex flex-col gap-4">
                <LawInfoCard selectedLaw={selectedLaw} onDeselect={onDeselect} />
                <EquationDisplayCard equation={selectedLaw.equation} selectedLaw={selectedLaw} />
                <CollapsibleParametersCard selectedLaw={selectedLaw} />
            </div>
        </div>
    );
};

const Selector: React.FC<SelectorProps> = ({ selectedLaw, onLawSelect, onDeselect }) => {
    return (
        <div className="relative h-full">
            <Row gutter={16} className="h-full">
                {/* Menu - Full width when no selection, partial when selected */}
                <Col span={selectedLaw ? 10 : 24} className="h-full">
                    <KineticLawLibraryCard selectedLaw={selectedLaw} onLawSelect={onLawSelect} />
                </Col>

                {/* Detail View - Shows when law is selected */}
                {selectedLaw && (
                    <Col span={14} className="h-full">
                        <KineticLawDetailView selectedLaw={selectedLaw} onDeselect={onDeselect} />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default Selector; 
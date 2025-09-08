import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Row, Typography, Button, Card, Badge, theme, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { KINETIC_LAW_CATEGORIES } from '../kineticLaws';
import { KineticLawDefinition } from '../../reactions/types';
import LatexRenderer from '../../components/LatexRenderer';
import KineticLawMenu from './KineticLawMenu';
import CollapsibleParametersCard from './CollapsibleParametersCard';
import CardTitle from '../../components/CardTitle';
import { createColoredSymbolsMap, getEquationSize } from './utils';

const DEFAULT_DESCRIPTION = 'Select a Kinetic Law';

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
                <CardTitle title="Kinetic Laws" description={DEFAULT_DESCRIPTION} />
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
                    borderBottom: `1px solid ${token.colorBorder}`,
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

const LawInfoCard: React.FC<LawInfoCardProps> = ({ selectedLaw, onDeselect }) => {
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
            className="relative p-6 rounded-lg transition-shadow duration-200"
            style={{
                backgroundColor: token.colorBgContainer,
                boxShadow: token.boxShadowTertiary
            }}
        >
            {/* Close button positioned absolutely in top right */}
            <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onDeselect}
                className="flex absolute top-4 right-4 justify-center items-center w-8 h-8 transition-all duration-200"
                style={{
                    color: token.colorTextTertiary
                }}
                title="Close detail view"
            />

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
                className="transition-shadow duration-200"
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
                    className="relative p-6 text-center min-h-[80px] flex items-center justify-center overflow-auto w-full cursor-pointer transition-colors duration-200 hover:bg-opacity-80"
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.2,
                    duration: 0.3,
                    ease: "easeOut"
                }}
            >
                <div className="flex flex-col gap-4 mb-10">
                    <LawInfoCard selectedLaw={selectedLaw} onDeselect={onDeselect} />
                    <EquationDisplayCard equation={selectedLaw.equation} selectedLaw={selectedLaw} />
                    <CollapsibleParametersCard selectedLaw={selectedLaw} />
                </div>
            </motion.div>
        </div>
    );
};

const Selector: React.FC<SelectorProps> = ({ selectedLaw, onLawSelect, onDeselect }) => {
    return (
        <div className="relative h-full">
            <Row gutter={16} className="h-full">
                {/* Menu - Full width when no selection, partial when selected */}
                <motion.div
                    initial={false}
                    animate={{
                        width: selectedLaw ? '41.66667%' : '100%',
                        paddingRight: selectedLaw ? '8px' : '0px'
                    }}
                    transition={{
                        duration: 0.4,
                        ease: [0.4, 0.0, 0.2, 1]
                    }}
                    className="h-full"
                >
                    <KineticLawLibraryCard selectedLaw={selectedLaw} onLawSelect={onLawSelect} />
                </motion.div>

                {/* Detail View - Slides in from right when law is selected */}
                <AnimatePresence>
                    {selectedLaw && (
                        <motion.div
                            initial={{
                                width: '0%',
                                opacity: 0,
                                x: 50
                            }}
                            animate={{
                                width: '58.33333%',
                                opacity: 1,
                                x: 0
                            }}
                            exit={{
                                width: '0%',
                                opacity: 0,
                                x: 50
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.4, 0.0, 0.2, 1],
                                opacity: { duration: 0.3 }
                            }}
                            className="pl-2 h-full"
                        >
                            <KineticLawDetailView selectedLaw={selectedLaw} onDeselect={onDeselect} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Row>
        </div>
    );
};

export default Selector; 
import { useState } from "react";
import { Button, Flex, Input, Tag, theme } from "antd";
import "./InputView.css";
import { RiPlayLargeFill } from "react-icons/ri";
import ButtonBar from "./ButtonBar";
import { ExtractionContext } from "../../types/context";

interface InputViewProps {
    onExtract: (input: string, filePaths: string[]) => void;
    onCancel: () => void;
    setBrowseWeb: (useWebSearch: boolean) => void;
    browseWeb: boolean;
    context: ExtractionContext[];
    setContext: React.Dispatch<React.SetStateAction<ExtractionContext[]>>;
}

export default function InputView(
    {
        onExtract,
        onCancel,
        browseWeb,
        setBrowseWeb,
        context,
        setContext
    }: InputViewProps
) {
    // Local states
    const [input, setInput] = useState<string>("");

    // Styles
    const { token } = theme.useToken();

    const handleExtract = () => {
        if (!input.trim()) {
            return;
        }
        onExtract(input, []);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleExtract();
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const ctxTagStyle: React.CSSProperties = {
        height: 18,
        background: "transparent",
        borderColor: token.colorBorder,
        color: token.colorTextSecondary,
        fontSize: "11px",
        width: 'fit-content',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        gap: token.paddingXXS,
        alignItems: 'center',
        maxWidth: '300px',
    };

    return (
        <Flex vertical gap={4}>
            <Flex className="px-2 py-1" gap={4}>
                {context.map((context) => (
                    <Tag
                        closable
                        icon={<context.icon />}
                        key={context.label}
                        style={ctxTagStyle}
                        onClose={() => setContext((prev) => prev.filter((c) => c.label !== context.label))}
                    >
                        {context.label}
                    </Tag>
                ))}
            </Flex>
            <Flex align="center">
                <Input
                    size="large"
                    className="text-sm"
                    placeholder="Describe what you want to extract..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    variant="borderless"
                    autoFocus
                />
                <Button
                    variant="filled"
                    shape="circle"
                    size="middle"
                    icon={<RiPlayLargeFill style={{ color: token.colorTextSecondary }} />}
                    onClick={() => setBrowseWeb(!browseWeb)}
                />
            </Flex>
            <Flex>
                <ButtonBar
                    browseWeb={browseWeb}
                    setBrowseWeb={setBrowseWeb}
                />
            </Flex>
        </Flex>
    );
}

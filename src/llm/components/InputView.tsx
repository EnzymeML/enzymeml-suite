import { useState } from "react";
import { Button, Flex, Input, Tag, theme } from "antd";
import { RiPlayLargeFill } from "react-icons/ri";

import "@llm/components/InputView.css";
import ButtonBar from "@llm/components/ButtonBar";
import { ExtractionContext } from "@suite-types/context";
import { ZodObject, ZodRawShape, z } from "zod";
import Icon from "@ant-design/icons";

interface InputViewProps<T extends ZodObject<ZodRawShape>, U = z.infer<T>> {
    onExtract: (input: string, filePaths: string[]) => void;
    onCancel: () => void;
    setBrowseWeb: (useWebSearch: boolean) => void;
    browseWeb: boolean;
    context: ExtractionContext<U, T>;
}

export default function InputView<T extends ZodObject<ZodRawShape>, U = z.infer<T>>(
    {
        onExtract,
        onCancel,
        browseWeb,
        setBrowseWeb,
        context,
    }: InputViewProps<T, U>
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
                <Tag
                    icon={context?.icon ? <Icon component={context.icon as React.ComponentType} /> : null}
                    key={context?.label}
                    style={ctxTagStyle}
                >
                    {context?.label}
                </Tag>
            </Flex>
            <Flex align="center">
                <Input.TextArea
                    size="large"
                    className="text-sm"
                    placeholder="Describe what you want to extract..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    variant="borderless"
                    autoFocus
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    style={{ resize: 'none' }}
                />
                <Button
                    variant="filled"
                    shape="circle"
                    size="middle"
                    icon={<RiPlayLargeFill style={{ color: token.colorTextSecondary }} />}
                    onClick={() => handleExtract()}
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

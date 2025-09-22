import { useState } from "react";
import { Button, Flex, Popover, Tooltip, theme } from "antd";
import useLLMStore from "../../stores/llmstore";
import ModelSelector from "./ModelSelector";
import ToolSelector from "./ToolSelector";
import "./InputView.css";
import { RiAddLine, RiGlobalLine, RiNavigationFill } from "react-icons/ri";

const ICON_SIZE = "18px";

interface ButtonBarProps {
    browseWeb: boolean;
    setBrowseWeb: (browseWeb: boolean) => void;
}

export default function ButtonBar({ browseWeb, setBrowseWeb }: ButtonBarProps) {

    const [modelSelectorVisible, setModelSelectorVisible] = useState<boolean>(false);
    const [toolSelectorVisible, setToolSelectorVisible] = useState<boolean>(false);

    // Global states
    const llmModel = useLLMStore((state) => state.llmModel);
    const tools = useLLMStore((state) => state.tools);

    // Styles
    const { token } = theme.useToken();

    return (
        <Flex
            gap={4}
            className="px-2"
            align="center" style={{ width: '100%' }}
        >
            <Tooltip title="Upload a file">
                <Button
                    className="text-sm font-medium"
                    variant="text"
                    size="small"
                    icon={<RiAddLine style={{ fontSize: "20px" }} />}
                    style={{ border: 'none', boxShadow: 'none' }}
                />
            </Tooltip>
            <Popover
                content={<ToolSelector />}
                trigger="click"
                placement="bottom"
                open={toolSelectorVisible}
                style={{ width: '100%' }}
                onOpenChange={setToolSelectorVisible}
            >
                <Tooltip title="Tools">
                    <Button
                        className="font-medium"
                        variant="text"
                        size="small"
                        icon={
                            <RiNavigationFill
                                style={{
                                    fontSize: ICON_SIZE,
                                    color: tools.length > 0 ? token.colorPrimaryActive : token.colorTextSecondary
                                }}
                            />}
                        style={{ border: 'none', boxShadow: 'none' }}
                    />
                </Tooltip>
            </Popover>
            <Tooltip title="Browse web">
                <Button
                    className="font-medium"
                    variant="text"
                    size="small"
                    icon={
                        <RiGlobalLine
                            style={{
                                fontSize: ICON_SIZE,
                                color: browseWeb ? token.colorPrimary : token.colorTextSecondary
                            }}
                        />
                    }
                    style={{ border: 'none', boxShadow: 'none' }}
                    onClick={() => setBrowseWeb(!browseWeb)}
                />
            </Tooltip>
            <Popover
                content={<ModelSelector setVisible={setModelSelectorVisible} />}
                trigger="click"
                placement="bottom"
                open={modelSelectorVisible}
                style={{ width: '100%' }}
                onOpenChange={setModelSelectorVisible}
            >
                <Button
                    className="font-medium"
                    variant="text"
                    size="small"
                    style={{ border: 'none', boxShadow: 'none' }}
                >
                    <span style={{ color: token.colorTextSecondary }}>
                        {llmModel.label}
                    </span>
                </Button>
            </Popover>
        </Flex>
    );
}
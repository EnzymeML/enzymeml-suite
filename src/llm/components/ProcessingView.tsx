import { theme } from "antd";
// @ts-expect-error - ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error - ignore
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import useAppStore from "@stores/appstore";

interface ProcessingViewProps {
    isStreaming: boolean;
    streamedChunks: string;
    onBack: () => void;
    messages: {
        streaming: string;
        complete: string;
        waitingForResponse: string;
        analyzing: string;
    };
}

export default function ProcessingView({
    streamedChunks,
    messages,
}: ProcessingViewProps) {
    const { token } = theme.useToken();
    const darkMode = useAppStore((state) => state.darkMode);

    return (
        <div className="flex flex-col gap-4">

            {/* Content Display - Fixed Height with Scroll */}
            <div
                className="overflow-auto"
                style={{
                    background: token.colorBgLayout,
                    borderRadius: token.borderRadius,
                    minHeight: '300px',
                    maxHeight: '400px'
                }}
            >
                <SyntaxHighlighter
                    language="json"
                    style={darkMode ? oneDark : oneLight}
                    customStyle={{
                        background: 'transparent',
                        padding: '16px',
                        margin: 0,
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: token.colorText,
                        minHeight: '100%'
                    }}
                    wrapLongLines={true}
                >
                    {streamedChunks || messages.waitingForResponse}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

import { useEffect, useRef, useState } from "react";
import { Spin, theme, Typography } from "antd";
// @ts-expect-error - ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error - ignore
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import useAppStore from "@stores/appstore";

/**
 * Props for the ProcessingView component
 */
interface ProcessingViewProps {
    /** Whether the AI is currently streaming data */
    isStreaming: boolean;
    /** The streamed content chunks received from the AI */
    streamedChunks: string;
    /** Callback function to navigate back to the previous step */
    onBack: () => void;
    /** Messages to display during different processing states */
    messages: {
        /** Message shown while streaming is active */
        streaming: string;
        /** Message shown when processing is complete */
        complete: string;
        /** Message shown while waiting for AI response */
        waitingForResponse: string;
        /** Message shown while analyzing content */
        analyzing: string;
    };
}

const { Text } = Typography;

/**
 * ProcessingView component displays the AI processing state and streamed content
 * 
 * This component shows the real-time streaming output from the AI during data extraction.
 * It provides a syntax-highlighted view of the JSON response being streamed, with
 * theme-aware styling that adapts to dark/light mode.
 * 
 * Features:
 * - Real-time display of streamed AI responses
 * - Syntax highlighting for JSON content with theme support
 * - Loading state with spinner when waiting for response
 * - Fixed height container with scrolling for long content
 * - Responsive design with proper spacing and typography
 * 
 * @param isStreaming - Whether the AI is currently streaming data
 * @param streamedChunks - The accumulated streamed content from the AI
 * @param onBack - Callback function to navigate back to the previous step
 * @param messages - Configuration object containing messages for different states
 * @returns JSX element representing the processing view interface
 */
export default function ProcessingView({
    isStreaming,
    streamedChunks,
    messages,
}: ProcessingViewProps) {
    /** Ant Design theme tokens for consistent styling */
    const { token } = theme.useToken();
    /** Current dark mode state for theme-aware syntax highlighting */
    const darkMode = useAppStore((state) => state.darkMode);
    /** Ref to the scrollable container for auto-scrolling */
    const contentRef = useRef<HTMLDivElement>(null);
    /** Track whether the container is scrolled from the top */
    const [isScrolled, setIsScrolled] = useState(false);

    /** Show spinner when streaming but no chunks have arrived yet */
    const showSpinner = isStreaming && !streamedChunks;

    /** Auto-scroll to bottom when new content streams in */
    useEffect(() => {
        if (contentRef.current && streamedChunks) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
            // Check if we're scrolled after auto-scrolling
            handleScroll();
        }
    }, [streamedChunks]);

    /** Handle scroll events to show/hide top fade */
    const handleScroll = () => {
        if (contentRef.current) {
            setIsScrolled(contentRef.current.scrollTop > 0);
        }
    };

    return (
        <div
            className="flex overflow-hidden relative flex-col gap-4"
            style={{
                borderRadius: token.borderRadius,
                minHeight: '50px',
                maxHeight: '400px'
            }}
        >
            {/* Top Fade Overlay - Shows when scrolled */}
            {isScrolled && streamedChunks && (
                <div
                    className="absolute top-0 right-0 left-0 z-10 pointer-events-none"
                    style={{
                        height: '60px',
                        background: `linear-gradient(to bottom, ${token.colorBgContainer} 0%, transparent 100%)`,
                    }}
                />
            )}

            {/* Content Display - Fixed Height with Scroll */}
            <div
                ref={contentRef}
                className="overflow-y-auto scrollbar-hide"
                style={{
                    maxHeight: '400px'
                }}
                onScroll={handleScroll}
            >
                {showSpinner ? (
                    // Loading state: Display spinner and waiting message
                    <div className="flex flex-col gap-3 justify-center items-center h-full">
                        <Spin size="default" />
                        <Text className="text-center">{messages.waitingForResponse}</Text>
                    </div>
                ) : streamedChunks ? (
                    // Content state: Display syntax-highlighted JSON with theme support
                    <SyntaxHighlighter
                        language="json"
                        style={darkMode ? oneDark : oneLight}
                        customStyle={{
                            background: 'transparent',
                            padding: '16px',
                            margin: 0,
                            fontSize: '12px',
                            lineHeight: '1.5',
                            minHeight: '100%'
                        }}
                        codeTagProps={{
                            style: { backgroundColor: "transparent" }
                        }}
                        wrapLongLines={true}
                    >
                        {streamedChunks}
                    </SyntaxHighlighter>
                ) : null}
            </div>
        </div>
    );
}

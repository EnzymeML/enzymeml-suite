import { useState, useEffect } from "react";
import { Divider, message, theme } from "antd";
import { extractData, UserQuery } from "enzymeml";
import { ZodObject, ZodRawShape, z } from "zod";
import ProcessingView from "./components/ProcessingView";
import ExtractionResults from "./components/ExtractionResults";
import InputView from "./components/InputView";
import OpenAI from "openai";
import useAppStore from "../stores/appstore";
import useLLMStore from "../stores/llmstore";
import extractionPrompt from "./prompts/extraction";
import { getBadgeColor } from "../components/CardHeader";
import { researchQuery } from "./utils/queries";
import { ExtractionContext } from "../types/context";

// Instructions and content constants
const EXTRACTION_INSTRUCTIONS = {
    processingMessages: {
        streaming: "AI is processing your data...",
        complete: "Processing complete",
        waitingForResponse: "// Waiting for AI response...",
        analyzing: "Analyzing content and extracting structured data"
    },

    resultsInstructions: {
        title: "Review Extracted Data",
        description: "Select the items you want to add to your collection",
        selectAll: "Select All",
        selectNone: "Clear Selection"
    }
};

interface ExtractionFlowProps<T extends ZodObject<ZodRawShape>, U = any> {
    schema: T;
    onComplete: (items: U[]) => void;
    onCancel: () => void;
    parentContext?: ExtractionContext;
}

type ExtractionStep = 'input' | 'processing' | 'results';

/**
 * Extends a schema with a description field.
 * @param schema - The schema to extend.
 * @returns The extended schema.
 */
function extendSchema<T extends ZodObject<ZodRawShape>>(schema: T) {
    return z.object({
        data: schema,
        description: z.string().describe("Description of the entity you have just extracted for the user to understand what it is."),
    });
}

export default function ExtractionFlow<T extends ZodObject<ZodRawShape>, U = any>({
    schema,
    onComplete,
    onCancel,
    parentContext,
}: ExtractionFlowProps<T, U>) {
    const [step, setStep] = useState<ExtractionStep>('input');
    const [streamedChunks, setStreamedChunks] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [extractedData, setExtractedData] = useState<U[]>([]);
    const [context, setContext] = useState<ExtractionContext[]>(
        parentContext ? [parentContext] : []
    );

    // Global states
    const llmModel = useLLMStore((state) => state.llmModel);
    const tools = useLLMStore((state) => state.tools);
    const useWebSearch = useLLMStore((state) => state.useWebSearch);

    // Global actions
    const setUseWebSearch = useLLMStore((state) => state.setUseWebSearch);

    // Reset state on every initial mount
    useEffect(() => {
        setStep('input');
        setStreamedChunks("");
        setIsStreaming(false);
        setExtractedData([]);
    }, []);

    // Handlers
    const handleExtract = async (input: string, filePaths: string[]) => {

        setStep('processing');
        setStreamedChunks("");
        setIsStreaming(true);

        try {
            const client = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY.trim(),
                dangerouslyAllowBrowser: true,
                fetch: window.fetch,
            });

            // Combine text input and file paths
            let inputQueries = [extractionPrompt, new UserQuery(input)];

            if (useWebSearch) {
                const additionalInformation = await researchQuery(client, input);
                console.log("additionalInformation", additionalInformation);
                inputQueries.push(new UserQuery(additionalInformation));
            }

            if (filePaths.length > 0) {
                inputQueries.push(new UserQuery(`File paths: ${filePaths.join(', ')}`));
            }

            const { chunks, final } = await extractData({
                input: inputQueries,
                model: llmModel.value,
                multiple: true,
                schema: extendSchema(schema),
                schemaKey: "data",
                client: client,
                tools: tools.length > 0 ? tools : undefined,
            });

            // Process the streaming chunks
            for await (const chunk of chunks) {
                if (chunk.kind === "text") {
                    setStreamedChunks(prev => prev + chunk.delta);
                }
            }

            // Get final result
            const finalData = await final;

            // @ts-ignore
            setExtractedData(finalData.output_parsed?.items || []);
            setIsStreaming(false);
            setStep('results');
        } catch (error) {
            message.error('Extraction failed. Please try again.');
            setStep('input');
            setIsStreaming(false);
            console.error('Extraction error:', error);
        }
    };

    const handleComplete = () => {
        // @ts-ignore
        onComplete(extractedData.map((item) => item.data));
    };

    const handleBack = () => {
        setStep('input');
        setStreamedChunks("");
        setIsStreaming(false);
    };

    const { token } = theme.useToken();
    const darkMode = useAppStore((state) => state.darkMode);

    const badgeColor = getBadgeColor(darkMode);

    // Convert color names to proper rgba values for opacity support
    const primaryColorRgb = darkMode ? '50, 205, 50' : '206, 9, 123'; // lime: rgb(50, 205, 50), #ce097b: rgb(206, 9, 123)

    const containerStyle = {
        '--bg-color': token.colorBgContainer,
        '--primary-color': badgeColor,
        '--primary-color-transparent': `rgba(${primaryColorRgb}, 0.3)`, // 30% opacity
        '--primary-color-glow': `rgba(${primaryColorRgb}, 0.2)`, // 20% opacity for glow
        '--primary-color-subtle': `rgba(${primaryColorRgb}, 0.1)`, // 10% opacity for subtle outer glow
        padding: 16,
        color: token.colorText,
    } as React.CSSProperties;

    return (
        <div
            className="flex flex-col gap-1 p-2 rounded-3xl shadow-xl animated-gradient-border"
            style={containerStyle}
        >
            <div className="w-[600px]">
                {/* Processing View - Shows when processing */}
                {step === 'processing' && (
                    <div className="shadow-sm" style={containerStyle}>
                        <ProcessingView
                            isStreaming={isStreaming}
                            streamedChunks={streamedChunks}
                            onBack={handleBack}
                            messages={EXTRACTION_INSTRUCTIONS.processingMessages}
                        />
                    </div>
                )}

                {/* Results View - Replaces processing when complete */}
                {step === 'results' && (
                    <>
                        <Divider size="small" />
                        <div className="shadow-sm" style={containerStyle}>
                            <ExtractionResults
                                extractedData={extractedData}
                                onBack={handleBack}
                                onComplete={handleComplete}
                                instructions={EXTRACTION_INSTRUCTIONS.resultsInstructions}
                            />
                        </div>
                    </>
                )}

                {/* Input View - Always visible */}
                <InputView
                    onExtract={handleExtract}
                    onCancel={onCancel}
                    browseWeb={useWebSearch}
                    setBrowseWeb={setUseWebSearch}
                    context={context}
                    setContext={setContext}
                />
            </div>
        </div>
    )

}

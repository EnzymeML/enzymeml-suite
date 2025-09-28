import { useState, useEffect } from "react";
import { message, theme } from "antd";
import { extractData, UserQuery } from "enzymeml";
import { ZodObject, ZodRawShape, z } from "zod";
import OpenAI from "openai";

import useAppStore from "@stores/appstore";
import useLLMStore from "@stores/llmstore";
import extractionPrompt from "@llm/prompts/extraction";
import { researchQuery } from "@llm/utils/queries";
import { ExtractionContext, ExtractionContextMap, ExtractionEnabledPaths } from "@suite-types/context";

import ProcessingView from "@llm/components/ProcessingView";
import ExtractionResults from "@llm/components/ExtractionResults";
import InputView from "@llm/components/InputView";
import { glowingContainerStyle } from "@llm/utils/containerstyle";
import { NotificationType } from "@suite/components/NotificationProvider";


// Instructions and content constants
const EXTRACTION_INSTRUCTIONS = {
    processingMessages: {
        streaming: "AI is processing your data...",
        complete: "Processing complete",
        waitingForResponse: "Waiting for response...",
        analyzing: "Analyzing content and extracting structured data"
    },

    resultsInstructions: {
        title: "Review Extracted Data",
        description: "Select the items you want to add to your collection",
        selectAll: "Select All",
        selectNone: "Clear Selection"
    }
};

interface ExtractionFlowProps<T extends ZodObject<ZodRawShape>, U = z.infer<T>> {
    onComplete: (items: U[]) => void;
    onCancel: () => void;
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

export default function ExtractionFlow<T extends ZodObject<ZodRawShape>, U = z.infer<T>>({
    onComplete,
    onCancel,
}: ExtractionFlowProps<T, U>) {
    // Local states
    const [step, setStep] = useState<ExtractionStep>('input');
    const [streamedChunks, setStreamedChunks] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [extractedData, setExtractedData] = useState<Array<{ data: U, description: string }>>([]);
    const [context, setContext] = useState<ExtractionContext<U, T> | null>(null);

    // Global states
    const llmModel = useLLMStore((state) => state.llmModel);
    const tools = useLLMStore((state) => state.tools);
    const useWebSearch = useLLMStore((state) => state.useWebSearch);
    const currentPath = useAppStore((state) => state.currentPath);
    const openNotification = useAppStore((state) => state.openNotification);

    // Effects
    useEffect(() => {
        if (currentPath && (currentPath as ExtractionEnabledPaths) in ExtractionContextMap) {
            setContext(ExtractionContextMap[currentPath as ExtractionEnabledPaths] as unknown as ExtractionContext<U, T>);
        } else {
            openNotification("Error", NotificationType.ERROR, "Current path does not support extraction");
        }
    }, [currentPath]);

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
            const inputQueries = [extractionPrompt, new UserQuery(input)];

            if (useWebSearch) {
                const additionalInformation = await researchQuery(client, input);
                console.log("additionalInformation", additionalInformation);
                inputQueries.push(new UserQuery(additionalInformation));
            }

            if (filePaths.length > 0) {
                inputQueries.push(new UserQuery(`File paths: ${filePaths.join(', ')}`));
            }

            if (!context) {
                openNotification("Error", NotificationType.ERROR, `Current path ${currentPath} is not in supported paths: ${Object.keys(ExtractionContextMap).join(', ')}`);
                return;
            }

            const { chunks, final } = await extractData({
                input: inputQueries,
                model: llmModel.value,
                multiple: true,
                schema: extendSchema(context.schema),
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

            // @ts-expect-error - finalData.output_parsed is not typed
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
        if (!context) {
            openNotification("Error", NotificationType.ERROR, `Current path ${currentPath} is not in supported paths: ${Object.keys(ExtractionContextMap).join(', ')}`);
            return;
        }

        onComplete(extractedData.map((item) => item.data));
        context.addFunction(extractedData.map((item) => item.data));
    };

    const handleBack = () => {
        setStep('input');
        setStreamedChunks("");
        setIsStreaming(false);
    };

    const { token } = theme.useToken();
    const darkMode = useAppStore((state) => state.darkMode);

    const containerStyle = glowingContainerStyle(darkMode, token);

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
                        <div className="shadow-sm" style={containerStyle}>
                            <ExtractionResults
                                extractedData={extractedData as Array<{ data: Record<string, unknown>, description: string }>}
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
                    context={context as ExtractionContext<U, T>}
                />
            </div>
        </div>
    )

}

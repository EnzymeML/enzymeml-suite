import { useState, useEffect } from "react";
import { Divider, message, theme } from "antd";
import { extractData, UserQuery } from "enzymeml";
import { ZodObject, ZodRawShape, z } from "zod";
import OpenAI from "openai";

import useAppStore from "@stores/appstore";
import useLLMStore from "@stores/llmstore";
import extractionPrompt from "@llm/prompts/extraction";
import { researchQuery } from "@llm/utils/queries";
import { ExtractionContext } from "@suite-types/context";

import ProcessingView from "@llm/components/ProcessingView";
import ExtractionResults from "@llm/components/ExtractionResults";
import InputView from "@llm/components/InputView";
import { ExtractedItem } from "@llm/components/ExtractedItemListItem";
import { glowingContainerStyle } from "@llm/utils/containerstyle";


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

interface ExtractionFlowProps<T extends ZodObject<ZodRawShape>, U = ZodObject<ZodRawShape>[]> {
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

export default function ExtractionFlow<T extends ZodObject<ZodRawShape>, U = ZodObject<ZodRawShape>[]>({
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
            const inputQueries = [extractionPrompt, new UserQuery(input)];

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
        // @ts-expect-error - extractedData is not typed
        onComplete(extractedData.map((item) => item.data));
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
                        <Divider size="small" />
                        <div className="shadow-sm" style={containerStyle}>
                            <ExtractionResults
                                extractedData={extractedData as ExtractedItem[]}
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

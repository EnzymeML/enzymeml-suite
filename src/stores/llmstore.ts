import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { SearchDatabaseTool, ToolDefinition } from 'enzymeml';

/**
 * Represents a language model option with its configuration details
 */
export type ModelOption = {
    /** Unique identifier for the model */
    value: string;
    /** Human-readable display name */
    label: string;
    /** Brief description of the model's capabilities and use cases */
    description: string;
}

/**
 * Available language model options with their configurations
 */
export const MODEL_OPTIONS: ModelOption[] = [
    {
        value: "gpt-4.1",
        label: "GPT-4.1",
        description: "Most capable for complex tasks."
    },
    {
        value: "gpt-4.1-mini",
        label: "GPT-4.1 Mini",
        description: "Faster, cost-effective version."
    },
    {
        value: "gpt-4o",
        label: "GPT-4o",
        description: "Advanced multimodal model."
    },
    {
        value: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Lightweight, balanced option."
    },
];

/**
 * Represents a tool option with its corresponding ToolDefinition, name, and description
 */
export interface ToolOption {
    tool: ToolDefinition;
    name: string;
    description: string;
}

/**
 * Available tool definitions for LLM function calling.
 * Maps tool names to their corresponding ToolDefinition objects from enzymeml.
 */
export const TOOL_OPTIONS: { [key: string]: ToolOption } = {
    /** Tool for searching and querying databases */
    search_databases: {
        tool: SearchDatabaseTool,
        name: "Search Databases",
        description: "Search and query databases for information"
    },
}

/**
 * State interface for the LLM store
 */
interface LLMState {
    // States
    /** Currently selected language model */
    llmModel: ModelOption
    /** Currently selected tools for function calling */
    tools: ToolDefinition[]
    /** Whether to use web search */
    useWebSearch: boolean
    // Actions
    /** Updates the selected language model and persists it to storage */
    setLLMModel: (llmModel: ModelOption) => void
    /** Adds a tool to the selected tools and persists to storage */
    addTool: (llmTool: ToolDefinition) => void
    /** Removes a tool from the selected tools and persists to storage */
    removeTool: (llmTool: ToolDefinition) => void
    /** Updates the use web search flag and persists it to storage */
    setUseWebSearch: (useWebSearch: boolean) => void
}

/**
 * Zustand store for managing language model selection and tool configuration.
 * Provides persistent storage through browser localStorage.
 * 
 * Features:
 * - Model selection with persistence across sessions
 * - Tool management for LLM function calling
 * - Automatic hydration from localStorage on app startup
 * - Fallback to sensible defaults when no stored values exist
 */
const useLLMStore = create<LLMState>()(
    devtools(
        persist(
            (set) => ({
                // States
                llmModel: MODEL_OPTIONS[0],
                tools: [TOOL_OPTIONS.search_databases.tool],
                useWebSearch: false,
                // Actions
                setLLMModel: (llmModel: ModelOption) => {
                    set({ llmModel });
                },
                addTool: (llmTool: ToolDefinition) => {
                    set((state) => {
                        const newTools = [...state.tools, llmTool];
                        return { tools: newTools };
                    });
                },
                removeTool: (llmTool: ToolDefinition) => {
                    set((state) => {
                        const newTools = state.tools.filter(tool => tool !== llmTool);
                        return { tools: newTools };
                    });
                },
                setUseWebSearch: (useWebSearch: boolean) => {
                    set({ useWebSearch });
                },
            }),
            {
                name: 'llm-storage',
                storage: {
                    getItem: (name: string) => {
                        const value = localStorage.getItem(name);
                        if (!value) return null;

                        try {
                            const parsed = JSON.parse(value);

                            if (parsed.state?.tools) {
                                parsed.state.tools = parsed.state.tools.map((toolName: string) => {
                                    const toolOption = TOOL_OPTIONS[toolName];
                                    return toolOption ? toolOption.tool : null;
                                }).filter(Boolean);
                            }

                            if (parsed.state?.llmModel && typeof parsed.state.llmModel === 'string') {
                                const foundModel = MODEL_OPTIONS.find(option => option.value === parsed.state.llmModel);
                                if (foundModel) {
                                    parsed.state.llmModel = foundModel;
                                }
                            }

                            if (parsed.state?.useWebSearch) {
                                parsed.state.useWebSearch = Boolean(parsed.state.useWebSearch);
                            }
                            return parsed;
                        } catch {
                            return null;
                        }
                    },
                    setItem: (name: string, value: any) => {
                        try {
                            const toStore = { ...value };

                            if (toStore.state?.tools) {
                                toStore.state.tools = toStore.state.tools.map((tool: ToolDefinition) => {
                                    const toolKey = Object.keys(TOOL_OPTIONS).find(key =>
                                        TOOL_OPTIONS[key].tool.specs.name === tool.specs.name
                                    );
                                    return toolKey;
                                }).filter(Boolean);
                            }

                            if (toStore.state?.llmModel) {
                                toStore.state.llmModel = toStore.state.llmModel.value;
                            }

                            if (toStore.state?.useWebSearch) {
                                toStore.state.useWebSearch = Boolean(toStore.state.useWebSearch);
                            }
                            localStorage.setItem(name, JSON.stringify(toStore));
                        } catch {
                            localStorage.setItem(name, JSON.stringify(value));
                        }
                    },
                    removeItem: (name: string) => localStorage.removeItem(name),
                },
            },
        ),
    ),
)


export default useLLMStore
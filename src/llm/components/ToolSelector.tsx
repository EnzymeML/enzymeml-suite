import useLLMStore, { TOOL_OPTIONS, ToolOption } from "@stores/llmstore";


/**
 * ToolSelector component that displays a list of available LLM tools
 * for the user to choose from. When a model is selected, it updates the
 * global LLM store and closes the selector.
 */
export default function ToolSelector() {
    return (
        <div className="flex flex-col gap-3">
            {Object.values(TOOL_OPTIONS).map((tool) => (
                <Tool tool={tool} />
            ))}
        </div>
    );
}

/**
 * Individual model option component that displays model information
 * and handles selection. Shows a checkbox to indicate current selection
 * state and displays the model's label and description.
 */
function Tool({ tool }: { tool: ToolOption }) {
    // Global actions
    const addTool = useLLMStore((state) => state.addTool);
    const removeTool = useLLMStore((state) => state.removeTool);
    const tools = useLLMStore((state) => state.tools);

    const isSelected = tools.includes(tool.tool);

    // Handles
    const handleSelect = () => {
        if (isSelected) {
            removeTool(tool.tool);
        } else {
            addTool(tool.tool);
        }
    }

    return (
        <div onClick={handleSelect} className="flex flex-row gap-3 m-2 cursor-pointer">
            <div className="flex flex-col">
                <p className="text-sm font-medium opacity-80">
                    {tool.name}
                    {isSelected && <span className="ml-2">✓</span>}
                </p>
                <p className="text-xs opacity-60">{tool.description}</p>
            </div>
        </div>
    );
}
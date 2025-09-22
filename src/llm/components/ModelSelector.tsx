import { ModelOption, MODEL_OPTIONS } from "../../stores/llmstore";
import useLLMStore from "../../stores/llmstore";


/**
 * Props for the individual Model component
 */
interface ModelProps {
    /** The model option to display */
    model: ModelOption;
    /** Function to control the visibility of the model selector */
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * ModelSelector component that displays a list of available LLM models
 * for the user to choose from. When a model is selected, it updates the
 * global LLM store and closes the selector.
 */
export default function ModelSelector(
    {
        setVisible
    }: {
        setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    }
) {
    return (
        <div className="flex flex-col gap-3">
            {MODEL_OPTIONS.map((model) => (
                <Model
                    model={model}
                    setVisible={setVisible}
                />
            ))}
        </div>
    );
}

/**
 * Individual model option component that displays model information
 * and handles selection. Shows a checkbox to indicate current selection
 * state and displays the model's label and description.
 */
function Model(
    {
        model,
        setVisible
    }: ModelProps
) {
    // Global actions
    const setLLMModel = useLLMStore((state) => state.setLLMModel);
    const llmModel = useLLMStore((state) => state.llmModel);

    const isSelected = model.value === llmModel.value;

    // Handles
    const handleSelect = () => {
        setLLMModel(model);
        setVisible(false);
    }

    return (
        <div onClick={handleSelect} className="m-2 cursor-pointer">
            <p className="text-sm font-medium opacity-80">
                {model.label}
                {isSelected && <span className="ml-2">✓</span>}
            </p>
            <p className="text-xs opacity-60">{model.description}</p>
        </div>
    );
}
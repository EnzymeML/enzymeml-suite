/**
 * ExtractModal - A headless modal overlay for data extraction workflows
 * 
 * This component provides a full-screen modal overlay that renders an ExtractionFlow
 * component. It handles modal behavior including:
 * - Escape key to close
 * - Click outside to close
 * - Body scroll locking when open
 * - Portal rendering to document.body
 * 
 * The modal is designed to be headless, meaning it doesn't provide its own
 * background styling - that's handled by the ExtractionFlow component.
 */

import { useEffect } from "react";
import ReactDOM from "react-dom";
import { theme } from "antd";

import ExtractionFlow from "@llm/ExtractionFlow";
import useLLMStore from "@suite/stores/llmstore";


/**
 * ExtractModal component
 * 
 * Renders a full-screen modal overlay containing an ExtractionFlow component.
 * The modal can be closed via Escape key or clicking outside the content area.
 * 
 * @template U - The type of items being extracted
 * @param props - Component props
 * @returns Portal-rendered modal or null if not visible
 */
export default function ExtractModal() {
    // Global states
    const extractionModalVisible = useLLMStore((state) => state.extractionModalVisible);

    // Global actions
    const setExtractionModalVisible = useLLMStore((state) => state.setExtractionModalVisible);

    /**
     * Handles successful completion of the extraction flow
     * Calls the addFunction with extracted items and closes the modal
     */
    const handleComplete = () => {
        setExtractionModalVisible(false);
    };

    /**
     * Handles cancellation of the extraction flow
     * Simply closes the modal without processing any items
     */
    const handleCancel = () => setExtractionModalVisible(false);

    const { token } = theme.useToken();

    // ---- headless overlay behavior (Esc close + scroll lock) ----
    useEffect(() => {
        if (!extractionModalVisible) return;

        // Handle Escape key to close modal
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExtractionModalVisible(false);
        window.addEventListener("keydown", onKey);

        // Lock body scroll when modal is open
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Cleanup function to restore previous state
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [extractionModalVisible, setExtractionModalVisible]);

    // Don't render anything if modal is not visible
    if (!extractionModalVisible) return null;

    const node = (
        <div
            role="dialog"
            aria-modal
            onMouseDown={(e) => {
                // Close modal when clicking on backdrop (not on content)
                if (e.target === e.currentTarget) handleCancel();
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "grid",
                placeItems: "center",
                background: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(1px)",
                borderRadius: token.borderRadiusLG,
            }}
        >
            {/* No background panel here — just render your flow */}
            <div
                style={{
                    background: "transparent"
                }}
            >
                <ExtractionFlow
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );

    // Render modal as portal to document.body to ensure proper z-index stacking
    return ReactDOM.createPortal(node, document.body);
}
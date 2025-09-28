// ExtractModal.tsx (headless overlay version)
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { ZodObject, ZodRawShape } from "zod";
import { theme } from "antd";

import { ExtractionContext } from "@suite-types/context";
import ExtractionFlow from "@llm/ExtractionFlow";

interface ExtractModelProps<T extends ZodObject<ZodRawShape>, U = ZodObject<ZodRawShape>[]> {
    visible: boolean;
    schema: T;
    setVisible: (visible: boolean) => void;
    addFunction: (items: U[]) => void;
    context: ExtractionContext;
}

export default function ExtractModal<T extends ZodObject<ZodRawShape>, U = ZodObject<ZodRawShape>[]>({
    visible,
    schema,
    setVisible,
    addFunction,
    context,
}: ExtractModelProps<T, U>) {
    const handleComplete = (items: U[]) => {
        addFunction(items);
        setVisible(false);
    };
    const handleCancel = () => setVisible(false);

    const { token } = theme.useToken();

    // ---- headless overlay behavior (Esc close + scroll lock) ----
    useEffect(() => {
        if (!visible) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setVisible(false);
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [visible, setVisible]);

    if (!visible) return null;

    const node = (
        <div
            role="dialog"
            aria-modal
            onMouseDown={(e) => {
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
                    schema={schema}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    parentContext={context}
                />
            </div>
        </div>
    );


    return ReactDOM.createPortal(node, document.body);
}
import { useImperativeHandle, forwardRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { FloatButton } from "antd";

import useLLMStore from "@suite/stores/llmstore";

interface FloatingCreateProps {
    handleCreate: () => void;
    type: string;
}

export interface FloatingCreateRef {
    openExtractModal: () => void;
    closeExtractModal: () => void;
    toggleExtractModal: () => void;
    isExtractModalVisible: () => boolean;
}

const FloatingCreate = forwardRef<FloatingCreateRef, FloatingCreateProps>(
    function FloatingCreate(
        {
            handleCreate,
            type,
        }: FloatingCreateProps,
        ref: React.Ref<FloatingCreateRef>
    ) {

        // Global states
        const extractionModalVisible = useLLMStore((state) => state.extractionModalVisible);

        // Global actions
        const setExtractionModalVisible = useLLMStore((state) => state.setExtractionModalVisible);

        // Expose modal control functions to parent components
        useImperativeHandle(ref, () => ({
            openExtractModal: () => setExtractionModalVisible(true),
            closeExtractModal: () => setExtractionModalVisible(false),
            toggleExtractModal: () => setExtractionModalVisible(!extractionModalVisible),
            isExtractModalVisible: () => extractionModalVisible,
        }));

        return (
            <FloatButton
                shape="circle"
                type="primary"
                icon={<PlusOutlined />}
                tooltip={
                    {
                        title: `Add ${type}`,
                        placement: "left"
                    }
                }

                onClick={handleCreate}
            />
        );
    });

export default FloatingCreate;
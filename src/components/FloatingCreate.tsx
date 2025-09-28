import { useState, useImperativeHandle, forwardRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { FloatButton } from "antd";
import { BsStars } from "react-icons/bs";
import { ZodObject, ZodRawShape } from "zod";

import ExtractModal from "@llm/ExtractModal";
import { ExtractionContext } from "@suite-types/context";

interface FloatingCreateProps<T extends ZodObject<ZodRawShape>, U> {
    handleCreate: () => void;
    type: string;
    schema?: T;
    addFunction?: (items: U[]) => void;
    context: ExtractionContext;
}

export interface FloatingCreateRef {
    openExtractModal: () => void;
    closeExtractModal: () => void;
    toggleExtractModal: () => void;
    isExtractModalVisible: () => boolean;
}

const FloatingCreate = forwardRef<FloatingCreateRef, FloatingCreateProps<ZodObject<ZodRawShape>, unknown>>(
    function FloatingCreate<T extends ZodObject<ZodRawShape>, U>(
        {
            handleCreate,
            type,
            schema,
            addFunction,
            context,
        }: FloatingCreateProps<T, U>,
        ref: React.Ref<FloatingCreateRef>
    ) {
        const [visible, setVisible] = useState(false);

        // Expose modal control functions to parent components
        useImperativeHandle(ref, () => ({
            openExtractModal: () => setVisible(true),
            closeExtractModal: () => setVisible(false),
            toggleExtractModal: () => setVisible(prev => !prev),
            isExtractModalVisible: () => visible,
        }));
        return (
            <>
                <FloatButton.Group
                    trigger="hover"
                    type="primary"
                    style={{ insetInlineEnd: 94 }}
                    icon={<PlusOutlined />}
                >
                    <FloatButton
                        shape="square"
                        type="default"
                        icon={<BsStars size={20} />}
                        tooltip={<div>From text</div>}
                        onClick={() => setVisible(true)}
                    />
                    <FloatButton
                        shape="square"
                        type="default"
                        icon={<PlusOutlined />}
                        tooltip={<div>Add {type}</div>}
                        onClick={handleCreate}
                    />
                </FloatButton.Group >
                {schema && addFunction && (
                    <ExtractModal
                        schema={schema as ZodObject<ZodRawShape>}
                        context={context}
                        visible={visible}
                        setVisible={setVisible}
                        addFunction={addFunction}
                    />
                )}
            </>
        );
    });

export default FloatingCreate;
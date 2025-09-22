import { LayoutGroup } from "framer-motion";
import React, { useCallback, memo } from "react";
import FloatingCreate, { FloatingCreateRef } from "./FloatingCreate.tsx";
import useAppStore from "../stores/appstore.ts";
import { ZodObject, ZodRawShape } from "zod";
import { ExtractionContext } from "../types/context.ts";

interface CollectionProps<T> {
  items: React.ReactNode[];
  handleCreateObject: () => Promise<string>;
  type: string;
  schema?: ZodObject<ZodRawShape>;
  addFunction?: (items: T[]) => void;
  floatingCreateRef?: React.RefObject<FloatingCreateRef>;
  context: ExtractionContext;
}

function Collection<T = any>({
  items,
  handleCreateObject,
  type,
  schema,
  addFunction,
  floatingCreateRef,
  context,
}: CollectionProps<T>) {
  if (items.length === 0) {
    return null;
  }

  // Actions
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  // Handlers
  const onCreate = useCallback(() => {
    handleCreateObject()
      .then((id) => {
        setSelectedId(id);
        console.log("Created from Collection. Setted selectedId to: ", id);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [handleCreateObject, setSelectedId]);

  return (
    <div className={"flex flex-col"} style={{ overflow: "hidden" }}>
      <FloatingCreate
        ref={floatingCreateRef}
        handleCreate={onCreate}
        type={type}
        schema={schema}
        addFunction={addFunction}
        context={context}
      />
      <LayoutGroup>{items.map((element) => element)}</LayoutGroup>
      <div className={"mb-72"} />
    </div>
  );
}

export default memo(Collection) as typeof Collection;

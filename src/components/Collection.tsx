import { LayoutGroup } from "framer-motion";
import React, { useCallback, memo } from "react";
import { ZodObject, ZodRawShape } from "zod";

import useAppStore from "@stores/appstore.ts";
import { ExtractionContext } from "@suite-types/context";

import FloatingCreate, { FloatingCreateRef } from "./FloatingCreate.tsx";

interface CollectionProps<T> {
  items: React.ReactNode[];
  handleCreateObject: () => Promise<string>;
  type: string;
  schema?: ZodObject<ZodRawShape>;
  addFunction?: (items: T[]) => void;
  floatingCreateRef?: React.RefObject<FloatingCreateRef>;
  context: ExtractionContext;
}

function Collection<T = unknown>({
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
        addFunction={addFunction as (items: unknown[]) => void}
        context={context}
      />
      <LayoutGroup>{items.map((element) => element)}</LayoutGroup>
      <div className={"mb-72"} />
    </div>
  );
}

export default memo(Collection) as typeof Collection;

import { LayoutGroup } from "framer-motion";
import React, { useCallback, memo } from "react";
import FloatingCreate from "./FloatingCreate.tsx";
import useAppStore from "../stores/appstore.ts";

interface CollectionProps {
  items: React.ReactNode[];
  handleCreateObject: () => Promise<string>;
  type: string;
}

const Collection = memo(function Collection({
  items,
  handleCreateObject,
  type,
}: CollectionProps) {
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
      <FloatingCreate handleCreate={onCreate} type={type} />
      <LayoutGroup>{items.map((element) => element)}</LayoutGroup>
      <div className={"mb-72"} />
    </div>
  );
});

export default Collection;

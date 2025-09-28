import { LayoutGroup } from "framer-motion";
import React, { useCallback, memo } from "react";

import useAppStore from "@stores/appstore.ts";

import FloatingCreate, { FloatingCreateRef } from "./FloatingCreate.tsx";
import { useTauriReRenderListener } from "@suite/hooks/useTauriListener.ts";

/**
 * Props for the Collection component
 * @template T - The type of items that can be added to the collection
 */
interface CollectionProps {
  /** Array of React nodes representing the collection items */
  items: React.ReactNode[];
  /** Function to handle creating a new object, returns a promise with the new object's ID */
  handleCreateObject: () => Promise<string>;
  /** String identifier for the type of objects in this collection */
  type: string;
  /** Optional ref to the FloatingCreate component for external control */
  floatingCreateRef?: React.RefObject<FloatingCreateRef>;
  /** Event name to listen to for re-renders */
  eventName?: string;
}

/**
 * Collection component that renders a list of items with a floating create button
 * and extraction modal functionality. Supports keyboard shortcuts for toggling
 * the extraction modal when items are present.
 * 
 * @template T - The type of items that can be added to the collection
 * @param props - The collection props
 * @returns JSX element or null if no items are present
 */
function Collection({
  items,
  handleCreateObject,
  type,
  floatingCreateRef,
  eventName,
}: CollectionProps) {
  // Don't render anything if there are no items
  if (items.length === 0) {
    return null;
  }

  // Actions
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  // Effects
  // Re-render when the event is triggered
  useTauriReRenderListener(eventName || "");


  // Handlers
  /**
   * Handles the creation of a new object
   * Creates the object and sets it as selected in the app store
   */
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
      />
      <LayoutGroup>{items.map((element) => element)}</LayoutGroup>
      <div className={"mb-72"} />
    </div>
  );
}

export default memo(Collection) as typeof Collection;

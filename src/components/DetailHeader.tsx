import React, { useCallback, useMemo } from "react";
import CardHeader from "./CardHeader.tsx";
import DetailButtons from "./DetailButtons.tsx";

import useAppStore from "@stores/appstore.ts";

export interface DetailHeaderProps {
  id: string;
  speciesName: string;
  placeholder: string;
  handleDeleteObject: (id: string) => void;
  setLocked: React.Dispatch<React.SetStateAction<boolean>>;
  saveObject?: (id: string) => Promise<void>;
}

export default React.memo(function DetailHeader({
  id,
  speciesName,
  placeholder,
  handleDeleteObject,
  setLocked,
  saveObject,
}: DetailHeaderProps) {
  // Combine selectors into one to reduce potential re-renders
  const { selectedId, setSelectedId } = useAppStore(
    useMemo(
      () => (state) => ({
        selectedId: state.selectedId,
        setSelectedId: state.setSelectedId,
      }),
      []
    )
  );

  // Memoize click handler
  const handleClick = useCallback(() => {
    setSelectedId(id !== selectedId ? id : null);
  }, [id, selectedId, setSelectedId]);

  // Memoize lock handler
  const handleLock = useCallback(() => {
    setLocked((locked) => !locked);
  }, [setLocked]);

  // Memoize delete handler
  const handleDelete = useCallback(() => {
    handleDeleteObject(id);
  }, [handleDeleteObject, id]);

  // Save to db handler
  const handleSave = () => {
    if (saveObject) {
      saveObject(id);
    }
  };

  return (
    <div className={"flex flex-row justify-between cursor-pointer"}>
      <div className={"w-full h-full"} onClick={handleClick}>
        <CardHeader id={id} name={speciesName} placeholder={placeholder} />
      </div>
      <DetailButtons onLock={handleLock} onDelete={handleDelete} saveObject={handleSave} />
    </div>
  );
});

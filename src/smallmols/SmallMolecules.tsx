import "react-json-view-lite/dist/index.css";
import {
  addSmallMolecules,
  createSmallMolecule,
  deleteSmallMolecule,
  getSmallMolecule,
  listSmallMolecules,
  updateSmallMolecule,
} from "../commands/smallmols.ts";
import React, { useEffect, useState, useRef } from "react";
import DataProvider from "../components/DataProvider.tsx";
import { ChildProps } from "../types.ts";
import { SmallMolecule, SmallMoleculeSchema } from "enzymeml";
import EmptyPage from "../components/EmptyPage.tsx";
import Collection from "../components/Collection.tsx";
import DetailView from "../components/DetailView.tsx";
import SmallMoleculeForm from "./SmallMoleculeForm.tsx";
import { setCollectionIds } from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";
import { useTauriListener } from "../hooks/useTauriListener.ts";
import { saveMoleculeToDb } from "../commands/dbops.ts";
import { useExtractionModalShortcuts } from "../hooks/useKeyboardShortcuts.ts";
import { FloatingCreateRef } from "../components/FloatingCreate.tsx";
import { ExtractionContextEnum, ExtractionContexts } from "../types/context.ts";
import { ZodObject, ZodRawShape } from "zod";

// @ts-ignore
const SmallMoleculeContext = React.createContext<ChildProps<SmallMolecule>>({});

// Memoize the DetailView component to prevent unnecessary re-renders
const MemoizedDetailView = React.memo(DetailView);

// Create a memoized item component
const SmallMoleculeItem = React.memo(
  ({
    id,
    smallMolecules,
  }: {
    id: string;
    smallMolecules: [string, string][];
  }) => (
    <DataProvider<SmallMolecule>
      key={`small_mol_${id}`}
      targetKey={`small_mol_${id}`}
      id={id}
      fetchObject={getSmallMolecule}
      updateObject={updateSmallMolecule}
      deleteObject={deleteSmallMolecule}
      context={SmallMoleculeContext}
      saveObject={saveMoleculeToDb}
    >
      <div id={id}>
        <MemoizedDetailView
          // @ts-ignore for now
          context={SmallMoleculeContext}
          placeholder={"Small Molecule"}
          nameKey={"name"}
          // @ts-ignore for now
          FormComponent={SmallMoleculeForm}
          listOfIds={smallMolecules}
        />
      </div>
    </DataProvider>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.smallMolecules.length === nextProps.smallMolecules.length
    );
  }
);

export default function SmallMolecules() {
  // States
  const [smallMolecules, setSmallMolecules] = useState<[string, string][]>([]);
  const selectedId = useAppStore((state) => state.selectedId);

  // Ref for FloatingCreate component to access its methods
  const floatingCreateRef = useRef<FloatingCreateRef>(null);

  // State handlers
  const setState = React.useCallback(() => {
    setCollectionIds(listSmallMolecules, setSmallMolecules);
  }, []);

  // Fetch items on mount
  useEffect(() => setState(), [selectedId, setState]);
  useTauriListener("update_small_mols", setState);

  // Keyboard shortcuts for toggling extraction modal
  useExtractionModalShortcuts(() => {
    floatingCreateRef.current?.toggleExtractModal();
  }, smallMolecules.length > 0); // Only enable shortcuts when there are items (not on empty page)

  // Create the items for the Collapsible component
  const items = React.useMemo(
    () =>
      smallMolecules.map(([id]) => (
        <SmallMoleculeItem key={id} id={id} smallMolecules={smallMolecules} />
      )),
    [smallMolecules]
  );

  if (smallMolecules.length === 0) {
    return (
      <EmptyPage type={"Small Molecule"} handleCreate={createSmallMolecule} />
    );
  }

  return (
    <Collection<SmallMolecule>
      items={items}
      handleCreateObject={createSmallMolecule}
      type={"Small Molecule"}
      schema={SmallMoleculeSchema as unknown as ZodObject<ZodRawShape>}
      addFunction={addSmallMolecules}
      floatingCreateRef={floatingCreateRef}
      context={ExtractionContexts[ExtractionContextEnum.SMALL_MOLECULES]}
    />
  );
}

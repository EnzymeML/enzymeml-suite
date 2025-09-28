import React, { useEffect, useState, useRef } from "react";
import "react-json-view-lite/dist/index.css";
import { SmallMolecule } from "enzymeml";

import DataProvider from "@components/DataProvider";
import { ChildProps } from "@suite-types/types";
import EmptyPage from "@components/EmptyPage";
import Collection from "@components/Collection";
import DetailView from "@components/DetailView";
import { setCollectionIds } from "@tauri/listener";
import useAppStore from "@stores/appstore";
import { useRouterTauriListener } from "@hooks/useTauriListener";
import { saveMoleculeToDb } from "@commands/dbops";
import { FloatingCreateRef } from "@components/FloatingCreate";
import {
  createSmallMolecule,
  deleteSmallMolecule,
  getSmallMolecule,
  listSmallMolecules,
  updateSmallMolecule,
} from "@commands/smallmols";

import SmallMoleculeForm from "@smallmols/SmallMoleculeForm";

//@ts-expect-error - ChildProps is not typed
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
          // @ts-expect-error for now
          context={SmallMoleculeContext}
          placeholder={"Small Molecule"}
          nameKey={"name"}
          // @ts-expect-error for now
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
  useRouterTauriListener("update_small_mols", setState);

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
    <Collection
      items={items}
      handleCreateObject={createSmallMolecule}
      type={"Small Molecule"}
      floatingCreateRef={floatingCreateRef}
      eventName={"update_small_mols"}
    />
  );
}

import React, { ComponentType, useCallback, useEffect, useState } from "react";
import "react-json-view-lite/dist/index.css";
import DataProvider from "../components/DataProvider.tsx";
import { ChildProps } from "../types.ts";
import {
  createProtein,
  deleteProtein,
  getProtein,
  listProteins,
  updateProtein,
} from "../commands/proteins.ts";
import EmptyPage from "../components/EmptyPage.tsx";
import Collection from "../components/Collection.tsx";
import { Protein } from "enzymeml";
import ProteinForm from "./ProteinForm.tsx";
import DetailView from "../components/DetailView.tsx";
import { setCollectionIds } from "../tauri/listener.ts";
import { useTauriListener } from "../hooks/useTauriListener.ts";

// @ts-ignore
const ProteinContext = React.createContext<ChildProps<Vessel>>({});

// Memoize the DetailView component to prevent unnecessary re-renders
const MemoizedDetailView = React.memo(DetailView);

// Create a memoized item component
const ProteinItem = React.memo(
  ({ id, proteins }: { id: string; proteins: [string, string][] }) => (
    <DataProvider<Protein>
      key={`protein_${id}`}
      targetKey={`protein_${id}`}
      id={id}
      fetchObject={getProtein}
      updateObject={updateProtein}
      deleteObject={deleteProtein}
      context={ProteinContext}
    >
      <div id={id}>
        <MemoizedDetailView
          context={ProteinContext}
          placeholder={"Protein"}
          nameKey={"name"}
          FormComponent={
            ProteinForm as ComponentType<{
              context: typeof ProteinContext;
            }>
          }
          listOfIds={proteins}
        />
      </div>
    </DataProvider>
  )
);

export default function Proteins() {
  // States
  const [proteins, setProteins] = useState<[string, string][]>([]);

  // State handlers
  const setState = useCallback(() => {
    setCollectionIds(listProteins, setProteins);
  }, []);

  // Fetch items on mount
  useEffect(() => setState(), [setState]);
  useTauriListener("update_proteins", setState);

  // Create the items for the Collapsible component
  const items = React.useMemo(
    () =>
      proteins.map(([id]) => (
        <ProteinItem key={id} id={id} proteins={proteins} />
      )),
    [proteins]
  );

  if (proteins.length === 0) {
    return <EmptyPage type={"Protein"} handleCreate={createProtein} />;
  }

  return (
    <Collection
      items={items}
      handleCreateObject={createProtein}
      type={"Protein"}
    />
  );
}

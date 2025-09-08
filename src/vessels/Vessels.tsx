import "react-json-view-lite/dist/index.css";
import React, { ComponentType, useCallback, useEffect, useState } from "react";
import DataProvider from "../components/DataProvider.tsx";
import { Vessel } from "enzymeml";
import {
  createVessel,
  deleteVessel,
  getVessel,
  listVessels,
  updateVessel,
} from "../commands/vessels.ts";
import DetailView from "../components/DetailView.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import VesselForm from "./VesselForm.tsx";
import { setCollectionIds } from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";
import { useTauriListener } from "../hooks/useTauriListener.ts";

// @ts-ignore
const VesselContext = React.createContext<ChildProps<Vessel>>({});

// Memoize the DetailView component to prevent unnecessary re-renders
const MemoizedDetailView = React.memo(DetailView);

// Create a memoized item component
const VesselItem = React.memo(
  ({ id, vessels }: { id: string; vessels: [string, string][] }) => (
    <DataProvider<Vessel>
      key={`vessel_${id}`}
      targetKey={`vessel_${id}`}
      id={id}
      fetchObject={getVessel}
      updateObject={updateVessel}
      deleteObject={deleteVessel}
      context={VesselContext}
    >
      <div id={id}>
        <MemoizedDetailView
          context={VesselContext}
          placeholder={"Vessel"}
          nameKey={"name"}
          FormComponent={
            VesselForm as ComponentType<{ context: typeof VesselContext }>
          }
          listOfIds={vessels}
        />
      </div>
    </DataProvider>
  )
);

export default function Vessels() {
  // States
  const [vessels, setVessels] = useState<[string, string][]>([]);
  const selectedId = useAppStore((state) => state.selectedId);

  // State handlers
  const setState = useCallback(() => {
    setCollectionIds(listVessels, setVessels);
  }, []);

  // Fetch items on mount
  useEffect(() => setState(), [selectedId, setState]);
  useTauriListener("update_vessels", setState);

  // Create the items for the Collapsible component
  const items = React.useMemo(
    () =>
      vessels.map(([id]) => <VesselItem key={id} id={id} vessels={vessels} />),
    [vessels]
  );

  if (vessels.length === 0) {
    return <EmptyPage type={"Vessel"} handleCreate={createVessel} />;
  }

  return (
    <Collection
      items={items}
      handleCreateObject={createVessel}
      type={"Vessel"}
    />
  );
}

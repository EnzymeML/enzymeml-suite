import "./style.css";
import React, { ComponentType, useCallback, useEffect, useState } from "react";
import { Measurement } from "enzymeml";

import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  listMeasurements,
  updateMeasurement,
} from "@commands/measurements";
import DataProvider from "@components/DataProvider";
import useAppStore from "@stores/appstore";
import DetailView from "@components/DetailView";
import Collection from "@components/Collection";
import EmptyPage from "@components/EmptyPage";
import MeasurementForm from "@measurements/MeasurementForm";
import { setCollectionIds } from "@tauri/listener";
import { useRouterTauriListener } from "@hooks/useTauriListener";

// @ts-expect-error - ChildProps is not typed
const MeasurementContext = React.createContext<ChildProps<Measurement>>({});

export default function Measurements() {
  // States
  const [measurements, setMeasurements] = useState<[string, string][]>([]);
  const selectedId = useAppStore((state) => state.selectedId);

  // State handlers
  const setState = useCallback(() => {
    setCollectionIds(listMeasurements, setMeasurements);
  }, []);

  // Initial fetch
  useEffect(() => {
    setState();
  }, [selectedId]);

  // Listen for updates only when component is mounted and visible
  useRouterTauriListener("update_measurements", setState);

  // Create the items for the Collapsible component
  const items = measurements.map(([id]) => {
    return (
      <DataProvider<Measurement>
        key={`measurement_${id}`}
        targetKey={`measurement_${id}`}
        id={id}
        fetchObject={getMeasurement}
        updateObject={updateMeasurement}
        deleteObject={deleteMeasurement}
        context={MeasurementContext}
      >
        <div id={id}>
          <DetailView
            context={MeasurementContext}
            placeholder={"Measurement"}
            nameKey={"name"}
            FormComponent={
              MeasurementForm as ComponentType<{
                context: typeof MeasurementContext;
              }>
            }
            listOfIds={measurements}
          />
        </div>
      </DataProvider>
    );
  });

  if (measurements.length === 0) {
    return <EmptyPage type={"Measurement"} handleCreate={createMeasurement} />;
  }

  return (
    <Collection
      items={items}
      handleCreateObject={createMeasurement}
      type={"Measurement"}
    />
  );
}

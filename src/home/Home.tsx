import React, { useEffect, useState, useCallback } from "react";

import {
  EnzymeMLState,
  getState,
} from "@commands/dataio.ts";
import NotificationProvider from "@components/NotificationProvider.tsx";
import { useRouterTauriListener } from "@suite/hooks/useTauriListener";

import HomeOverviewTable from "./components/HomeOverviewTable";

/**
 * Home component serves as the main dashboard page of the application.
 * 
 * This component provides:
 * - A comprehensive overview of all items in the current EnzymeML document
 * - Real-time synchronization with the backend document state
 * - Navigation handling for item selection
 * - Notification management for user feedback
 * 
 * The component automatically fetches and maintains the current document state,
 * listening for updates via Tauri events to ensure the UI stays synchronized
 * with any backend changes.
 * 
 * @returns JSX element containing the home dashboard
 */
export default function Home() {
  // States
  const [, setCurrentDoc] = useState<EnzymeMLState | null>(null);

  /**
   * Fetches the current document state from the backend.
   * Updates the local state with the retrieved EnzymeML document information.
   */
  const fetchState = useCallback(async () => {
    try {
      const state = await getState();
      setCurrentDoc(state);
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  }, []);

  /**
   * Combined data fetching function that orchestrates all data retrieval operations.
   * Currently focuses on document state but can be extended for additional data sources.
   */
  const fetchAllData = useCallback(() => {
    fetchState();
  }, [fetchState]);

  // Effects
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Listen for updates from the backend to keep the UI synchronized
  useRouterTauriListener("update_document", fetchAllData, [fetchAllData]);

  /**
   * Handles item selection from the overview table.
   * Currently logs the selection but can be extended to include navigation logic.
   * 
   * @param id - The unique identifier of the selected item
   * @param type - The type of the selected item (e.g., "Small Molecule", "Protein")
   * @param route - The route path associated with the item type
   */
  const handleItemSelect = (id: string, type: string, route: string) => {
    console.log(`Selected ${type} with ID: ${id}, navigating to: ${route}`);
    // Navigation logic can be added here if needed
  };

  return (
    <NotificationProvider>
      <div className="overflow-auto h-full">
        {/* Overview Table - Full width with padding */}
        <HomeOverviewTable onItemSelect={handleItemSelect} />
      </div>
    </NotificationProvider>
  );
}

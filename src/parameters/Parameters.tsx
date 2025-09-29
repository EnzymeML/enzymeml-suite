import { useCallback, useEffect, useState } from "react";
import { Parameter } from "enzymeml";
import { setCollectionIds } from "@tauri/listener";
import useAppStore from "@stores/appstore";
import { useRouterTauriListener } from "@hooks/useTauriListener";
import ParameterTable from "@suite/parameters/components/ParameterTable";
import {
    getParameter,
    listAllParametersIds,
} from "@commands/parameters";

/**
 * Parameters component that displays and manages all parameters in the EnzymeML document.
 * 
 * This component provides a comprehensive view of all parameters including their symbols,
 * values, bounds, and allows for inline editing of parameter properties. Parameters are
 * automatically synchronized with the backend and updated in real-time.
 * 
 * Features:
 * - Displays all parameters in a sortable table format
 * - Inline editing of initial values, upper bounds, and lower bounds
 * - Real-time synchronization with backend updates
 * - Loading states and error handling
 * - Automatic refresh on parameter updates from other parts of the application
 * 
 * @returns JSX element containing the parameter management interface
 */
export default function Parameters() {
    // States
    /** Array of parameter ID tuples for collection management */
    const [, setParameters] = useState<[string, string][]>([]);
    /** Complete parameter objects with all details */
    const [allParameters, setAllParameters] = useState<Parameter[]>([]);
    /** Loading state for async operations */
    const [loading, setLoading] = useState(true);
    /** Currently selected item ID from global app state */
    const selectedId = useAppStore((state) => state.selectedId);

    /**
     * Fetches all parameter data from the backend.
     * 
     * This function retrieves parameter IDs first, then fetches detailed information
     * for each parameter in parallel. Handles loading states and error conditions.
     * 
     * @returns Promise that resolves when all parameter data is fetched
     */
    const fetchAllParameters = useCallback(async () => {
        setLoading(true);
        try {
            const parameterIds = await listAllParametersIds();
            setParameters(parameterIds);

            // Fetch all parameter details in parallel for better performance
            const parameterPromises = parameterIds.map(([id]) => getParameter(id));
            const parameterData = await Promise.all(parameterPromises);

            setAllParameters(parameterData);
        } catch (error) {
            console.error("Error fetching parameters:", error);
            setAllParameters([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Listen for parameter updates from Tauri events
    useRouterTauriListener("update_parameters", fetchAllParameters);

    /**
     * Sets up the component state by initializing collection IDs and fetching data.
     * 
     * This function is called on component mount and when dependencies change.
     * It ensures the parameter collection is properly registered and data is loaded.
     */
    const setState = useCallback(() => {
        setCollectionIds(listAllParametersIds, setParameters);
        fetchAllParameters();
    }, [fetchAllParameters]);

    // Initialize component state on mount and when selectedId changes
    useEffect(() => setState(), [selectedId, setState]);
    // Listen for parameter updates to keep data synchronized
    useRouterTauriListener("update_parameters", setState);

    return (
        <ParameterTable
            parameters={allParameters}
            loading={loading}
        />
    );
}
import { useCallback, useEffect, useState } from "react";
import { Parameter } from "enzymeml";
import { setCollectionIds } from "@tauri/listener";
import useAppStore from "@stores/appstore";
import { useRouterTauriListener } from "@hooks/useTauriListener";
import ParameterTable from "@modelling/components/ParameterTable";
import {
    getParameter,
    listAllParametersIds,
} from "@commands/parameters";

export default function Parameters() {
    // States
    const [parameters, setParameters] = useState<[string, string][]>([]);
    const [allParameters, setAllParameters] = useState<Parameter[]>([]);
    const [loading, setLoading] = useState(true);
    const selectedId = useAppStore((state) => state.selectedId);

    console.log(parameters);

    // Fetch all parameter data
    const fetchAllParameters = useCallback(async () => {
        setLoading(true);
        try {
            const parameterIds = await listAllParametersIds();
            setParameters(parameterIds);

            // Fetch all parameter details
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

    // State handlers
    const setState = useCallback(() => {
        setCollectionIds(listAllParametersIds, setParameters);
        fetchAllParameters();
    }, [fetchAllParameters]);

    // Fetch items on mount
    useEffect(() => setState(), [selectedId, setState]);
    useRouterTauriListener("update_parameters", setState);

    return (
        <ParameterTable
            parameters={allParameters}
            loading={loading}
            onRefresh={fetchAllParameters}
        />
    );
}
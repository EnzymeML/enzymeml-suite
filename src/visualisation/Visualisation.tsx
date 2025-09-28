import useVizStore from "../stores/vizstore.ts";
import { useEffect, useState } from "react";
import { getMeasurement, listMeasurements } from "../commands/measurements.ts";
import { getBadgeColor } from "../components/CardHeader.tsx";
import LineChart from "../components/LineChart.tsx";
import { getDataPoints, VisData } from "../commands/visualisation.ts";
import { Badge, Select, Space, theme } from "antd";
import type { SelectProps } from 'antd';
import useAppStore from "../stores/appstore.ts";

/**
 * Visualisation component that displays measurement data in a line chart format.
 * 
 * This component provides:
 * - A dropdown menu to select from available measurements
 * - Dynamic loading of measurement data and visualization
 * - Integration with the visualization store for state management
 * - Responsive styling that adapts to dark/light mode
 * 
 * @returns JSX element containing the visualization interface, or null if no measurement is selected
 */
export default function Visualisation() {

    // States
    /** The visualization data for the selected measurement */
    const [data, setData] = useState<VisData | null>(null)
    /** The name of the currently selected measurement */
    const [measurementName, setMeasurementName] = useState<string | null>(null)
    /** List of all available measurements as [id, name] tuples */
    const [measurements, setMeasurements] = useState<[string, string][]>([])
    /** Currently selected measurement ID from the viz store */
    const selectedMeasId = useVizStore(state => state.selectedMeasurement);
    /** Function to update the selected measurement in the viz store */
    const setSelectedMeasurement = useVizStore(state => state.setSelectedMeasurement);
    /** Current dark mode state from the app store */
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const { token } = theme.useToken();

    /**
     * Creates options for the measurement select dropdown.
     * Each option displays the measurement name with its ID as the value.
     * 
     * @returns Array of options for the Ant Design Select component
     */
    const createSelectOptions = (): SelectProps['options'] => {
        return measurements.map(([id, name]) => ({
            label: (
                <div className="flex flex-row gap-2 items-center">
                    <Badge count={id} size="small" color={getBadgeColor(darkMode)} />
                    <span>{name}</span>
                </div>
            ),
            value: id,
        }));
    };

    const options = createSelectOptions();

    const handleChange = (value: string) => {
        setSelectedMeasurement(value);
    };

    // Effects
    /**
     * Effect to fetch all available measurements on component mount.
     * Populates the measurements state for the dropdown menu.
     */
    useEffect(() => {
        // Fetch all measurements for the dropdown
        listMeasurements().then((measurementList) => {
            setMeasurements(measurementList);
        }).catch((err) => {
            console.error('Error fetching measurements:', err);
        });
    }, []);

    /**
     * Effect to load measurement data when a measurement is selected.
     * Fetches both the measurement metadata (name) and the visualization data points.
     */
    useEffect(() => {
        if (!selectedMeasId) {
            return;
        }
        // Set the name
        getMeasurement(selectedMeasId).then(
            (data) => {
                setMeasurementName(data.name);
            }
        )

        // Set the data
        getDataPoints(selectedMeasId).then(
            (data) => {
                setData(data);
            }
        ).catch(
            (err) => {
                console.error(err);
            }
        )

    }, [selectedMeasId]);

    // Early returns for loading states
    if (!measurementName) {
        return null;
    }

    if (!selectedMeasId) {
        return null;
    }

    return (
        <div className={"py-2 w-full h-full shadow-sm"}
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: 0,
                borderBottomLeftRadius: token.borderRadiusLG,
                borderBottomRightRadius: token.borderRadiusLG,
                borderBottom: 1,
                borderStyle: 'solid',
                borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
            }}
        >
            {/* Measurement selector */}
            <div className={"my-2 ml-12"}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                        style={{ width: 300 }}
                        placeholder="Select a measurement"
                        value={selectedMeasId}
                        onChange={handleChange}
                        options={options}
                    />
                </Space>
            </div>
            {/* Line chart visualization */}
            {data && <LineChart data={data} />}
        </div>
    )
}
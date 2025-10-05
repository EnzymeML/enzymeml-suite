import { Typography, Tag } from "antd";
import { getSourceColor, getSourceDisplayName } from "@jupyter/utils";
import { PythonInstallation } from "@commands/jupyter";

const { Text } = Typography;

/**
 * PythonMenuItem component that displays a Python installation
 * 
 * @param python - The Python installation to display
 * @returns JSX element containing the Python installation details
 */
export default function PythonMenuItem({ python }: { python: PythonInstallation }) {
    return (
        <div className="flex flex-col gap-1 py-1">
            <div className="flex gap-2 items-center">
                <Text strong>{python.version}</Text>
                <Tag color={getSourceColor(python.source)} style={{ margin: 0 }}>
                    {getSourceDisplayName(python.source)}
                </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '9px' }} ellipsis>
                {python.path}
            </Text>
        </div>
    );
}
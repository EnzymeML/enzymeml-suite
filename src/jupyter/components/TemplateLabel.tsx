import { BookOutlined, CalculatorOutlined, BranchesOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { Divider, Tooltip } from 'antd';


/**
 * Icon mapping for different template categories
 * Maps category names to their corresponding Ant Design icons
 */
const ICON_MAP = {
    'Basic': <BookOutlined />,
    'Parameter Estimation': <CalculatorOutlined />,
    'Machine Learning': <BranchesOutlined />,
    'Simulation': <PlaySquareOutlined />,
}

/**
 * Props interface for TemplateLabel component
 * 
 * @interface TemplateLabelProps
 * @property {string} name - Template or category name
 * @property {string} description - Template description for tooltip
 * @property {string} [groupName] - Optional group name for category headers
 */
interface TemplateLabelProps {
    name: string;
    description: string;
    groupName?: string;
}

/**
 * TemplateLabel component for rendering template items in the dropdown
 * 
 * Renders either a category group header with an icon or an individual
 * template item with a tooltip containing the description.
 * 
 * @param {TemplateLabelProps} props - Template label properties
 * @param {string} props.name - Template or category name
 * @param {string} [props.groupName] - If provided, renders as category header
 * @param {string} props.description - Template description for tooltip
 * @returns {JSX.Element} Rendered label component
 */
export default function TemplateLabel(
    {
        name,
        groupName,
        description
    }: TemplateLabelProps) {
    // Render category group header with icon
    if (groupName) {
        return (
            <div className="flex flex-col mt-2">
                <div className="flex flex-row gap-2">
                    {ICON_MAP[groupName as keyof typeof ICON_MAP]}
                    <p className="text-xs font-medium">
                        {groupName}
                    </p>
                </div>
                <Divider size="small" style={{ marginBottom: 0 }} />
            </div>
        )
    }

    // Render individual template item with tooltip
    return (
        <Tooltip
            className="text-justify"
            title={
                <p className="p-1 w-full text-xs font-light">
                    {description}
                </p>
            }
            placement="left"
            styles={{
                body: {
                    marginTop: "38px",
                    marginRight: "35px",
                    borderRadius: "10px"
                }
            }}
        >
            <p className={`ml-4 text-xs font-light text-justify`}>
                {name}
            </p>
        </Tooltip>

    )
}
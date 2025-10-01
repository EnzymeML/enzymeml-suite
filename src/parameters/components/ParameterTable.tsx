import React from "react"
import { useMemo } from "react"
import {
    Card,
    ConfigProvider,
    theme,
    Form,
    InputNumber,
    Table,
    Tooltip,
    Tag,
} from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import type { GetProps, GlobalToken, TableColumnsType } from "antd"
import type { Parameter } from "enzymeml"

import LatexRenderer from "@components/LatexRenderer"
import { partialUpdateParameter } from "@commands/parameters"
import useAppStore from "@stores/appstore"

type InputNumberProps = GetProps<typeof InputNumber>

/**
 * Extended parameter type that includes additional metadata for table display
 */
type ParameterRow = Parameter & {
    /** Indicates if this parameter is global across all reactions */
    is_global?: boolean
    /** Array of reaction IDs that use this parameter */
    reaction_ids?: string[]
}

/**
 * Props for the ParameterTable component
 */
interface ParameterTableProps {
    /** Array of parameters to display in the table */
    parameters: ParameterRow[]
    /** Loading state indicator */
    loading: boolean
    /** Optional callback to refresh data after updates */
    onRefresh?: () => Promise<void>
}

/**
 * Formats numeric values for display in input fields
 * 
 * @param v - The numeric value to format
 * @returns Formatted string representation of the value
 */
const numberFormatter: InputNumberProps["formatter"] = (v) =>
    v === undefined || v === null ? "" : String(v)

/**
 * Parses string input back to numeric values
 * 
 * @param v - The string value to parse
 * @returns Parsed numeric value, defaults to 0 for invalid input
 */
const numberParser: InputNumberProps["parser"] = (v) =>
    v === undefined || v === null ? 0 : Number(String(v).replace(/\s/g, ""))

/**
 * Generates CSS class names for table rows with zebra striping and border handling
 * 
 * @param _ - Unused record parameter
 * @param idx - Current row index
 * @param maxIndex - Total number of rows
 * @returns CSS class name string for the row
 */
const rowClassName = (_: unknown, idx: number, maxIndex: number) => {
    let className = "param-row"
    if (idx % 2 === 0) {
        className += " param-row--zebra"
    }

    if (idx === maxIndex - 1) {
        className += " border-none"
    }

    return className
}

/** Consistent cell padding for all table cells */
const cellPadding = { padding: "8px 12px" }

/**
 * Renders a column title with an info tooltip
 * 
 * @param props - Component props
 * @param props.title - The column title text
 * @param props.tooltip - Tooltip text to display on hover
 * @param props.token - Ant Design theme token for styling
 * @returns JSX element with title and info icon
 */
function ColumnTitle({ title, tooltip, token }: {
    title: string
    tooltip: string
    token: GlobalToken
}) {
    return (
        <span style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
        }}>
            {title}
            <Tooltip title={<span className="text-sm">{tooltip}</span>}>
                <InfoCircleOutlined style={{
                    color: token.colorTextSecondary,
                    fontSize: "12px"
                }} />
            </Tooltip>
        </span>
    )
}

/**
 * Formats numeric values for display, using scientific notation only for very large or very small numbers
 * 
 * @param value - The numeric value to format
 * @returns Formatted string representation of the value
 */
const formatValue = (value: number): string => {
    if (!Number.isFinite(value)) return "0"

    const absValue = Math.abs(value)

    // Use scientific notation for very large or very small numbers
    if (absValue >= 10000 || (absValue > 0 && absValue < 0.0001)) {
        return value.toExponential(3)
    }

    // Use regular decimal notation for numbers in the normal range, truncated to 3 decimals
    return Number(value.toFixed(3)).toString()
}

/**
 * Formats parameter symbols for display by adding underscores before trailing numbers
 * 
 * @param symbol - The parameter symbol to format
 * @returns LaTeX-formatted symbol string with proper subscript notation
 */
const formatSymbolForDisplay = (symbol: string): string => {
    // If symbol subscript is grater 1 and contains numbers, wrap in braces
    if (symbol.includes('_') && symbol.slice(1).includes('\\d')) {
        return symbol.charAt(0) + '_{' + symbol.slice(1) + '}'
    }

    // If symbol already contains underscore or is single character, return as-is
    if (symbol.includes('_') || symbol.length <= 1) {
        return symbol
    }

    // Add underscore after first character for symbols longer than 1 character
    const subscript = symbol.slice(1)
    if (subscript.length > 1) {
        return symbol.charAt(0) + '_{' + subscript + '}'
    } else {
        return symbol.charAt(0) + '_' + subscript
    }
}

/**
 * ParameterTable component displays parameters in an editable table format.
 * 
 * This component provides a comprehensive interface for viewing and editing parameter data:
 * 
 * Features:
 * - Displays parameter symbols using LaTeX rendering for mathematical notation
 * - Shows current values with color-coded tags (green for positive values)
 * - Provides inline editing for initial values, upper bounds, and lower bounds
 * - Supports sorting by numeric values in all columns
 * - Auto-saves changes on blur or Enter key press
 * - Responsive design with consistent styling and zebra striping
 * - Theme-aware styling that adapts to dark/light mode
 * - Form validation to ensure numeric inputs
 * - Tooltips for column headers explaining each field's purpose
 * 
 * The table uses Ant Design components with custom styling and integrates with
 * the EnzymeML backend for parameter updates. Changes are automatically saved
 * and the parent component is refreshed to reflect updates.
 * 
 * @param props - Component props
 * @param props.parameters - Array of parameters to display in the table
 * @param props.loading - Loading state indicator for the table
 * @param props.onRefresh - Optional callback to refresh data after updates
 * @returns Rendered parameter table wrapped in a themed card container
 */
const ParameterTable: React.FC<ParameterTableProps> = ({
    parameters,
    loading,
    onRefresh,
}) => {
    const darkMode = useAppStore((s) => s.darkMode)
    const [form] = Form.useForm()

    // Styling
    const { token } = theme.useToken()

    /**
     * Creates initial form values mapping for all editable fields
     * This ensures the form is properly initialized with current parameter values
     * 
     * @returns Object mapping form field names to their initial values
     */
    const initialValues = useMemo(() => {
        const obj: Record<string, unknown> = {}
        parameters.forEach((p) => {
            obj[`${p.id}.initial_value`] = p.initial_value
            obj[`${p.id}.upper_bound`] = p.upper_bound
            obj[`${p.id}.lower_bound`] = p.lower_bound
        })
        return obj
    }, [parameters])

    /**
     * Container styling with theme-aware colors and borders
     * Adapts to dark/light mode and provides consistent visual appearance
     */
    const containerStyle = React.useMemo(
        () => ({
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            border: 0,
            borderBottomLeftRadius: token.borderRadiusLG,
            borderBottomRightRadius: token.borderRadiusLG,
            borderBottom: 1,
            borderStyle: "solid",
            borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
        }),
        [token, darkMode]
    )

    /**
     * Saves a single numeric field value to the backend
     * 
     * This function handles the persistence of parameter field updates.
     * It validates the input value and only saves if it's a valid number.
     * After saving, it triggers a refresh to update the UI with the latest data.
     * 
     * @param id - Parameter ID to update
     * @param field - Field name to update (initial_value, upper_bound, or lower_bound)
     * @param value - New numeric value to save
     */
    const saveField = async (
        id: string,
        field: "initial_value" | "upper_bound" | "lower_bound",
        value?: number
    ) => {
        if (value === undefined || Number.isNaN(value)) return
        await partialUpdateParameter(id, field, value)
        await onRefresh?.()
    }

    /**
     * Editable number input component for parameter fields
     * 
     * This component provides inline editing functionality for numeric parameter fields.
     * It includes form validation, auto-save on blur/enter, and proper formatting.
     * The component only saves when the value has actually changed to avoid unnecessary updates.
     * 
     * @param props - Component props
     * @param props.id - Parameter ID
     * @param props.field - Field name being edited
     * @param props.value - Current field value
     * @returns Form item with number input for inline editing
     */
    const EditableNumber: React.FC<{
        id: string
        field: "initial_value" | "upper_bound" | "lower_bound"
        value?: number
    }> = ({ id, field, value }) => (
        <Form.Item
            name={`${id}.${field}`}
            initialValue={value}
            style={{ margin: 0 }}
            rules={[{
                validator: (_, v) => (
                    v === undefined || Number.isNaN(v)
                        ? Promise.reject("Enter a number")
                        : Promise.resolve()
                )
            }]}
        >
            <InputNumber
                size="small"
                className="text-xs"
                controls={false}
                style={{ width: "60%" }}
                formatter={numberFormatter}
                parser={numberParser}
                placeholder="-"
                onPressEnter={(e) => {
                    const v = (e.target as HTMLInputElement).value
                    saveField(id, field, Number(v))
                }}
                onBlur={(e) => {
                    const v = (e.target as HTMLInputElement).value
                    // Only save if value has changed
                    if (String(v) !== String(value ?? "")) {
                        saveField(id, field, Number(v))
                    }
                }}
            />
        </Form.Item>
    )

    /**
     * Table column definitions with sorting and rendering logic
     * 
     * Defines the structure and behavior of each table column:
     * - Symbol: LaTeX-rendered mathematical symbols
     * - Value: Color-coded current parameter values
     * - Initial Guess: Editable starting values for optimization
     * - Upper Bound: Editable maximum constraints
     * - Lower Bound: Editable minimum constraints
     * 
     * All numeric columns support sorting and have consistent styling.
     */
    const columns: TableColumnsType<ParameterRow> = [
        {
            title: (
                <ColumnTitle
                    title="Symbol"
                    tooltip="Mathematical symbol representing the parameter in equations"
                    token={token}
                />
            ),
            dataIndex: "symbol",
            key: "symbol",
            width: "20%",
            align: "center",
            ellipsis: true,
            onCell: () => ({ style: cellPadding }),
            render: (text: string) => <LatexRenderer equation={formatSymbolForDisplay(text)} inline />,
        },
        {
            title: (
                <ColumnTitle
                    title="Value"
                    tooltip="Current estimated value of the parameter after optimization"
                    token={token}
                />
            ),
            dataIndex: "value",
            key: "value",
            width: "20%",
            align: "center",
            ellipsis: true,
            onCell: () => ({ style: cellPadding }),
            sorter: (a, b) => (a.value || 0) - (b.value || 0),
            showSorterTooltip: false,
            render: (value: number) => (
                <Tag color={value > 0.0 ? "green" : "default"}>
                    {formatValue(value)}
                </Tag>
            ),
        },
        {
            title: (
                <ColumnTitle
                    title="Initial Guess"
                    tooltip="Starting value for parameter estimation. This is the initial guess used by the optimization algorithm"
                    token={token}
                />
            ),
            dataIndex: "initial_value",
            key: "initial_value",
            width: "20%",
            align: "center",
            onCell: () => ({ style: cellPadding }),
            sorter: (a, b) => (a.initial_value || 0) - (b.initial_value || 0),
            showSorterTooltip: false,
            render: (value: number, record) => (
                <EditableNumber id={record.id} field="initial_value" value={value} />
            ),
        },
        {
            title: (
                <ColumnTitle
                    title="Lower Bound"
                    tooltip="Minimum allowed value for this parameter during optimization"
                    token={token}
                />
            ),
            dataIndex: "lower_bound",
            key: "lower_bound",
            width: "20%",
            align: "center",
            onCell: () => ({ style: cellPadding }),
            sorter: (a, b) => (a.lower_bound || 0) - (b.lower_bound || 0),
            showSorterTooltip: false,
            render: (value: number, record) => (
                <EditableNumber id={record.id} field="lower_bound" value={value} />
            ),
        },
        {
            title: (
                <ColumnTitle
                    title="Upper Bound"
                    tooltip="Maximum allowed value for this parameter during optimization"
                    token={token}
                />
            ),
            dataIndex: "upper_bound",
            key: "upper_bound",
            width: "20%",
            align: "center",
            onCell: () => ({ style: cellPadding }),
            sorter: (a, b) => (a.upper_bound || 0) - (b.upper_bound || 0),
            showSorterTooltip: false,
            render: (value: number, record) => (
                <EditableNumber id={record.id} field="upper_bound" value={value} />
            ),
        },
    ]

    return (
        <ConfigProvider theme={{ token: { motion: false } }}>
            <Card
                style={containerStyle}
                styles={{
                    body: {
                        padding: 0,
                        borderRadius: token.borderRadiusLG
                    }
                }}
            >
                <Form
                    form={form}
                    initialValues={initialValues}
                    component={false} // Keep DOM clean
                >
                    <Table<ParameterRow>
                        columns={columns}
                        dataSource={parameters}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                        style={{ width: "100%" }}
                        rowClassName={(_, idx) => rowClassName(_, idx, parameters.length)}
                        onRow={() => ({
                            // Remove hover high-contrast effect for calmer look
                            className: "param-row--calm",
                        })}
                    />
                </Form>
            </Card>
        </ConfigProvider>
    )
}

export default ParameterTable
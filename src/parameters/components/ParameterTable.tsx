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
    is_global?: boolean
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
 */
const numberFormatter: InputNumberProps["formatter"] = (v) =>
    v === undefined || v === null ? "" : String(v)

/**
 * Parses string input back to numeric values
 */
const numberParser: InputNumberProps["parser"] = (v) =>
    v === undefined || v === null ? 0 : Number(String(v).replace(/\s/g, ""))

/**
 * Generates CSS class names for table rows with zebra striping and border handling
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
 * ParameterTable component displays parameters in an editable table format.
 * 
 * Features:
 * - Displays parameter symbols using LaTeX rendering
 * - Shows current values with color-coded tags
 * - Provides inline editing for initial values, upper bounds, and lower bounds
 * - Supports sorting by numeric values
 * - Auto-saves changes on blur or Enter key press
 * - Responsive design with consistent styling
 * 
 * @param props - Component props
 * @returns Rendered parameter table
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
     * @param id - Parameter ID
     * @param field - Field name to update
     * @param value - New numeric value
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
                controls={false}
                style={{ width: "40%" }}
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
            render: (text: string) => <LatexRenderer equation={text} inline />,
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
                    {Number.isFinite(value) ? value.toExponential(4) : "0"}
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
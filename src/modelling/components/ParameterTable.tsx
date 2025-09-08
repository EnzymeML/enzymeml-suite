"use client"

import type React from "react"
import { useState } from "react"
import { Table, Card, Typography, Button, theme } from "antd"
import type { Parameter } from "enzymeml"
import CardTitle from "../../components/CardTitle"
import EditableNumberCell from "./EditableNumberCell"
import { partialUpdateParameter } from "../../commands/parameters"
import LatexRenderer from "../../components/LatexRenderer"
import useAppStore from "../../stores/appstore"

const { Text } = Typography

interface ParameterTableProps {
    parameters: Parameter[]
    loading: boolean
    onRefresh?: () => Promise<void>
}

const ParameterTable: React.FC<ParameterTableProps> = ({
    parameters,
    loading,
    onRefresh
}) => {
    const [editingCells, setEditingCells] = useState<Set<string>>(new Set())

    // Styling
    const darkMode = useAppStore((state) => state.darkMode);

    // Function for saving parameter updates
    const handleSaveParameter = async (parameter: Parameter, field: string, value: number) => {
        await partialUpdateParameter(parameter.id, field, value)
        await onRefresh?.()
    }

    // Function for log-transforming all parameters
    const handleLogTransformAll = async () => {
        console.log("Setting all parameters to logarithmic transformation")
        // TODO: Connect to backend API when transformation support is added
        // Example: await updateAllParametersTransformation("logarithmic")
    }

    const createCellHandlers = (parameter: Parameter, field: string) => {
        const cellKey = `${parameter.id}-${field}`
        return {
            isEditing: editingCells.has(cellKey),
            onStartEdit: () => setEditingCells(prev => new Set(prev).add(cellKey)),
            onCancelEdit: () => setEditingCells(prev => {
                const newSet = new Set(prev)
                newSet.delete(cellKey)
                return newSet
            }),
            onSave: async (value: number) => {
                await handleSaveParameter(parameter, field, value)
                setEditingCells(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(cellKey)
                    return newSet
                })
            }
        }
    }

    const columns = [
        {
            title: "Symbol",
            dataIndex: "symbol",
            key: "symbol",
            width: "15%",
            align: "center" as const,
            render: (text: string) => (
                <LatexRenderer equation={text} inline={true} />
            ),
        },
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
            width: "20%",
            render: (value: number) => <Text code>{value.toExponential(4)}</Text>,
        },
        {
            title: "Initial Guess",
            dataIndex: "initial_value",
            key: "initial_value",
            width: "22%",
            render: (value: number, record: Parameter) => (
                <EditableNumberCell
                    field="initial_value"
                    value={value}
                    {...createCellHandlers(record, "initial_value")}
                />
            ),
        },
        {
            title: "Upper Bound",
            dataIndex: "upper_bound",
            key: "upper_bound",
            width: "22%",
            render: (value: number, record: Parameter) => (
                <EditableNumberCell
                    field="upper_bound"
                    value={value}
                    {...createCellHandlers(record, "upper_bound")}
                />
            ),
        },
        {
            title: "Lower Bound",
            dataIndex: "lower_bound",
            key: "lower_bound",
            width: "21%",
            render: (value: number, record: Parameter) => (
                <EditableNumberCell
                    field="lower_bound"
                    value={value}
                    {...createCellHandlers(record, "lower_bound")}
                />
            ),
        }
    ]

    return (
        <Card
            className="p-0 pb-10"
            title={
                <div className="flex justify-between items-center w-full">
                    <CardTitle title="Model Parameters" description="Configure the model parameters." />
                    <Button
                        type="primary"
                        size="small"
                        onClick={handleLogTransformAll}
                    >
                        Log-transform
                    </Button>
                </div>
            }
            bordered={darkMode}
            bodyStyle={{ padding: 0 }}
        >
            <Table
                columns={columns}
                dataSource={parameters}
                rowKey="key"
                loading={loading}
                pagination={false}
                scroll={{ x: "max-content" }}
                size="middle"
            />
        </Card>
    )
}

export default ParameterTable

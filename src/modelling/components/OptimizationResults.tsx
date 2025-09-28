import type React from "react"
import {
    Card,
    Tabs,
    Badge,
    Descriptions,
    Typography,
    Space,
    Button,
    theme,
    Tooltip
} from "antd"
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    QuestionCircleOutlined,
    SaveOutlined,
    PlayCircleOutlined
} from "@ant-design/icons"

import type { OptimizationResult, OptimizationFormValues } from "@modelling/types"
import CardTitle from "@components/CardTitle"
import useAppStore from "@stores/appstore"

const { TabPane } = Tabs
const { Text } = Typography

interface OptimizationResultsProps {
    result: OptimizationResult
    onRunOptimization: (values: OptimizationFormValues) => void
    onSaveToDocument: (values: OptimizationFormValues) => void
    loading: boolean
    formValues: OptimizationFormValues
}

const OptimizationResults: React.FC<OptimizationResultsProps> = ({
    result,
    onRunOptimization,
    onSaveToDocument,
    loading,
    formValues
}) => {
    // Styling
    const darkMode = useAppStore((state) => state.darkMode);
    const { token } = theme.useToken()

    const getStatusBadge = () => {
        switch (result.status) {
            case "success":
                return <Badge status="success" text="Success" />
            case "failure":
                return <Badge status="error" text="Failed" />
            case "running":
                return <Badge status="processing" text="Running" />
            default:
                return <Badge status="default" text="Idle" />
        }
    }

    const getStatusIcon = () => {
        switch (result.status) {
            case "success":
                return <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
            case "failure":
                return <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 24 }} />
            case "running":
                return <LoadingOutlined style={{ color: "#1890ff", fontSize: 24 }} />
            default:
                return <QuestionCircleOutlined style={{ color: "#d9d9d9", fontSize: 24 }} />
        }
    }

    const handleRunOptimization = () => {
        onRunOptimization(formValues)
    }

    const handleSaveToDocument = () => {
        onSaveToDocument(formValues)
    }

    return (
        <Card
            title={
                <CardTitle
                    title="Optimization Results"
                    description="Monitor and control your optimization process"
                />
            }
            bordered={darkMode}
            style={{ minHeight: "400px", height: "100%" }}
            size="small"
            bodyStyle={{ padding: "16px 20px 20px" }}
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "20px" }}>
                {/* Tabs Content */}
                <div style={{ flex: 1 }}>
                    <Tabs
                        defaultActiveKey="result"
                        style={{ marginTop: 0 }}
                        tabBarStyle={{ marginBottom: 20 }}
                        size="middle"
                    >
                        <TabPane tab="Result" key="result">
                            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                {/* Status Section */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "16px 20px",
                                        backgroundColor: token.colorFillAlter,
                                        borderRadius: "8px",
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                                    }}
                                >
                                    {getStatusIcon()}
                                    <div style={{ marginLeft: 16 }}>
                                        <Text strong style={{ fontSize: 16, display: "block", marginBottom: 4 }}>
                                            Status
                                        </Text>
                                        <div style={{ fontSize: 14 }}>
                                            {getStatusBadge()}
                                        </div>
                                    </div>
                                </div>

                                {/* Results Table */}
                                <Descriptions
                                    bordered
                                    column={1}
                                    size="middle"
                                    style={{
                                        backgroundColor: token.colorBgContainer,
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                    }}
                                    labelStyle={{
                                        backgroundColor: token.colorFillAlter,
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        width: "200px",
                                        padding: "12px 16px",
                                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                    contentStyle={{
                                        fontSize: "14px",
                                        padding: "12px 16px",
                                    }}
                                >
                                    <Descriptions.Item label={
                                        <Tooltip title="The value of the objective function that was minimized during optimization">
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                Objective Function Value
                                            </span>
                                        </Tooltip>
                                    }>
                                        <Text
                                            code
                                            style={{
                                                fontSize: 13,
                                                fontFamily: "Monaco, 'Courier New', monospace",
                                                padding: "4px 8px",
                                                backgroundColor: token.colorBgLayout,
                                                borderRadius: "4px",
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            {result.objectiveValue.toExponential(4)}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={
                                        <Tooltip title="Akaike Information Criterion - measures model quality with penalty for complexity">
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                AIC
                                            </span>
                                        </Tooltip>
                                    }>
                                        <Text
                                            code
                                            style={{
                                                fontSize: 13,
                                                fontFamily: "Monaco, 'Courier New', monospace",
                                                padding: "4px 8px",
                                                backgroundColor: token.colorBgLayout,
                                                borderRadius: "4px",
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            {result.aic !== undefined ? result.aic.toExponential(4) : "N/A"}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={
                                        <Tooltip title="Bayesian Information Criterion - similar to AIC but with stronger penalty for model complexity">
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                BIC
                                            </span>
                                        </Tooltip>
                                    }>
                                        <Text
                                            code
                                            style={{
                                                fontSize: 13,
                                                fontFamily: "Monaco, 'Courier New', monospace",
                                                padding: "4px 8px",
                                                backgroundColor: token.colorBgLayout,
                                                borderRadius: "4px",
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            {result.bic !== undefined ? result.bic.toExponential(4) : "N/A"}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={
                                        <Tooltip title="Status message or description of the optimization result">
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                Message
                                            </span>
                                        </Tooltip>
                                    }>
                                        <Text style={{ fontSize: 14, lineHeight: 1.5, color: token.colorText }}>
                                            {result.message}
                                        </Text>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Space>
                        </TabPane>
                        <TabPane tab="Logs" key="logs">
                            <div
                                style={{
                                    height: "280px",
                                    overflowY: "auto",
                                    backgroundColor: "#fafafa",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
                                }}
                            >
                                {result.logs.length > 0 ? (
                                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                        {result.logs.map((log, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    fontFamily: "Monaco, 'Courier New', monospace",
                                                    fontSize: "13px",
                                                    lineHeight: 1.5,
                                                    padding: "6px 0",
                                                    borderBottom: index < result.logs.length - 1 ? `1px solid ${token.colorBorderSecondary}` : "none",
                                                    color: token.colorText,
                                                }}
                                            >
                                                <Text style={{ color: token.colorTextSecondary, marginRight: 8, fontSize: "12px", fontWeight: 500 }}>
                                                    {String(index + 1).padStart(2, '0')}:
                                                </Text>
                                                {log}
                                            </div>
                                        ))}
                                    </Space>
                                ) : (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "100%",
                                        textAlign: "center",
                                        padding: "32px 16px"
                                    }}>
                                        <Text type="secondary" style={{ fontSize: 14 }}>
                                            No logs available yet
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </TabPane>
                    </Tabs>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    paddingTop: "16px",
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    marginTop: "auto"
                }}>
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleRunOptimization}
                        loading={loading}
                        size="middle"
                        style={{
                            borderRadius: "8px",
                            fontWeight: "600",
                            height: "36px",
                            fontSize: "14px",
                            minWidth: "160px",
                            boxShadow: "0 2px 4px rgba(24, 144, 255, 0.3)",
                            flex: 1,
                        }}
                    >
                        Run Optimization
                    </Button>
                    <Button
                        icon={<SaveOutlined />}
                        onClick={handleSaveToDocument}
                        size="middle"
                        style={{
                            borderRadius: "8px",
                            fontWeight: "500",
                            height: "36px",
                            fontSize: "14px",
                            minWidth: "140px",
                            border: `1px solid ${token.colorBorder}`,
                            flex: 1,
                        }}
                    >
                        Save to Document
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export default OptimizationResults


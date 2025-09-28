import type React from "react"
import Latex from 'react-latex-next'
import 'katex/dist/katex.css'

import { useState, useEffect } from "react"
import { Form, Select, InputNumber, Button, Card, Modal, Tooltip, Typography, Row, Col } from "antd"
import { SettingOutlined } from "@ant-design/icons"

import type { AlgorithmType, OptimizationFormValues } from "@modelling/types"
import CardTitle from "@components/CardTitle"
import useAppStore from "@stores/appstore"
import {
    getAlgorithmFields,
    algorithmOptions,
    algorithmDescriptions,
    objectiveFunctionOptions,
    objectiveFunctionFormulas
} from "@modelling/form-config"

const { Text } = Typography

interface OptimizationFormProps {
    onSubmit: (values: OptimizationFormValues) => void
    onSave: (values: OptimizationFormValues) => void
    loading: boolean
    onFormChange?: (values: OptimizationFormValues) => void
}

const OptimizationForm: React.FC<OptimizationFormProps> = (
    { onFormChange }) => {
    const [form] = Form.useForm<OptimizationFormValues>()
    const [algorithm, setAlgorithm] = useState<AlgorithmType>("EffGlobalOpt")
    const [fields, setFields] = useState(getAlgorithmFields(algorithm))
    const [modalOpen, setModalOpen] = useState(false)
    const [objectiveFunction, setObjectiveFunction] = useState<string>("sse")

    const darkMode = useAppStore((state) => state.darkMode);

    useEffect(() => {
        setFields(getAlgorithmFields(algorithm))
    }, [algorithm])

    const handleAlgorithmChange = (value: AlgorithmType) => {
        setAlgorithm(value)
    }

    const handleObjectiveFunctionChange = (value: string) => {
        setObjectiveFunction(value)
    }

    const handleFormValuesChange = () => {
        if (onFormChange) {
            form.validateFields()
                .then((values) => {
                    onFormChange(values)
                })
                .catch(() => {
                    // Ignore validation errors for form change callback
                })
        }
    }

    // const handleSubmit = () => {
    //     form.validateFields().then((values) => {
    //         onSubmit(values)
    //     })
    // }

    // const handleSave = () => {
    //     form.validateFields().then((values) => {
    //         onSave(values)
    //     })
    // }

    const openParametersModal = () => {
        setModalOpen(true)
    }

    const closeParametersModal = () => {
        setModalOpen(false)
    }

    return (
        <Card
            title={
                <CardTitle
                    title="Algorithm Configuration"
                    description="Configure the optimization algorithm to use for parameter estimation." />
            }
            bordered={darkMode}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ algorithm: "EffGlobalOpt", solver: "rk4", dt: 0.1, objectiveFunction: "sse", maxIterations: 100, tolerance: 1e-6 }}
                onValuesChange={handleFormValuesChange}
            >
                <Form.Item
                    name="algorithm"
                    label="Optimization Algorithm"
                    tooltip="Select the optimization algorithm to use for parameter estimation. Each algorithm has different strengths and is suitable for different types of problems."
                    rules={[{ required: true, message: "Please select an algorithm!" }]}
                >
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Select
                                options={algorithmOptions}
                                onChange={handleAlgorithmChange}
                                placeholder="Select an optimization algorithm"
                                style={{ flex: 1 }}
                            />
                            <Tooltip title="Configure algorithm parameters">
                                <Button
                                    icon={<SettingOutlined />}
                                    onClick={openParametersModal}
                                    type="text"
                                    size="small"
                                />
                            </Tooltip>
                        </div>
                        {algorithm && (
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: "12px",
                                    lineHeight: "1.4",
                                    display: "block",
                                    marginTop: "14px",
                                    marginBottom: "4px",
                                    paddingLeft: "10px",
                                    paddingRight: "38px",
                                    textAlign: "justify"
                                }}
                            >
                                {algorithmDescriptions[algorithm]}
                            </Text>
                        )}
                    </div>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="solver"
                            label="Solver"
                            tooltip="Choose the numerical integration method for solving differential equations. CVODE is recommended for most cases as it's adaptive and robust."
                            rules={[{ required: true, message: "Please select a solver!" }]}
                        >
                            <Select
                                options={[
                                    { value: "rk4", label: "Runge-Kutta 4" },
                                    { value: "rk5", label: "Runge-Kutta 5" },
                                    { value: "tsit45", label: "Tsitouras 45" },
                                ]}
                                placeholder="Select a solver"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="dt"
                            label="Time Step (dt)"
                            tooltip="The time step size for numerical integration. Smaller values provide more accuracy but slower computation. Typical values range from 0.001 to 0.1."
                            rules={[{ required: true, message: "Please input time step!" }]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                step={0.01}
                                min={0.001}
                                placeholder="Enter time step value"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="objectiveFunction"
                    label="Objective Function"
                    tooltip="The metric used to evaluate how well the model fits the experimental data. Each function has different properties and is suitable for different types of data and noise characteristics."
                    rules={[{ required: true, message: "Please select an objective function!" }]}
                >
                    <Select
                        options={objectiveFunctionOptions}
                        onChange={handleObjectiveFunctionChange}
                        placeholder="Select an objective function"
                    />
                </Form.Item>

                {objectiveFunction && objectiveFunctionFormulas[objectiveFunction] && (
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <Latex>{`$$${objectiveFunctionFormulas[objectiveFunction]}$$`}</Latex>
                        <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                            where y<sub>i</sub> are observed values, ŷ<sub>i</sub> are predicted values, and n is the number of data points
                        </Text>
                    </div>
                )}
            </Form>

            <Modal
                title={`${algorithmOptions.find(opt => opt.value === algorithm)?.label} Parameters`}
                open={modalOpen}
                onCancel={closeParametersModal}
                footer={[
                    <Button key="close" onClick={closeParametersModal}>
                        Close
                    </Button>,
                ]}
                width={500}
            >
                <Form form={form} layout="vertical">
                    {fields.map((field) => {
                        // Define tooltips for each parameter
                        const getTooltip = (fieldName: string) => {
                            const tooltips: Record<string, string> = {
                                maxIterations: "Maximum number of optimization iterations. Higher values allow more thorough search but take longer to complete.",
                                tolerance: "Convergence tolerance for the optimization algorithm. Smaller values require more precise convergence but may take longer.",
                                initialSamples: "Number of initial samples for the Gaussian process model. More samples provide better initial coverage but require more evaluations.",
                                explorationFactor: "Balance between exploration and exploitation. Higher values favor exploring new regions over refining known good areas.",
                                lineSearchMethod: "Method used for finding optimal step size during optimization. Strong Wolfe conditions provide good balance between accuracy and efficiency.",
                                gradientTolerance: "Tolerance for gradient magnitude in gradient-based methods. Smaller values require more precise gradient convergence.",
                                swarmSize: "Number of particles in the swarm. Larger swarms explore more thoroughly but require more computational resources.",
                                inertiaWeight: "Controls particle momentum. Higher values encourage exploration, lower values encourage exploitation of current best positions.",
                                cognitiveWeight: "Attraction strength to particle's personal best position. Higher values make particles more likely to return to their best known position.",
                                socialWeight: "Attraction strength to swarm's global best position. Higher values make particles converge faster to the global optimum."
                            }
                            return tooltips[fieldName] || "Parameter specific to the selected optimization algorithm."
                        }

                        if (field.type === "number") {
                            return (
                                <Form.Item
                                    key={field.name}
                                    name={field.name}
                                    label={field.label}
                                    tooltip={getTooltip(field.name)}
                                    rules={field.rules}
                                    initialValue={field.defaultValue}
                                >
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                            )
                        } else if (field.type === "select" && 'options' in field) {
                            return (
                                <Form.Item
                                    key={field.name}
                                    name={field.name}
                                    label={field.label}
                                    tooltip={getTooltip(field.name)}
                                    rules={field.rules}
                                    initialValue={field.defaultValue}
                                >
                                    <Select options={field.options} />
                                </Form.Item>
                            )
                        }
                        return null
                    })}
                </Form>
            </Modal>
        </Card>
    )
}

export default OptimizationForm


import { useState } from "react"
import { Layout, Row, Col } from "antd"

import type { OptimizationFormValues, OptimizationResult } from "@modelling/types"

import OptimizationForm from "@modelling/components/OptimizationForm"
import OptimizationResults from "@modelling/components/OptimizationResults"
import Parameters from "@suite/parameters/Parameters"

const { Content } = Layout

// Mock data for initial state
const initialResult: OptimizationResult = {
    status: "idle",
    iterations: 0,
    objectiveValue: 0,
    message: "Optimization not started",
    logs: [],
}

const initialFormValues: OptimizationFormValues = {
    algorithm: "EffGlobalOpt",
    solver: "rk4",
    dt: 0.1,
    objectiveFunction: "sse",
    maxIterations: 100,
    tolerance: 1e-6,
}

export default function Modelling() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<OptimizationResult>(initialResult)
    const [formValues, setFormValues] = useState<OptimizationFormValues>(initialFormValues)


    const handleRunOptimization = (values: OptimizationFormValues) => {
        setLoading(true)
        setResult({
            ...result,
            status: "running",
            message: "Optimization in progress...",
            logs: [...result.logs, `Starting ${values.algorithm} optimization...`],
        })

        // Simulate optimization process
        setTimeout(() => {
            const success = Math.random() > 0.3 // 70% chance of success for demo

            const newResult: OptimizationResult = {
                status: success ? "success" : "failure",
                iterations: Math.floor(Math.random() * 50) + 10,
                objectiveValue: success ? Math.random() * 0.01 : Math.random() * 0.1,
                message: success ? "Optimization completed successfully" : "Optimization failed to converge",
                logs: [
                    ...result.logs,
                    `Starting ${values.algorithm} optimization...`,
                    `Setting max iterations to ${values.maxIterations}`,
                    `Setting tolerance to ${values.tolerance}`,
                    success
                        ? `Optimization converged after ${Math.floor(Math.random() * 50) + 10} iterations`
                        : `Failed to converge after ${values.maxIterations} iterations`,
                ],
            }

            // Parameters are now managed by the backend, no need to update them here
            // The Parameters component will automatically refresh from the backend

            setResult(newResult)
            setLoading(false)
        }, 2000)
    }

    const handleSaveToDocument = (values: OptimizationFormValues) => {
        console.log("Saving configuration to document:", values)
        // In a real application, this would save the configuration to a document or database
    }

    const handleFormChange = (values: OptimizationFormValues) => {
        setFormValues(values)
    }

    return (
        <Layout
            className={"overflow-y-scroll mx-2 mb-20 h-full scrollbar-hide"}
            style={{ minHeight: "100vh" }}
        >
            <Content>
                <Row gutter={[15, 15]}>
                    <Col xs={24} lg={12}>
                        <OptimizationForm
                            onSubmit={handleRunOptimization}
                            onSave={handleSaveToDocument}
                            loading={loading}
                            onFormChange={handleFormChange}
                        />
                    </Col>
                    <Col xs={24} lg={12}>
                        <OptimizationResults
                            result={result}
                            onRunOptimization={handleRunOptimization}
                            onSaveToDocument={handleSaveToDocument}
                            loading={loading}
                            formValues={formValues}
                        />
                    </Col>
                </Row>

                <Row style={{ marginTop: 15 }}>
                    <Col span={24}>
                        <Parameters />
                    </Col>
                </Row>
            </Content>
        </Layout>
    )
}

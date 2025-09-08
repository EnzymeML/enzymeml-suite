import type { AlgorithmType } from "./types"

export const getAlgorithmFields = (algorithm: AlgorithmType) => {
    const commonFields = [
        {
            name: "maxIterations",
            label: "Max Iterations",
            type: "number",
            defaultValue: 100,
            rules: [{ required: true, message: "Please input max iterations!" }],
        },
        {
            name: "tolerance",
            label: "Tolerance",
            type: "number",
            defaultValue: 1e-6,
            rules: [{ required: true, message: "Please input tolerance!" }],
        },
    ]

    const algorithmSpecificFields = {
        EffGlobalOpt: [
            {
                name: "initialSamples",
                label: "Initial Samples",
                type: "number",
                defaultValue: 10,
                rules: [{ required: true, message: "Please input initial samples!" }],
            },
            {
                name: "explorationFactor",
                label: "Exploration Factor",
                type: "number",
                defaultValue: 0.5,
                rules: [{ required: true, message: "Please input exploration factor!" }],
            },
        ],
        LBFGS: [
            {
                name: "lineSearchMethod",
                label: "Line Search Method",
                type: "select",
                options: [
                    { value: "strong-wolfe", label: "Strong Wolfe" },
                    { value: "armijo", label: "Armijo" },
                    { value: "more-thuente", label: "More-Thuente" },
                ],
                defaultValue: "strong-wolfe",
                rules: [{ required: true, message: "Please select line search method!" }],
            },
            {
                name: "gradientTolerance",
                label: "Gradient Tolerance",
                type: "number",
                defaultValue: 1e-5,
                rules: [{ required: true, message: "Please input gradient tolerance!" }],
            },
        ],
        BFGS: [
            {
                name: "lineSearchMethod",
                label: "Line Search Method",
                type: "select",
                options: [
                    { value: "strong-wolfe", label: "Strong Wolfe" },
                    { value: "armijo", label: "Armijo" },
                    { value: "more-thuente", label: "More-Thuente" },
                ],
                defaultValue: "strong-wolfe",
                rules: [{ required: true, message: "Please select line search method!" }],
            },
            {
                name: "gradientTolerance",
                label: "Gradient Tolerance",
                type: "number",
                defaultValue: 1e-5,
                rules: [{ required: true, message: "Please input gradient tolerance!" }],
            },
        ],
        ParticleSwarm: [
            {
                name: "swarmSize",
                label: "Swarm Size",
                type: "number",
                defaultValue: 50,
                rules: [{ required: true, message: "Please input swarm size!" }],
            },
            {
                name: "inertiaWeight",
                label: "Inertia Weight",
                type: "number",
                defaultValue: 0.7,
                rules: [{ required: true, message: "Please input inertia weight!" }],
            },
            {
                name: "cognitiveWeight",
                label: "Cognitive Weight",
                type: "number",
                defaultValue: 1.5,
                rules: [{ required: true, message: "Please input cognitive weight!" }],
            },
            {
                name: "socialWeight",
                label: "Social Weight",
                type: "number",
                defaultValue: 1.5,
                rules: [{ required: true, message: "Please input social weight!" }],
            },
        ],
    }

    return [...commonFields, ...(algorithmSpecificFields[algorithm] || [])]
}

export const algorithmOptions = [
    { value: "EffGlobalOpt", label: "Efficient Global Optimization" },
    { value: "LBFGS", label: "LBFGS" },
    { value: "BFGS", label: "BFGS" },
    { value: "ParticleSwarm", label: "Particle Swarm" },
]

export const algorithmDescriptions = {
    EffGlobalOpt: "A global optimization algorithm that uses Gaussian processes to model the objective function and efficiently finds the global optimum with minimal function evaluations. Ideal for expensive objective functions.",
    LBFGS: "Limited-memory Broyden-Fletcher-Goldfarb-Shanno algorithm. A quasi-Newton method that efficiently solves unconstrained optimization problems by approximating the inverse Hessian matrix using limited memory.",
    BFGS: "Broyden-Fletcher-Goldfarb-Shanno algorithm. A quasi-Newton optimization method that builds up an approximation to the inverse Hessian matrix. Suitable for smooth, differentiable objective functions.",
    ParticleSwarm: "A population-based stochastic optimization technique inspired by social behavior of bird flocking. Good for non-linear, multi-modal optimization problems where gradient information is not available."
}

export const objectiveFunctionOptions = [
    { value: "sse", label: "Sum of Squared Errors (SSE)" },
    { value: "mse", label: "Mean Squared Error (MSE)" },
    { value: "rmse", label: "Root Mean Squared Error (RMSE)" },
    { value: "log-cosh", label: "Log-Cosh Loss" },
    { value: "l1", label: "L1 Loss (Mean Absolute Error)" },
]

export const objectiveFunctionFormulas: Record<string, string> = {
    sse: "\\text{SSE} = \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2",
    mse: "\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2",
    rmse: "\\text{RMSE} = \\sqrt{\\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2}",
    "log-cosh": "\\text{Log-Cosh} = \\sum_{i=1}^{n} \\log(\\cosh(y_i - \\hat{y}_i))",
    l1: "\\text{L1} = \\frac{1}{n} \\sum_{i=1}^{n} |y_i - \\hat{y}_i|"
}


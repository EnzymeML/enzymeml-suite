export type AlgorithmType = "EffGlobalOpt" | "LBFGS" | "BFGS" | "ParticleSwarm"

export interface OptimizationFormValues {
    algorithm: AlgorithmType
    solver: string
    dt: number
    objectiveFunction: string
    // Common parameters
    maxIterations: number
    tolerance: number

    // EGO specific
    initialSamples?: number
    explorationFactor?: number

    // LBFGS/BFGS specific
    lineSearchMethod?: "strong-wolfe" | "armijo" | "more-thuente"
    gradientTolerance?: number

    // Particle Swarm specific
    swarmSize?: number
    inertiaWeight?: number
    cognitiveWeight?: number
    socialWeight?: number
}

export interface OptimizationResult {
    status: "success" | "failure" | "running" | "idle"
    iterations: number
    objectiveValue: number
    aic?: number
    bic?: number
    message: string
    logs: string[]
}

export interface Parameter {
    key: string
    symbol: string
    value: number
    initialGuess: number
    upperBound: number
    lowerBound: number
    transformation: "linear" | "logarithmic" | "exponential" | "none"
}


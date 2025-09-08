export interface KineticLawDefinition {
    id: string;
    name: string;
    category: 'enzymatic' | 'chemical' | 'inhibition' | 'cooperative' | 'transport';
    equation: string; // LaTeX equation
    description: string;
    parameters: ParameterDefinition[];
    species: SpeciesPlaceholder[];
}

export interface KineticLawCategory {
    key: string;
    label: string;
    color: string;
}

export interface ParameterDefinition {
    id: string;
    name: string;
    symbol: string;
    description: string;
    defaultValue?: number;
    unit?: string;
}

export interface SpeciesPlaceholder {
    id: string;
    name: string;
    role: 'substrate' | 'product' | 'inhibitor' | 'activator' | 'enzyme' | 'modifier';
    required: boolean;
    description: string;
}

export interface SpeciesInfo {
    id: string;
    name: string;
    type: 'protein' | 'small_molecule';
}

export interface SpeciesAssignment {
    placeholderId: string;
    speciesId: string | null;
}

export interface KineticLawBuilderState {
    selectedLawId: string | null;
    speciesAssignments: SpeciesAssignment[];
    customEquation: string;
    isCustom: boolean;
} 
import { useMemo } from 'react';
import { KineticLawDefinition, KineticLawCategory } from '../reactions/types';
import kineticLawsData from './assets/kineticLaws.json';

// Interface matching the JSON structure
export interface JsonKineticLaw {
    id: string;
    name: string;
    category: string;
    equation: string;
    description: string;
    parameters: JsonParameterDefinition[];
    species: JsonSpeciesDefinition[];
}

export interface JsonParameterDefinition {
    id: string;
    symbol: string;
    shortDescription: string;
    longDescription: string;
}

export interface JsonSpeciesDefinition {
    id: string;
    role: string;
    required: boolean;
    shortDescription: string;
    longDescription: string;
}

// Transform JSON parameter to application parameter
const transformParameter = (jsonParam: JsonParameterDefinition) => ({
    id: jsonParam.id,
    name: jsonParam.shortDescription,
    symbol: jsonParam.symbol,
    description: jsonParam.shortDescription
});

// Transform JSON species to application species
const transformSpecies = (jsonSpecies: JsonSpeciesDefinition) => {
    // Map role strings to expected role types
    const roleMap: Record<string, 'substrate' | 'product' | 'inhibitor' | 'activator' | 'enzyme' | 'modifier'> = {
        'Reactant': 'substrate',
        'Substrate': 'substrate',
        'Product': 'product',
        'Inhibitor': 'inhibitor',
        'Activator': 'activator',
        'Enzyme': 'enzyme',
        'Modifier': 'modifier'
    };

    return {
        id: jsonSpecies.id,
        name: jsonSpecies.shortDescription,
        role: roleMap[jsonSpecies.role] || 'substrate' as const,
        required: jsonSpecies.required,
        description: jsonSpecies.longDescription || jsonSpecies.shortDescription
    };
};

// Transform JSON kinetic law to application kinetic law
const transformKineticLaw = (jsonLaw: JsonKineticLaw): KineticLawDefinition => {
    // Map category strings to expected category types
    const categoryMap: Record<string, 'enzymatic' | 'chemical' | 'inhibition' | 'cooperative' | 'transport'> = {
        'Mass Action Rate Law': 'chemical',
        'Enzymatic Rate Law': 'enzymatic',
        'Hill-type Rate Law, Generalised Form': 'cooperative',
        'Inhibition': 'inhibition',
        'Activation': 'enzymatic',
        'Transport': 'transport'
    };

    return {
        id: jsonLaw.id,
        name: jsonLaw.name,
        category: categoryMap[jsonLaw.category] || 'chemical',
        equation: jsonLaw.equation,
        description: jsonLaw.description,
        parameters: jsonLaw.parameters.map(transformParameter),
        species: jsonLaw.species.map(transformSpecies)
    };
};

// Memoized transformation of all kinetic laws
const transformedLaws = (() => {
    const laws = (kineticLawsData as JsonKineticLaw[]).map(transformKineticLaw);

    // Remove duplicates based on ID (since the JSON has some duplicates)
    const uniqueLaws = laws.filter((law, index, self) =>
        index === self.findIndex(l => l.id === law.id)
    );

    return uniqueLaws;
})();

// Memoized category extraction with predefined colors
const extractedCategories = (() => {
    // Map JSON categories to our application categories
    const categoryMappings: Record<string, { key: string; label: string; color: string }> = {
        'Mass Action Rate Law': { key: 'chemical', label: 'Chemical', color: '#52c41a' },
        'Enzymatic Rate Law': { key: 'enzymatic', label: 'Enzymatic', color: '#1890ff' },
        'Hill-type Rate Law, Generalised Form': { key: 'cooperative', label: 'Cooperative', color: '#722ed1' },
        'Inhibition': { key: 'inhibition', label: 'Inhibition', color: '#ff4d4f' },
        'Activation': { key: 'enzymatic', label: 'Enzymatic', color: '#1890ff' }, // Merge with enzymatic
        'Transport': { key: 'transport', label: 'Transport', color: '#13c2c2' }
    };

    // Extract unique categories from JSON
    const jsonCategories = new Set((kineticLawsData as JsonKineticLaw[]).map(law => law.category));
    const mappedCategories = new Map<string, { key: string; label: string; color: string }>();

    // Create mapped categories, avoiding duplicates
    jsonCategories.forEach(jsonCategory => {
        const mapping = categoryMappings[jsonCategory];
        if (mapping) {
            mappedCategories.set(mapping.key, mapping);
        }
    });

    return Array.from(mappedCategories.values());
})();

// Exported constants
export const KINETIC_LAWS: KineticLawDefinition[] = transformedLaws;

export const KINETIC_LAW_CATEGORIES: KineticLawCategory[] = extractedCategories;

// Helper functions for getting specific subsets
export const getKineticLawsByCategory = (categoryKey: string): KineticLawDefinition[] => {
    return KINETIC_LAWS.filter(law => law.category === categoryKey);
};

export const getKineticLawById = (id: string): KineticLawDefinition | undefined => {
    return KINETIC_LAWS.find(law => law.id === id);
};

export const getCategories = (): KineticLawCategory[] => {
    return KINETIC_LAW_CATEGORIES;
};

// Hook for reactive category data (if needed in React components)
export const useKineticLawCategories = (): KineticLawCategory[] => {
    return useMemo(() => KINETIC_LAW_CATEGORIES, []);
};

export const useKineticLaws = (): KineticLawDefinition[] => {
    return useMemo(() => KINETIC_LAWS, []);
}; 
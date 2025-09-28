import { KineticLawDefinition } from '@reactions/types';
import { ColoredSymbolsMapProps } from '@components/LatexRenderer';

// Color mapping for species roles
export const SPECIES_ROLE_COLORS = {
    substrate: '#1890ff',    // Blue
    product: '#52c41a',      // Green  
    inhibitor: '#f5222d',    // Red
    activator: '#722ed1',    // Purple
    enzyme: '#fa8c16',       // Orange
    modifier: '#13c2c2'      // Cyan
};

// Function to colorize equation based on species roles
export const colorizeEquation = (
    equation: string,
    selectedLaw: KineticLawDefinition | null,
    formValues: Record<string, string>
): string => {
    if (!selectedLaw) return equation;

    let colorizedEquation = equation;

    selectedLaw.species.forEach(placeholder => {
        const assignedSpeciesId = formValues[`species_${placeholder.id}`];
        if (assignedSpeciesId) {
            const color = SPECIES_ROLE_COLORS[placeholder.role];
            const speciesPattern = new RegExp(`\\[${assignedSpeciesId}\\]`, 'g');
            colorizedEquation = colorizedEquation.replace(
                speciesPattern,
                `\\textcolor{${color}}{[${assignedSpeciesId}]}`
            );
        }
    });

    return colorizedEquation;
};

// Shared function to create colored symbols map for LatexRenderer
export const createColoredSymbolsMap = (
    selectedLaw: KineticLawDefinition | null,
    formValues?: Record<string, string>
): ColoredSymbolsMapProps[] => {
    if (!selectedLaw) return [];

    const colorGroups: Record<string, string[]> = {};

    // Group species placeholders by their color (role)
    selectedLaw.species.forEach(placeholder => {
        const color = SPECIES_ROLE_COLORS[placeholder.role];
        if (color) {
            if (!colorGroups[color]) {
                colorGroups[color] = [];
            }

            // If formValues provided, use assigned species IDs, otherwise use placeholder IDs
            if (formValues) {
                const assignedSpeciesId = formValues[`species_${placeholder.id}`];
                if (assignedSpeciesId) {
                    colorGroups[color].push(assignedSpeciesId);
                }
            } else {
                // Use the placeholder ID as the symbol to be colored
                colorGroups[color].push(placeholder.id);
            }
        }
    });

    // Convert to ColoredSymbolsMapProps format
    return Object.entries(colorGroups).map(([color, symbols]) => ({
        symbols,
        color
    }));
};

export const getEquationSize = (equation: string) => {
    if (equation.length < 45) {
        return 'large';
    } else if (equation.length < 70) {
        return 'normal';
    } else {
        return 'small';
    }
}
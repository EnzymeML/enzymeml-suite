import {parse} from "mathjs";
import {convertAsciiMathToLatex} from "mathlive";
import {listAllSpeciesIds} from "../commands/enzmldoc.ts";

export interface RateLawSetup {
    params: string[],
    vars: string[]
}

/**
 * Converts an identifier to LaTeX format by appending an underscore and wrapping digits in curly braces.
 *
 * @param {string} id - The identifier to convert.
 * @returns {string} - The converted LaTeX string.
 */
export function idToLatex(id?: string | null): string {
    if (!id) {
        return '';
    }
    return id.replace(/(\d+)$/, '_{$1}');
}

/**
 * Corrects LaTeX underscript notation by merging single character subscripts with subsequent characters.
 *
 * @param {string} latexStr - The LaTeX string to correct.
 * @returns {string} - The corrected LaTeX string.
 */
export function correctLatexUnderscript(latexStr: string): string {
    const regex = /_\{([a-zA-Z])}([a-zA-Z]+)/g;
    return latexStr.replace(regex, (_, p1, p2) => {
        return `_{${p1}${p2}}`;
    });
}

/**
 * Converts an ASCII math string to LaTeX format and corrects underscript notation.
 *
 * @param {string} ascii - The ASCII math string to convert.
 * @returns {string} - The converted and corrected LaTeX string.
 */
export function asciiToLatex(ascii: string): string {
    let equation = convertAsciiMathToLatex(ascii);
    return correctLatexUnderscript(equation);
}


/**
 * Extracts variable names from a plain text mathematical equation.css.
 *
 * @param {string} plainEquation - The plain text equation.css to parse.
 * @returns {RateLawSetup | null} - An object containing arrays of parameters and variables, or null if an error occurs.
 */
export async function distributeParamsAndVars(plainEquation: string): Promise<RateLawSetup | null> {

    try {
        let rateLawSetup: RateLawSetup = {
            params: [],
            vars: []
        }

        const expression = parse(plainEquation);
        const nodes = expression.filter((node) => {
            // @ts-ignore
            return node.isSymbolNode;
        });

        for (const node of nodes) {
            // @ts-ignore
            const name = node.name;
            if (await isSpeciesID(name)) {
                rateLawSetup.vars.push(underscoreToSpeciesID(name));
            } else {
                rateLawSetup.params.push(name);
            }
        }

        // Remove duplicates
        rateLawSetup.vars = [...new Set(rateLawSetup.vars)];
        rateLawSetup.params = [...new Set(rateLawSetup.params)];

        return rateLawSetup;
    } catch (error) {
        // Equation is malformed, possibly due to the user still typing
        // Return nothing to prevent the UI from updating
        return null
    }
}

/**
 * Checks if a given identifier is a species ID.
 *
 * @param {string} id - The identifier to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the identifier is a species ID, false otherwise.
 */
async function isSpeciesID(id: string): Promise<boolean> {
    const speciesIDs = await fetchSpeciesIds();
    const underscoreID = underscoreToSpeciesID(id);

    return speciesIDs.includes(underscoreID);
}

/**
 * Converts underscore notation species IDs in an equation.css to their original format.
 *
 * @param {string} equation - The equation.css containing underscore notation species IDs.
 * @returns {Promise<string>} - A promise that resolves to the equation.css with species IDs in their original format.
 */
export async function convertUnderscoreSpeciesToIDs(equation: string): Promise<string> {
    const speciesIDs = await fetchSpeciesIds();

    speciesIDs.forEach((speciesID) => {
        const underscoreSpeciesID = speciesIDToUnderscore(speciesID);

        // Regex to exactly match underscore species ID
        const regex = new RegExp(`\\b${underscoreSpeciesID}\\b`, 'g');
        if (equation.match(regex)) {
            // Replace all occurrences
            equation = equation.replace(regex, speciesID);
        }
    });

    return equation;
}

/**
 * Converts species IDs in an equation.css to underscore notation.
 *
 * @param {string} equation - The equation.css containing species IDs.
 * @returns {Promise<string>} - A promise that resolves to the equation.css with species IDs in underscore notation.
 */
export async function convertSpeciesIDsToUnderscore(equation: string): Promise<string> {
    const speciesIDs = await fetchSpeciesIds();

    speciesIDs.forEach((speciesID) => {
        const underscoreSpeciesID = speciesIDToUnderscore(speciesID);
        if (equation.includes(speciesID)) {
            let regex = new RegExp(`\\b${speciesID}\\b`, 'g');
            equation = equation.replace(regex, underscoreSpeciesID);
        }
    });

    return equation;
}

/**
 * Converts a species ID to underscore notation.
 *
 * @param {string} id - The species ID to convert.
 * @returns {string} - The species ID in underscore notation.
 */
function speciesIDToUnderscore(id: string): string {
    return id.replace(/([psc])(\d+)/, '$1_$2');
}

/**
 * Converts an underscore notation species ID to its original format.
 *
 * @param {string} id - The underscore notation species ID to convert.
 * @returns {string} - The species ID in its original format.
 */
function underscoreToSpeciesID(id: string): string {
    return id.replace(/([psc])_(\d+)/, '$1$2');
}

/**
 * Fetches the list of species IDs.
 *
 * @returns {Promise<string[]>} - A promise that resolves to an array of species IDs.
 * @throws {Error} - Throws an error if fetching species IDs fails.
 */
async function fetchSpeciesIds(): Promise<string[]> {
    try {
        return await listAllSpeciesIds();
    } catch (error) {
        throw new Error('Error fetching species IDs: ' + error);
    }
}
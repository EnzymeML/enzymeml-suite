/**
 * Creates a reaction SMILES string from reactants and products arrays.
 * 
 * @param reactants - Array of SMILES strings representing reactant molecules
 * @param products - Array of SMILES strings representing product molecules
 * @returns A reaction SMILES string in the format "reactant1.reactant2>product1.product2"
 */
export default function createReactionSMILES(reactantIds: string[], productIds: string[], smallMolecules: Record<string, string>) {
    const reactantSMILES = extractSMILES(reactantIds, smallMolecules);
    const productSMILES = extractSMILES(productIds, smallMolecules);
    return `${reactantSMILES.join(".")}>>${productSMILES.join(".")}`;
}

/**
 * Extracts the SMILES strings from the small molecules array based on the ids.
 * 
 * @param ids - Array of ids to extract SMILES strings from
 * @param smallMolecules - Record of small molecules to extract SMILES strings from
 * @returns An array of SMILES strings
 */
function extractSMILES(ids: string[], smallMolecules: Record<string, string>) {
    return ids.map((id) => smallMolecules[id]).filter((smiles) => smiles !== undefined);
}
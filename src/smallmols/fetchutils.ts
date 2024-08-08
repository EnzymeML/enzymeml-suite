// Type definitions and functions to fetch data from PubChem
import {SmallMolecule} from "../../../enzymeml-ts/src";
import {FormInstance} from "antd";

export interface PCAutoCompleteType {
    dictionary_terms: { compound: string[] }
    total: number;
}

interface Prop {
    urn: {
        label: string
        name: string,
    };
    value: { sval: string, };
}

interface PubChemId {
    id: { cid: number };
}

interface PubChemResponse {
    PC_Compounds: {
        id: PubChemId;
        props: Prop[];
    }[]
}

// Functions to fetch data from PubChem

export async function fetchFromPubChem(name: string, limit: number): Promise<string[]> {
    if (name.length < 2) {
        return [];
    }

    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${name.toLowerCase()}/json?limit=${limit}`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: PCAutoCompleteType = await response.json();

            if (data.total > 0) {
                return data.dictionary_terms.compound;
            }
        } catch (error) {
            console.error('Error:', error);
            attempts++;
            if (attempts < maxAttempts) {
                console.log(`Retrying in 300ms... Attempt ${attempts}`);
                await delay(300); // wait for 200ms before retrying
            } else {
                return [];
            }
        }
    }
    return [];
}

export async function fetchPubChemDetails(name: string, form: FormInstance<SmallMolecule>) {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/JSON`;

    try {
        // Fetch data from PubChem
        const response = await fetch(url);
        const data: PubChemResponse = await response.json();

        if (data.PC_Compounds.length === 0) {
            // No data found
            return;
        }

        // Extract properties
        const props = data.PC_Compounds[0].props;
        const canonical_smiles = extractProperty(props, 'smiles', "canonical");
        const inchikey = extractProperty(props, 'inchi');
        const href = `https://pubchem.ncbi.nlm.nih.gov/compound/${data.PC_Compounds[0].id.id.cid}`;

        // Update the data object
        form.setFieldsValue({
            canonical_smiles: canonical_smiles,
            inchikey: inchikey,
            references: [href],
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

function extractProperty(props: Prop[], label: string, name?: string): string | null {
    for (const prop of props) {
        if (prop.urn.label.toLowerCase() === label.toLowerCase()) {
            if (!name) {
                return prop.value.sval;
            } else if (prop.urn.name.toLowerCase() === name.toLowerCase()) {
                return prop.value.sval;
            }
        }
    }
    return null;
}


function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
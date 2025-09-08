// Type definitions and functions to fetch data from PubChem
import { SmallMolecule } from "enzymeml";
import { FormInstance } from "antd";
import capitalize from "antd/lib/_util/capitalize";

export interface PCAutoCompleteType {
  dictionary_terms: { compound: string[] };
  total: number;
}

interface Prop {
  urn: {
    label: string;
    name: string;
  };
  value: { sval: string };
}

interface PubChemId {
  id: { cid: number };
}

interface PubChemResponse {
  PC_Compounds: {
    id: PubChemId;
    props: Prop[];
  }[];
}

// Add cache for PubChem responses
const pubChemCache = new Map<
  string,
  {
    data: PubChemResponse | PCAutoCompleteType | string[];
    timestamp: number;
  }
>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache

// Functions to fetch data from PubChem

export async function fetchFromPubChem(
  name: string,
  limit: number
): Promise<string[]> {
  if (name.length < 2) {
    return [];
  }

  // Check cache first
  const cacheKey = `autocomplete_${name}_${limit}`;
  const cachedData = pubChemCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data as string[];
  }

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${name.toLowerCase()}/json?limit=${limit}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PCAutoCompleteType = await response.json();
      clearTimeout(timeout);

      if (data.total > 0) {
        // Cache the successful response
        pubChemCache.set(cacheKey, {
          data: data.dictionary_terms.compound,
          timestamp: Date.now(),
        });
        return data.dictionary_terms.compound;
      }
      return [];
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Request timed out");
        return [];
      }
      console.error("Error:", error);
      attempts++;
      if (attempts < maxAttempts) {
        await delay(300 * attempts); // Progressive delay
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  return [];
}

export async function fetchPubChemDetails(
  name: string,
  form: FormInstance<SmallMolecule>
) {
  const cacheKey = `details_${name}`;
  const cachedData = pubChemCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    if ("PC_Compounds" in cachedData.data) {
      updateForm(cachedData.data, name, form);
      return;
    }
  }

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/JSON`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const data: PubChemResponse = await response.json();
    clearTimeout(timeout);

    if (data.PC_Compounds?.length > 0) {
      pubChemCache.set(cacheKey, { data, timestamp: Date.now() });
      updateForm(data, name, form);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Request timed out");
    } else {
      console.error("Error:", error);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Separate form update logic for better organization
function updateForm(
  data: PubChemResponse,
  name: string,
  form: FormInstance<SmallMolecule>
) {
  const props = data.PC_Compounds[0].props;
  const canonical_smiles = extractProperty(props, "smiles", "canonical");
  const absolute_smiles = extractProperty(props, "smiles", "absolute");
  const isomeric_smiles = extractProperty(props, "smiles", "isomeric");
  const inchikey = extractProperty(props, "inchi");
  const href = `https://pubchem.ncbi.nlm.nih.gov/compound/${data.PC_Compounds[0].id.id.cid}`;

  console.log(props);

  form.setFieldsValue({
    name: capitalize(name),
    canonical_smiles: absolute_smiles || canonical_smiles || isomeric_smiles,
    inchikey: inchikey,
    references: [href],
  });
}

// Optimize property extraction with early returns
function extractProperty(
  props: Prop[],
  label: string,
  name?: string
): string | null {
  const prop = props.find(
    (p) =>
      p.urn.label.toLowerCase() === label.toLowerCase() &&
      (!name || p.urn.name.toLowerCase() === name.toLowerCase())
  );
  return prop?.value.sval || null;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

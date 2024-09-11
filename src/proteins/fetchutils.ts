interface UniProtResult {
    results: UniProtEntry[];
}

export interface UniProtEntry {
    primaryAccession: string;
    organism: { scientificName: string, taxonId: number };
    proteinDescription: {
        recommendedName: {
            fullName: { value: string },
            ecNumbers?: { value: string }[],
        },
    };
    sequence: { value?: string };
}

export async function fetchFromUniProt(name: string, limit: number): Promise<UniProtEntry[]> {
    if (name.length < 2) {
        return [];
    }

    const url = `https://rest.uniprot.org/uniprotkb/search?query=${name}&size=${limit}`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const res: UniProtResult = await response.json();

            if (res.results) {
                return res.results;
            } else {
                return [];
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

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
import { SystemQuery, UserQuery } from "enzymeml";
import OpenAI from "openai";

/**
 * Performs a research query using OpenAI's API with web search capabilities.
 * 
 * This function creates a system prompt that instructs the AI to act as a helpful assistant
 * that enriches and researches queries with additional information. It uses web search tools
 * to gather relevant information and summarizes findings in a concise manner.
 * 
 * @param client - The OpenAI client instance used to make API calls
 * @param query - The user's research query string
 * @returns Promise<string> - The AI's response containing enriched information and research findings
 * 
 * @example
 * ```typescript
 * const client = new OpenAI({ apiKey: 'your-api-key' });
 * const result = await researchQuery(client, 'gpt-4', 'What are the latest developments in CRISPR technology?');
 * console.log(result); // Returns summarized research findings
 * ```
 */
export async function researchQuery(client: OpenAI, query: string) {
    const systemQuery = new SystemQuery(`
        You are a research assistant that enriches user queries with comprehensive background information before data extraction begins.

        Your role:
        - Research and gather relevant context, facts, and domain knowledge related to the user's query
        - Provide additional information that may not be present in the user's input or source documents
        - Act as a knowledge consultant to ensure the subsequent data extraction process has complete context
        - Focus on factual, current, and relevant information that would improve extraction accuracy

        Guidelines:
        - Prioritize recent developments, standards, and best practices in the relevant field
        - Include key terminology, definitions, and context that might be missing
        - Provide background information that would help understand the domain better
        - Keep information concise but comprehensive enough to inform the extraction process

        Your research will be used to enhance the AI's understanding before it extracts structured data from documents or user inputs.
    `);

    const userQuery = new UserQuery(query);
    const response = await client.responses.create({
        model: "gpt-4.1-mini",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: [systemQuery.toMessage() as any, userQuery.toMessage() as any],
        tools: [{ type: "web_search" }],
        tool_choice: "required",
    });
    return response.output_text;
}

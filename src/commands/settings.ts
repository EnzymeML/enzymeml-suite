import { invoke } from '@tauri-apps/api/core';

/**
 * Installs the MCP server binary to the user's configuration directory
 * 
 * This function triggers the installation of the MCP server binary, which enables
 * Claude integration. The binary is copied from the application's resources to the
 * user's config directory and made executable.
 * 
 * @returns Promise that resolves to a success message with the installation path
 * @throws Error if the installation fails
 */
export async function installMcpServer(): Promise<string> {
    try {
        return await invoke<string>('install_mcp_server');
    } catch (error) {
        throw new Error('Error installing MCP server: ' + error);
    }
}

/**
 * Retrieves the stored OpenAI API token from the secure store
 * 
 * This function fetches the OpenAI API token that was previously saved by the user.
 * The token is stored securely using Tauri's store plugin.
 * 
 * @returns Promise that resolves to the token string (or empty string if not set)
 * @throws Error if the token retrieval fails
 */
export async function getOpenAIToken(): Promise<string> {
    try {
        return await invoke<string>('get_openai_token');
    } catch (error) {
        throw new Error('Error retrieving OpenAI token: ' + error);
    }
}

/**
 * Saves the OpenAI API token to the secure store
 * 
 * This function stores the OpenAI API token securely using Tauri's store plugin.
 * The token will be persisted across application sessions.
 * 
 * @param token - The OpenAI API token to store
 * @returns Promise that resolves to a success message
 * @throws Error if the token save fails
 */
export async function setOpenAIToken(token: string): Promise<string> {
    try {
        return await invoke<string>('set_openai_token', { token });
    } catch (error) {
        throw new Error('Error saving OpenAI token: ' + error);
    }
}

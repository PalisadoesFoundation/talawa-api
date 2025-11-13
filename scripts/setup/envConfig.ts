import path from "node:path";

/**
 * Gets the environment file name, configurable via process.env.ENV_FILE (used by tests).
 * Use a relative filename as the logical name; other modules that need an
 * absolute path should call envFilePath().
 * @returns The environment file name
 */
export function getEnvFileName(): string {
	return process.env.ENV_FILE ?? ".env";
}

/**
 * Helper function to get the absolute path for an env file.
 * @param name - The env file name (defaults to the value from getEnvFileName())
 * @returns The absolute path to the env file
 */
export function envFilePath(name?: string): string {
	return path.resolve(process.cwd(), name ?? getEnvFileName());
}

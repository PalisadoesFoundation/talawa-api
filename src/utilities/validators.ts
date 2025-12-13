import { z } from "zod";

/**
 * Shared Zod schema for validating Plugin IDs.
 * Ensures that the ID is alphanumeric (plus underscores and hyphens), starts with a letter,
 * and is of reasonable length. This prevents directory traversal and shell injection
 * when the ID is used in file paths or shell commands.
 */
export const pluginIdSchema = z
	.string()
	.min(1, "Plugin ID cannot be empty")
	.max(100, "Plugin ID is too long")
	.regex(
		/^[a-zA-Z][a-zA-Z0-9_-]*$/,
		"Plugin ID must start with a letter and contain only letters, numbers, underscores, and hyphens",
	);

import { z } from "zod";

/**
 * Escapes HTML characters in a string to prevent XSS attacks.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHTML(str: string): string {
	return str.replace(/[&<>"']/g, (tag) => {
		const chars: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return chars[tag] || tag;
	});
}

/**
 * Zod schema for a string that is automatically sanitized (HTML escaped).
 */
export const sanitizedStringSchema = z
	.string()
	.transform((val) => escapeHTML(val));

import { z } from "zod";

/**
 * Escapes HTML special characters to prevent XSS.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHTML(str: string): string {
	return str.replace(/[&<>"']/g, (match) => {
		switch (match) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			case "'":
				return "&#39;";
			default:
				return match;
		}
	});
}

/**
 * Zod schema for a string that is automatically sanitized (HTML escaped).
 */
export const sanitizedStringSchema = z
	.string()
	.transform((val) => escapeHTML(val));

import { z } from "zod";

const HTML_ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/**
 * Escapes HTML characters in a string to prevent XSS attacks.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHTML(str: string): string {
	return str.replace(/[&<>"']/g, (tag) => HTML_ESCAPE_MAP[tag] || tag);
}

/**
 * Zod schema for a string that is automatically sanitized (trimmed).
 * Note: This does NOT escape HTML. HTML escaping should be done at output time.
 */
export const sanitizedStringSchema = z.string().trim();

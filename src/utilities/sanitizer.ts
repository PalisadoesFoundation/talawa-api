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
export type HTMLSafeString = string & { readonly __brand: "HTMLSafeString" };
export type SanitizedInputString = string & {
	readonly __brand: "SanitizedInputString";
};

/**
 * Escapes HTML characters in a string to prevent XSS attacks.
 * @param str The string to escape.
 * @returns The escaped string, or the input if it was null/undefined.
 */
export function escapeHTML(str: string): HTMLSafeString;
export function escapeHTML(str: string | null): HTMLSafeString | null;
export function escapeHTML(str: string | undefined): HTMLSafeString | undefined;
export function escapeHTML(
	str: string | null | undefined,
): HTMLSafeString | null | undefined;
export function escapeHTML(
	str: string | null | undefined,
): HTMLSafeString | null | undefined {
	if (!str) {
		return str as HTMLSafeString | null | undefined;
	}
	return str.replace(
		/[&<>"']/g,
		(tag) => HTML_ESCAPE_MAP[tag] || tag,
	) as HTMLSafeString;
}

/**
 * Zod schema for a string that is automatically sanitized (trimmed).
 * Note: This does NOT escape HTML. HTML escaping should be done at output time.
 */
export const sanitizedStringSchema = z.string().trim();

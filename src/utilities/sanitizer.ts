import { z } from "zod";

const HTML_ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/**
 * Branded type for strings that have been HTML-escaped for safe output.
 * Use `escapeHTML()` to create instances of this type.
 */
export type HTMLSafeString = string & { readonly __brand: "HTMLSafeString" };

/**
 * Branded type for strings that have been sanitized (trimmed, normalized) for input.
 * Use `sanitizeInput()` to create instances of this type.
 * This is for INPUT normalization, not OUTPUT escaping.
 */
export type SanitizedInputString = string & {
	readonly __brand: "SanitizedInputString";
};

/**
 * Escapes HTML characters in a string to prevent XSS attacks.
 * @param str - The string to escape.
 * @returns - The escaped string, or the input if it was null/undefined.
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
	if (str === null || str === undefined) {
		return str;
	}
	return str.replace(
		/[&<>"']/g,
		(tag) => HTML_ESCAPE_MAP[tag] || tag,
	) as HTMLSafeString;
}

/**
 * Sanitizes user input by trimming whitespace and normalizing the string.
 * This is for INPUT normalization, not OUTPUT escaping.
 * @param str - The string to sanitize.
 * @returns - The sanitized (trimmed) string with branded type.
 */
export function sanitizeInput(str: string): SanitizedInputString;
export function sanitizeInput(str: string | null): SanitizedInputString | null;
export function sanitizeInput(
	str: string | undefined,
): SanitizedInputString | undefined;
export function sanitizeInput(
	str: string | null | undefined,
): SanitizedInputString | null | undefined;
export function sanitizeInput(
	str: string | null | undefined,
): SanitizedInputString | null | undefined {
	if (str === null || str === undefined) {
		return str;
	}
	return str.trim() as SanitizedInputString;
}

/**
 * Type guard to check if a value is a SanitizedInputString.
 * At runtime, this just checks if it's a trimmed string (may be empty).
 * The branded type provides compile-time safety.
 * @param value - The value to check.
 * @returns - True if the value appears to be sanitized input.
 */
export function isSanitizedInput(
	value: unknown,
): value is SanitizedInputString {
	return typeof value === "string" && value === value.trim();
}

/**
 * Zod schema for a string that is automatically sanitized (trimmed).
 * Note: This returns a plain string to allow chaining with .min()/.max().
 * Use `sanitizeInput()` if you need the branded SanitizedInputString type.
 * Note: This does NOT escape HTML. HTML escaping should be done at output time.
 */
export const sanitizedStringSchema = z.string().trim();

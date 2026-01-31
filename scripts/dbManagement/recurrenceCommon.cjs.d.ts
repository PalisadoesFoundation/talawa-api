/** Shared recurrence helpers (CJS) - type declarations for ESM import */

declare module "./recurrenceCommon.cjs" {
	export const BYDAY_TO_DOW: Record<string, number>;
	export function parseDate(
		date: string | number | Date | null | undefined,
	): Date | null;
}

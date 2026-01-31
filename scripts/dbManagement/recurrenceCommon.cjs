"use strict";

/**
 * Shared recurrence helpers for CJS (e.g. generateRecurringInstances.cjs) and ESM (helpers.ts).
 * Single source of truth for BYDAY_TO_DOW and parseDate to avoid duplication.
 */

const BYDAY_TO_DOW = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

/**
 * Parses a date string/number/Date and returns a Date or null if invalid.
 * Guards against null/undefined so nullable timestamp fields are not corrupted to epoch.
 * @param {string | number | Date | null | undefined} s - Value to parse
 * @returns {Date | null}
 */
function parseDate(s) {
	if (s === null || s === undefined) {
		return null;
	}
	if (typeof s !== "string" && typeof s !== "number" && !(s instanceof Date)) {
		return null;
	}
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { BYDAY_TO_DOW, parseDate };

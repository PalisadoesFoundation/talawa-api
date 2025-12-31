/**
 * Recurring event utilities.
 *
 * This module provides utilities for managing recurring events, including:
 * - Building and formatting RRULE strings (RFC 5545 compliant)
 * - Validating recurrence input and rules
 * - Calculating completion dates and instance counts
 * - Type predicates for event classification
 * - Applying overrides to recurring events
 */

// ==========================================
// Calculation utilities
// ==========================================
export {
	applyRecurrenceOverrides,
	calculateCompletionDateFromCount,
	calculateInstancesPerMonth,
	estimateInstanceCount,
	normalizeRecurrenceRule,
} from "./calculation";
// ==========================================
// Formatting utilities
// ==========================================
export { buildRRuleString } from "./formatting";
// ==========================================
// Type predicates and utilities
// ==========================================
export {
	getEventType,
	isCountBasedEvent,
	isEndDateBasedEvent,
	isNeverEndingEvent,
} from "./types";
// ==========================================
// Validation utilities
// ==========================================
export { validateRecurrenceInput, validateRecurrenceRule } from "./validation";

import { describe, expect, it } from "vitest";
import {
	queryActionItemsByOrgInputSchema,
	queryActionItemsByVolunteerGroupInputSchema,
	queryActionItemsByVolunteerInputSchema,
} from "~/src/graphql/inputs/QueryActionItemInput";

/**
 * Tests for queryActionItemsByVolunteerInputSchema validation.
 * Validates volunteerId (required UUID) and organizationId (optional UUID).
 */
describe("queryActionItemsByVolunteerInputSchema", () => {
	const validVolunteerUuid = "550e8400-e29b-41d4-a716-446655440000";
	const validOrgUuid = "660e8400-e29b-41d4-a716-446655440001";

	describe("valid inputs", () => {
		it("should accept valid UUID string for volunteerId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerId).toBe(validVolunteerUuid);
			}
		});

		it("should accept valid UUID for optional organizationId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
				organizationId: validOrgUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerId).toBe(validVolunteerUuid);
				expect(result.data.organizationId).toBe(validOrgUuid);
			}
		});

		it("should succeed when organizationId is omitted (optional field)", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerId).toBe(validVolunteerUuid);
				expect(result.data.organizationId).toBeUndefined();
			}
		});
	});

	describe("volunteerId field validation", () => {
		it("should reject invalid UUID for volunteerId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasVolunteerIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("volunteerId") ||
						issue.message.toLowerCase().includes("uuid"),
				);
				expect(hasVolunteerIdIssue).toBe(true);
			}
		});

		it("should reject when volunteerId is omitted (required field)", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				organizationId: validOrgUuid,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasVolunteerIdIssue = result.error.issues.some((issue) =>
					issue.path.includes("volunteerId"),
				);
				expect(hasVolunteerIdIssue).toBe(true);
			}
		});

		it("should reject empty string for volunteerId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null for volunteerId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject undefined for volunteerId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: undefined,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("organizationId field validation", () => {
		it("should reject invalid UUID for organizationId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
				organizationId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasOrgIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("organizationId") ||
						issue.message.toLowerCase().includes("uuid"),
				);
				expect(hasOrgIdIssue).toBe(true);
			}
		});

		it("should reject empty string for organizationId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
				organizationId: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null for organizationId", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: validVolunteerUuid,
				organizationId: null,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should reject completely empty input", () => {
			const result = queryActionItemsByVolunteerInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should accept valid UUIDs with different formats (lowercase)", () => {
			const lowercaseUuid = "a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890";
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: lowercaseUuid,
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid UUIDs with different formats (uppercase)", () => {
			const uppercaseUuid = "A1B2C3D4-E5F6-4789-A1B2-C3D4E5F67890";
			const result = queryActionItemsByVolunteerInputSchema.safeParse({
				volunteerId: uppercaseUuid,
			});
			expect(result.success).toBe(true);
		});
	});
});

/**
 * Tests for queryActionItemsByOrgInputSchema validation.
 * Validates organizationId (required UUID).
 */
describe("queryActionItemsByOrgInputSchema", () => {
	const validOrgUuid = "550e8400-e29b-41d4-a716-446655440000";

	describe("valid inputs", () => {
		it("should accept valid UUID string for organizationId", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: validOrgUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.organizationId).toBe(validOrgUuid);
			}
		});
	});

	describe("organizationId field validation", () => {
		it("should reject invalid UUID for organizationId", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasOrgIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("organizationId") ||
						issue.message.toLowerCase().includes("uuid"),
				);
				expect(hasOrgIdIssue).toBe(true);
			}
		});

		it("should reject when organizationId is omitted (required field)", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasOrgIdIssue = result.error.issues.some((issue) =>
					issue.path.includes("organizationId"),
				);
				expect(hasOrgIdIssue).toBe(true);
			}
		});

		it("should reject empty string for organizationId", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null for organizationId", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject undefined for organizationId", () => {
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: undefined,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should accept valid UUIDs with different formats (lowercase)", () => {
			const lowercaseUuid = "a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890";
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: lowercaseUuid,
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid UUIDs with different formats (uppercase)", () => {
			const uppercaseUuid = "A1B2C3D4-E5F6-4789-A1B2-C3D4E5F67890";
			const result = queryActionItemsByOrgInputSchema.safeParse({
				organizationId: uppercaseUuid,
			});
			expect(result.success).toBe(true);
		});
	});
});

/**
 * Tests for queryActionItemsByVolunteerGroupInputSchema validation.
 * Validates volunteerGroupId (required UUID) and organizationId (optional UUID).
 */
describe("queryActionItemsByVolunteerGroupInputSchema", () => {
	const validVolunteerGroupUuid = "550e8400-e29b-41d4-a716-446655440000";
	const validOrgUuid = "660e8400-e29b-41d4-a716-446655440001";

	describe("valid inputs", () => {
		it("should accept valid UUID string for volunteerGroupId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerGroupId).toBe(validVolunteerGroupUuid);
			}
		});

		it("should accept valid UUID for optional organizationId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
				organizationId: validOrgUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerGroupId).toBe(validVolunteerGroupUuid);
				expect(result.data.organizationId).toBe(validOrgUuid);
			}
		});

		it("should succeed when organizationId is omitted (optional field)", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.volunteerGroupId).toBe(validVolunteerGroupUuid);
				expect(result.data.organizationId).toBeUndefined();
			}
		});
	});

	describe("volunteerGroupId field validation", () => {
		it("should reject invalid UUID for volunteerGroupId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasVolunteerGroupIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("volunteerGroupId") ||
						issue.message.toLowerCase().includes("uuid"),
				);
				expect(hasVolunteerGroupIdIssue).toBe(true);
			}
		});

		it("should reject when volunteerGroupId is omitted (required field)", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				organizationId: validOrgUuid,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasVolunteerGroupIdIssue = result.error.issues.some((issue) =>
					issue.path.includes("volunteerGroupId"),
				);
				expect(hasVolunteerGroupIdIssue).toBe(true);
			}
		});

		it("should reject empty string for volunteerGroupId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null for volunteerGroupId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: null,
			});
			expect(result.success).toBe(false);
		});

		it("should reject undefined for volunteerGroupId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: undefined,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("organizationId field validation", () => {
		it("should reject invalid UUID for organizationId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
				organizationId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				const hasOrgIdIssue = result.error.issues.some(
					(issue) =>
						issue.path.includes("organizationId") ||
						issue.message.toLowerCase().includes("uuid"),
				);
				expect(hasOrgIdIssue).toBe(true);
			}
		});

		it("should reject empty string for organizationId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
				organizationId: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject null for organizationId", () => {
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: validVolunteerGroupUuid,
				organizationId: null,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should accept valid UUIDs with different formats (lowercase)", () => {
			const lowercaseUuid = "a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890";
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: lowercaseUuid,
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid UUIDs with different formats (uppercase)", () => {
			const uppercaseUuid = "A1B2C3D4-E5F6-4789-A1B2-C3D4E5F67890";
			const result = queryActionItemsByVolunteerGroupInputSchema.safeParse({
				volunteerGroupId: uppercaseUuid,
			});
			expect(result.success).toBe(true);
		});
	});
});

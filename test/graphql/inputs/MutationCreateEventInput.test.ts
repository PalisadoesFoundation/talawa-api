import { describe, expect, it } from "vitest";
import { mutationCreateEventInputSchema } from "~/src/graphql/inputs/MutationCreateEventInput";

/**
 * Tests for MutationCreateEventInput schema validation.
 * Validates name, description, and location field trimming and length constraints.
 */
describe("MutationCreateEventInput Schema", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Valid Event Name",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
	};

	describe("name field", () => {
		it("should accept valid name", () => {
			const result = mutationCreateEventInputSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should accept minimal input with only required fields", () => {
			const minimalInput = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
				name: "Minimal Event",
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			};
			const result = mutationCreateEventInputSchema.safeParse(minimalInput);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.organizationId).toBe(minimalInput.organizationId);
				expect(result.data.name).toBe(minimalInput.name);
				expect(result.data.startAt).toEqual(minimalInput.startAt);
				expect(result.data.endAt).toEqual(minimalInput.endAt);
				// Optional fields should be undefined
				expect(result.data.description).toBeUndefined();
				expect(result.data.location).toBeUndefined();
			}
		});

		it("should trim whitespace from name", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				name: "  trimmed name  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe("trimmed name");
			}
		});

		it("should reject whitespace-only name", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				name: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string name", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding 256 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				name: "a".repeat(257),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name at exactly 256 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				name: "a".repeat(256),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("description field", () => {
		it("should accept valid description", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "Valid event description",
			});
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from description", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "  trimmed description  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBe("trimmed description");
			}
		});

		it("should reject whitespace-only description", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding 2048 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2049),
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string description", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should accept description at exactly 2048 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				description: "a".repeat(2048),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("location field", () => {
		it("should accept valid location", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "Conference Room A",
			});
			expect(result.success).toBe(true);
		});

		it("should trim whitespace from location", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "  trimmed location  ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.location).toBe("trimmed location");
			}
		});

		it("should reject location exceeding 1024 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "a".repeat(1025),
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty string location", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject whitespace-only location", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "   ",
			});
			expect(result.success).toBe(false);
		});

		it("should accept location at exactly 1024 characters", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				location: "a".repeat(1024),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("date validation", () => {
		it("should reject endAt before startAt", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T10:00:00Z"),
			});
			expect(result.success).toBe(false);
		});

		it("should reject endAt equal to startAt", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T12:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(false);
		});

		it("should accept endAt after startAt", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				startAt: new Date("2024-01-01T10:00:00Z"),
				endAt: new Date("2024-01-01T12:00:00Z"),
			});
			expect(result.success).toBe(true);
		});
	});
});

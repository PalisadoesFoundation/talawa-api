import { describe, expect, it } from "vitest";
import { mutationCreateEventInputSchema } from "~/src/graphql/inputs/MutationCreateEventInput";

/**
 * Tests for event attachment file upload validation.
 * Validates array count limits for file uploads.
 */
describe("MutationCreateEventInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Event",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
	};

	describe("attachments array limits", () => {
		it("should validate base input structure without attachments", () => {
			// Note: Schema allows .max(20) attachments
			// Just testing schema structure accepts base input, actual FileUpload validation happens at mutation level
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
			});
			expect(result.success).toBe(true);
		});

		it("should accept events without attachments", () => {
			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: undefined,
			});
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max(20) limit", () => {
			// Create 21 mock attachment promises to exceed the max(20) limit
			const tooManyAttachments = Array.from({ length: 21 }, () =>
				Promise.resolve({
					filename: "test.jpg",
					mimetype: "image/jpeg",
					encoding: "7bit",
					createReadStream: () => null,
				}),
			);

			const result = mutationCreateEventInputSchema.safeParse({
				...validInput,
				attachments: tooManyAttachments,
			});
			expect(result.success).toBe(false);
		});
	});
	describe("MIME type validation (arguments schema transform)", () => {
		// Helper to create FileUpload-like objects
		function createMockFileUpload(filename: string, mimetype: string) {
			return Promise.resolve({
				filename,
				mimetype,
				encoding: "7bit",
				createReadStream: () =>
					require("stream").Readable.from(Buffer.from("test")),
			});
		}

		it("should accept valid image/png", async () => {
			const { mutationCreateEventArgumentsSchema } = await import(
				"~/src/graphql/types/Mutation/createEvent"
			);
			const result = await mutationCreateEventArgumentsSchema.safeParseAsync({
				input: {
					...validInput,
					attachments: [createMockFileUpload("test.png", "image/png")],
				},
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/jpeg", async () => {
			const { mutationCreateEventArgumentsSchema } = await import(
				"~/src/graphql/types/Mutation/createEvent"
			);
			const result = await mutationCreateEventArgumentsSchema.safeParseAsync({
				input: {
					...validInput,
					attachments: [createMockFileUpload("test.jpg", "image/jpeg")],
				},
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid MIME type application/pdf", async () => {
			const { mutationCreateEventArgumentsSchema } = await import(
				"~/src/graphql/types/Mutation/createEvent"
			);
			const result = await mutationCreateEventArgumentsSchema.safeParseAsync({
				input: {
					...validInput,
					attachments: [createMockFileUpload("test.pdf", "application/pdf")],
				},
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["input", "attachments", 0],
							message: 'Mime type "application/pdf" is not allowed.',
						}),
					]),
				);
			}
		});

		it("should reject invalid MIME type text/plain", async () => {
			const { mutationCreateEventArgumentsSchema } = await import(
				"~/src/graphql/types/Mutation/createEvent"
			);
			const result = await mutationCreateEventArgumentsSchema.safeParseAsync({
				input: {
					...validInput,
					attachments: [createMockFileUpload("test.txt", "text/plain")],
				},
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["input", "attachments", 0],
							message: 'Mime type "text/plain" is not allowed.',
						}),
					]),
				);
			}
		});

		it("should handle mixed valid and invalid MIME types", async () => {
			const { mutationCreateEventArgumentsSchema } = await import(
				"~/src/graphql/types/Mutation/createEvent"
			);
			const result = await mutationCreateEventArgumentsSchema.safeParseAsync({
				input: {
					...validInput,
					attachments: [
						createMockFileUpload("valid.png", "image/png"),
						createMockFileUpload("invalid.txt", "text/plain"),
					],
				},
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["input", "attachments", 1],
							message: 'Mime type "text/plain" is not allowed.',
						}),
					]),
				);
			}
		});
	});
});

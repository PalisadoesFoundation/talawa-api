import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { mutationCreateAdvertisementInputSchema } from "~/src/graphql/inputs/MutationCreateAdvertisementInput";
import { mutationCreateAdvertisementArgumentsSchema } from "~/src/graphql/types/Mutation/createAdvertisement";

/**
 * Tests for advertisement attachment file upload validation.
 * Tests both array limits (input schema) and MIME type validation (arguments schema).
 */
describe("MutationCreateAdvertisementInput - Attachment Validation", () => {
	const validInput = {
		organizationId: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Advertisement",
		description: "Test description",
		startAt: new Date("2024-01-01T10:00:00Z"),
		endAt: new Date("2024-01-01T12:00:00Z"),
		type: "banner" as const,
	};

	// Helper to create FileUpload-like objects with proper createReadStream
	function createMockFileUpload(filename: string, mimetype: string) {
		return Promise.resolve({
			filename,
			mimetype,
			encoding: "7bit",
			createReadStream: () => Readable.from(Buffer.from("test content")),
		});
	}

	describe("attachments array limits (input schema)", () => {
		it("should reject when attachments is empty array", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments: [],
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues.length > 0) {
				expect(result.error.issues[0]?.message).toContain("Too small");
			}
		});

		it("should accept advertisement without attachments field", () => {
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.attachments).toBeUndefined();
			}
		});

		it("should accept exactly 1 attachment (lower boundary)", async () => {
			const result =
				await mutationCreateAdvertisementInputSchema.safeParseAsync({
					...validInput,
					attachments: [createMockFileUpload("test.jpg", "image/jpeg")],
				});
			expect(result.success).toBe(true);
		});

		it("should accept exactly 20 attachments (upper boundary)", async () => {
			const attachments = Array.from({ length: 20 }, (_, i) =>
				createMockFileUpload(`test${i}.jpg`, "image/jpeg"),
			);
			const result =
				await mutationCreateAdvertisementInputSchema.safeParseAsync({
					...validInput,
					attachments,
				});
			expect(result.success).toBe(true);
		});

		it("should reject when attachments exceed max (21 attachments)", () => {
			const attachments = Array.from({ length: 21 }, (_, i) =>
				createMockFileUpload(`test${i}.jpg`, "image/jpeg"),
			);
			const result = mutationCreateAdvertisementInputSchema.safeParse({
				...validInput,
				attachments,
			});
			expect(result.success).toBe(false);
			if (!result.success && result.error.issues.length > 0) {
				expect(result.error.issues[0]?.message).toContain("Too big");
			}
		});
	});

	describe("MIME type validation (arguments schema transform)", () => {
		it("should accept valid image/png", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.png", "image/png")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/jpeg", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.jpg", "image/jpeg")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/webp", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.webp", "image/webp")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should accept valid image/avif", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.avif", "image/avif")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should accept valid video/mp4", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.mp4", "video/mp4")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should accept valid video/webm", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [createMockFileUpload("test.webm", "video/webm")],
					},
				});
			expect(result.success).toBe(true);
		});

		it("should reject invalid MIME type text/plain", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
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

		it("should reject invalid MIME type application/pdf", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
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

		it("should handle mixed valid and invalid MIME types", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [
							createMockFileUpload("valid.png", "image/png"),
							createMockFileUpload("invalid.txt", "text/plain"),
							createMockFileUpload("valid2.mp4", "video/mp4"),
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

		it("should reject multiple invalid MIME types with correct paths", async () => {
			const result =
				await mutationCreateAdvertisementArgumentsSchema.safeParseAsync({
					input: {
						...validInput,
						attachments: [
							createMockFileUpload("invalid1.txt", "text/plain"),
							createMockFileUpload("valid.png", "image/png"),
							createMockFileUpload("invalid2.pdf", "application/pdf"),
						],
					},
				});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: ["input", "attachments", 0],
							message: 'Mime type "text/plain" is not allowed.',
						}),
						expect.objectContaining({
							path: ["input", "attachments", 2],
							message: 'Mime type "application/pdf" is not allowed.',
						}),
					]),
				);
			}
		});
	});
});

import type { FastifyReply } from "fastify";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { zReplyParsed } from "~/src/routes/validation/zodReply";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

// Mock Fastify reply object with mock function types

function createMockReply() {
	const statusMock = vi.fn().mockReturnThis();
	const sendMock = vi.fn().mockReturnThis();

	const reply = {
		request: {
			id: "test-request-id-123",
		},
		status: statusMock,
		send: sendMock,
	};

	return reply as unknown as FastifyReply & {
		status: Mock;
		send: Mock;
	};
}

describe("zReplyParsed", () => {
	const testSchema = z.object({
		name: z.string().min(1, "Name is required"),
		age: z.number().min(18, "Must be at least 18"),
		email: z.string().email("Must be a valid email"),
	});

	let mockReply: ReturnType<typeof createMockReply>;

	beforeEach(() => {
		mockReply = createMockReply();
	});

	describe("successful validation", () => {
		it("returns parsed data when validation succeeds", async () => {
			const validData = {
				name: "John Doe",
				age: 25,
				email: "john@example.com",
			};

			const result = await zReplyParsed(mockReply, testSchema, validData);

			expect(result).toEqual(validData);
			expect(mockReply.status).not.toHaveBeenCalled();
			expect(mockReply.send).not.toHaveBeenCalled();
		});

		it("applies transformations from schema", async () => {
			const schemaWithTransform = z.object({
				name: z.string().transform((s) => s.toUpperCase()),
			});

			const result = await zReplyParsed(mockReply, schemaWithTransform, {
				name: "john",
			});

			expect(result?.name).toBe("JOHN");
		});

		it("handles nested objects", async () => {
			const nestedSchema = z.object({
				user: z.object({
					name: z.string(),
					profile: z.object({
						bio: z.string(),
					}),
				}),
			});

			const validData = {
				user: {
					name: "John",
					profile: {
						bio: "Developer",
					},
				},
			};

			const result = await zReplyParsed(mockReply, nestedSchema, validData);

			expect(result).toEqual(validData);
		});
	});

	describe("validation failures", () => {
		it("returns undefined when validation fails", async () => {
			const invalidData = {
				name: "",
				age: 15,
				email: "not-an-email",
			};

			// The function sends error and returns undefined
			const result = await zReplyParsed(mockReply, testSchema, invalidData);

			expect(result).toBeUndefined();
			expect(mockReply.status).toHaveBeenCalledWith(400);
			expect(mockReply.send).toHaveBeenCalled();
		});

		it("sends 400 status code on validation failure", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			expect(mockReply.status).toHaveBeenCalledWith(400);
		});

		it("includes error code in response", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						code: ErrorCode.INVALID_ARGUMENTS,
					}),
				}),
			);
		});

		it("includes error message in response", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						message: "Invalid request body",
					}),
				}),
			);
		});

		it("includes flattened error details", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			const sendCall = mockReply.send.mock.calls[0]?.[0];
			expect(sendCall?.error.details).toBeDefined();
			expect(sendCall?.error.details).toHaveProperty("fieldErrors");
			expect(sendCall?.error.details).toHaveProperty("formErrors");
		});

		it("includes correlation ID from request", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						correlationId: "test-request-id-123",
					}),
				}),
			);
		});

		it("includes all validation errors in flattened format", async () => {
			const invalidData = {
				name: "",
				age: 15,
				email: "not-an-email",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			const sendCall = mockReply.send.mock.calls[0]?.[0];
			const fieldErrors = sendCall?.error.details.fieldErrors;

			expect(fieldErrors).toHaveProperty("name");
			expect(fieldErrors).toHaveProperty("age");
			expect(fieldErrors).toHaveProperty("email");
		});

		it("includes error messages in field errors", async () => {
			const invalidData = {
				name: "John",
				age: 15,
				email: "john@example.com",
			};

			await zReplyParsed(mockReply, testSchema, invalidData);

			const sendCall = mockReply.send.mock.calls[0]?.[0];
			const fieldErrors = sendCall?.error.details.fieldErrors;

			expect(fieldErrors?.age).toContain("Must be at least 18");
		});

		it("handles nested validation errors", async () => {
			const nestedSchema = z.object({
				user: z.object({
					name: z.string().min(1),
					age: z.number().min(18),
				}),
			});

			const invalidData = {
				user: {
					name: "",
					age: 15,
				},
			};

			await zReplyParsed(mockReply, nestedSchema, invalidData);

			const sendCall = mockReply.send.mock.calls[0]?.[0];
			const fieldErrors = sendCall?.error.details.fieldErrors;

			// Zod's flatten() creates nested structure: { user: [errors...] }
			expect(fieldErrors?.user).toBeDefined();
			expect(Array.isArray(fieldErrors?.user)).toBe(true);
		});

		it("handles array validation errors", async () => {
			const arraySchema = z.object({
				items: z.array(z.string().min(1)),
			});

			const invalidData = {
				items: ["valid", "", "also-valid"],
			};

			await zReplyParsed(mockReply, arraySchema, invalidData);

			const sendCall = mockReply.send.mock.calls[0]?.[0];
			const fieldErrors = sendCall?.error.details.fieldErrors;

			// Zod's flatten() creates: { items: [errors...] }
			expect(fieldErrors?.items).toBeDefined();
			expect(Array.isArray(fieldErrors?.items)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("handles empty object schema", async () => {
			const emptySchema = z.object({});

			const result = await zReplyParsed(mockReply, emptySchema, {});

			expect(result).toEqual({});
		});

		it("handles schema with defaults", async () => {
			const schemaWithDefaults = z.object({
				name: z.string(),
				role: z.string().default("user"),
			});

			const result = await zReplyParsed(mockReply, schemaWithDefaults, {
				name: "John",
			});

			expect(result?.role).toBe("user");
		});

		it("handles schema with optional fields", async () => {
			const schemaWithOptional = z.object({
				required: z.string(),
				optional: z.string().optional(),
			});

			const result = await zReplyParsed(mockReply, schemaWithOptional, {
				required: "test",
			});

			expect(result?.optional).toBeUndefined();
		});
	});

	describe("TypeScript type inference", () => {
		it("infers correct type for simple schema", async () => {
			const simpleSchema = z.object({
				id: z.string(),
				count: z.number(),
			});

			const result = await zReplyParsed(mockReply, simpleSchema, {
				id: "123",
				count: 42,
			});

			if (result) {
				// Type check - this should compile without errors
				const id: string = result.id;
				const count: number = result.count;
				expect(id).toBe("123");
				expect(count).toBe(42);
			}
		});

		it("returns undefined type on validation failure", async () => {
			// Type should be inferred type | undefined
			// Verify error was sent instead of checking return value
			void (await zReplyParsed(mockReply, testSchema, {
				name: "",
				age: 15,
				email: "invalid",
			}));

			expect(mockReply.status).toHaveBeenCalledWith(400);
			expect(mockReply.send).toHaveBeenCalled();
		});
	});
});

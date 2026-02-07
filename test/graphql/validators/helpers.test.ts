import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zParseOrThrow } from "~/src/graphql/validators/helpers";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("zParseOrThrow", () => {
	const testSchema = z.object({
		name: z.string().min(1, "Name is required"),
		age: z.number().min(18, "Must be at least 18"),
		email: z.string().email("Must be a valid email"),
	});

	describe("successful validation", () => {
		it("returns parsed data when validation succeeds", async () => {
			const validData = {
				name: "John Doe",
				age: 25,
				email: "john@example.com",
			};

			const result = await zParseOrThrow(testSchema, validData);

			expect(result).toEqual(validData);
		});

		it("applies transformations from schema", async () => {
			const schemaWithTransform = z.object({
				name: z.string().transform((s) => s.toUpperCase()),
			});

			const result = await zParseOrThrow(schemaWithTransform, {
				name: "john",
			});

			expect(result.name).toBe("JOHN");
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

			const result = await zParseOrThrow(nestedSchema, validData);

			expect(result).toEqual(validData);
		});
	});

	describe("validation failures", () => {
		it("throws TalawaGraphQLError when validation fails", async () => {
			const invalidData = {
				name: "",
				age: 15,
				email: "not-an-email",
			};

			await expect(zParseOrThrow(testSchema, invalidData)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});

		it("uses invalid_arguments error code", async () => {
			const invalidData = {
				name: "",
				age: 25,
				email: "john@example.com",
			};

			try {
				await zParseOrThrow(testSchema, invalidData);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				expect(gqlError.extensions.code).toBe("invalid_arguments");
			}
		});

		it("includes argumentPath in error issues", async () => {
			const invalidData = {
				name: "John",
				age: 15,
				email: "john@example.com",
			};

			try {
				await zParseOrThrow(testSchema, invalidData);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				expect(gqlError.extensions.code).toBe("invalid_arguments");
				const issues = gqlError.extensions.issues as {
					argumentPath: unknown[];
					message: string;
				}[];
				expect(issues).toBeDefined();
				expect(issues.length).toBeGreaterThan(0);
				expect(issues[0]).toHaveProperty("argumentPath");
				expect(issues[0]?.argumentPath).toEqual(["age"]);
			}
		});

		it("includes error message in issues", async () => {
			const invalidData = {
				name: "John",
				age: 15,
				email: "john@example.com",
			};

			try {
				await zParseOrThrow(testSchema, invalidData);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				const issues = gqlError.extensions.issues as {
					argumentPath: unknown[];
					message: string;
				}[];
				expect(issues[0]).toHaveProperty("message");
				expect(issues[0]?.message).toBe("Must be at least 18");
			}
		});

		it("includes all validation errors", async () => {
			const invalidData = {
				name: "",
				age: 15,
				email: "not-an-email",
			};

			try {
				await zParseOrThrow(testSchema, invalidData);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				const issues = gqlError.extensions.issues as {
					argumentPath: unknown[];
					message: string;
				}[];
				expect(issues.length).toBe(3);

				// Check that all fields are reported
				const paths = issues.map((issue) => issue.argumentPath.join("."));
				expect(paths).toContain("name");
				expect(paths).toContain("age");
				expect(paths).toContain("email");
			}
		});

		it("handles nested validation errors with correct paths", async () => {
			const nestedSchema = z.object({
				input: z.object({
					user: z.object({
						age: z.number().min(18),
					}),
				}),
			});

			const invalidData = {
				input: {
					user: {
						age: 15,
					},
				},
			};

			try {
				await zParseOrThrow(nestedSchema, invalidData);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				const issues = gqlError.extensions.issues as {
					argumentPath: unknown[];
					message: string;
				}[];
				expect(issues[0]?.argumentPath).toEqual(["input", "user", "age"]);
			}
		});

		it("handles array validation errors with indices", async () => {
			const arraySchema = z.object({
				items: z.array(z.string().min(1)),
			});

			const invalidData = {
				items: ["valid", "", "also-valid"],
			};

			try {
				await zParseOrThrow(arraySchema, invalidData);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const gqlError = error as TalawaGraphQLError;
				const issues = gqlError.extensions.issues as {
					argumentPath: unknown[];
					message: string;
				}[];
				expect(issues[0]?.argumentPath).toEqual(["items", 1]);
			}
		});
	});

	describe("TypeScript type inference", () => {
		it("infers correct type for simple schema", async () => {
			const simpleSchema = z.object({
				id: z.string(),
				count: z.number(),
			});

			const result = await zParseOrThrow(simpleSchema, {
				id: "123",
				count: 42,
			});

			// Type check - this should compile without errors
			const id: string = result.id;
			const count: number = result.count;
			expect(id).toBe("123");
			expect(count).toBe(42);
		});

		it("infers correct type with optional fields", async () => {
			const schemaWithOptional = z.object({
				required: z.string(),
				optional: z.string().optional(),
			});

			const result = await zParseOrThrow(schemaWithOptional, {
				required: "test",
			});

			// Type check - optional should be string | undefined
			const optional: string | undefined = result.optional;
			expect(optional).toBeUndefined();
		});
	});
});

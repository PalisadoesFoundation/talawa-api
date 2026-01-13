import envSchema from "env-schema";
import { type Static, Type } from "typebox";
import { describe, expect, it } from "vitest";
import { envSchemaAjv } from "~/src/envConfigSchema";

describe("envConfigSchema format validators", () => {
	describe("json format validator", () => {
		const jsonSchema = Type.Object({
			testField: Type.String({
				format: "json",
			}),
		});

		it("should validate valid JSON object", () => {
			const config = envSchema<Static<typeof jsonSchema>>({
				ajv: envSchemaAjv,
				schema: jsonSchema,
				data: {
					testField: '{"key": "value"}',
				},
			});

			expect(config.testField).toBe('{"key": "value"}');
		});

		it("should reject JSON array", () => {
			expect(() => {
				envSchema<Static<typeof jsonSchema>>({
					ajv: envSchemaAjv,
					schema: jsonSchema,
					data: {
						testField: '["array", "not", "object"]',
					},
				});
			}).toThrow();
		});

		it("should reject JSON null", () => {
			expect(() => {
				envSchema<Static<typeof jsonSchema>>({
					ajv: envSchemaAjv,
					schema: jsonSchema,
					data: {
						testField: "null",
					},
				});
			}).toThrow();
		});

		it("should reject JSON primitive", () => {
			expect(() => {
				envSchema<Static<typeof jsonSchema>>({
					ajv: envSchemaAjv,
					schema: jsonSchema,
					data: {
						testField: '"string"',
					},
				});
			}).toThrow();
		});

		it("should reject invalid JSON string (catch block coverage)", () => {
			// Test line 618: catch block when JSON.parse throws
			expect(() => {
				envSchema<Static<typeof jsonSchema>>({
					ajv: envSchemaAjv,
					schema: jsonSchema,
					data: {
						testField: "not valid json{",
					},
				});
			}).toThrow();
		});

		it("should reject malformed JSON", () => {
			expect(() => {
				envSchema<Static<typeof jsonSchema>>({
					ajv: envSchemaAjv,
					schema: jsonSchema,
					data: {
						testField: "{key: value}",
					},
				});
			}).toThrow();
		});
	});

	describe("cron format validator", () => {
		const cronSchema = Type.Object({
			testField: Type.String({
				format: "cron",
			}),
		});

		it("should validate valid cron expression", () => {
			// Test lines 626-627: cron format validator definition
			const config = envSchema<Static<typeof cronSchema>>({
				ajv: envSchemaAjv,
				schema: cronSchema,
				data: {
					testField: "*/5 * * * *",
				},
			});

			expect(config.testField).toBe("*/5 * * * *");
		});

		it("should validate another valid cron expression", () => {
			const config = envSchema<Static<typeof cronSchema>>({
				ajv: envSchemaAjv,
				schema: cronSchema,
				data: {
					testField: "0 2 * * *",
				},
			});

			expect(config.testField).toBe("0 2 * * *");
		});

		it("should reject invalid cron expression", () => {
			expect(() => {
				envSchema<Static<typeof cronSchema>>({
					ajv: envSchemaAjv,
					schema: cronSchema,
					data: {
						testField: "invalid cron",
					},
				});
			}).toThrow();
		});

		it("should reject empty string", () => {
			expect(() => {
				envSchema<Static<typeof cronSchema>>({
					ajv: envSchemaAjv,
					schema: cronSchema,
					data: {
						testField: "",
					},
				});
			}).toThrow();
		});

		it("should reject cron with too few fields", () => {
			expect(() => {
				envSchema<Static<typeof cronSchema>>({
					ajv: envSchemaAjv,
					schema: cronSchema,
					data: {
						testField: "* * * *",
					},
				});
			}).toThrow();
		});

		it("should reject cron with too many fields", () => {
			expect(() => {
				envSchema<Static<typeof cronSchema>>({
					ajv: envSchemaAjv,
					schema: cronSchema,
					data: {
						testField: "* * * * * *",
					},
				});
			}).toThrow();
		});
	});
});

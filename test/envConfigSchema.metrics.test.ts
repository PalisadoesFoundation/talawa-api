import envSchema from "env-schema";
import { beforeEach, describe, expect, it } from "vitest";
import { envConfigSchema, envSchemaAjv } from "~/src/envConfigSchema";

describe("envConfigSchema - Metrics Configuration", () => {
	beforeEach(() => {
		// Clear env vars before each test
		delete process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE;
		delete process.env.API_METRICS_AGGREGATION_ENABLED;
		delete process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT;
		delete process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES;
	});

	describe("API_METRICS_AGGREGATION_CRON_SCHEDULE", () => {
		it("should accept valid cron schedule", () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/5 * * * *";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("*/5 * * * *");
		});

		it("should accept custom cron schedule", () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/10 * * * *";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("*/10 * * * *");
		});

		it("should be optional (undefined when not set)", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBeUndefined();
		});

		it("should reject invalid cron format (too short)", () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/5";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should accept string that meets minLength but is semantically invalid cron (schema only enforces length)", () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "123456789";

			// The schema only enforces minLength:9, not semantic cron validation
			// This test verifies that envSchema accepts it (doesn't throw)
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("123456789");
		});
	});

	describe("API_METRICS_AGGREGATION_ENABLED", () => {
		it("should accept true", () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "true";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_ENABLED).toBe(true);
		});

		it("should accept false", () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "false";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_ENABLED).toBe(false);
		});

		it("should default to true when not set", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_ENABLED).toBe(true);
		});
	});

	describe("API_METRICS_SNAPSHOT_RETENTION_COUNT", () => {
		it("should accept valid integer", () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "500";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe(500);
		});

		it("should default to 1000 when not set", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe(1000);
		});

		it("should reject values less than 1", () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "0";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should reject negative values", () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "-1";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should reject non-numeric values", () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "invalid";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should be optional", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBeDefined();
		});
	});

	describe("API_METRICS_AGGREGATION_WINDOW_MINUTES", () => {
		it("should accept valid integer", () => {
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "10";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe(10);
		});

		it("should default to 5 when not set", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe(5);
		});

		it("should reject values less than 1", () => {
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "0";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should reject negative values", () => {
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "-1";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should reject non-numeric values", () => {
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "invalid";

			expect(() => {
				envSchema({
					ajv: envSchemaAjv,
					schema: envConfigSchema,
					data: process.env,
				});
			}).toThrow();
		});

		it("should be optional", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBeDefined();
		});
	});

	describe("All metrics env vars together", () => {
		it("should accept all metrics configuration variables", () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/10 * * * *";
			process.env.API_METRICS_AGGREGATION_ENABLED = "true";
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "2000";
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "15";

			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBe("*/10 * * * *");
			expect(config.API_METRICS_AGGREGATION_ENABLED).toBe(true);
			expect(config.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe(2000);
			expect(config.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe(15);
		});

		it("should use defaults when all metrics vars are not set", () => {
			const config = envSchema({
				ajv: envSchemaAjv,
				schema: envConfigSchema,
				data: process.env,
			}) as Record<string, unknown>;

			expect(config.API_METRICS_AGGREGATION_CRON_SCHEDULE).toBeUndefined();
			expect(config.API_METRICS_AGGREGATION_ENABLED).toBe(true);
			expect(config.API_METRICS_SNAPSHOT_RETENTION_COUNT).toBe(1000);
			expect(config.API_METRICS_AGGREGATION_WINDOW_MINUTES).toBe(5);
		});
	});
});

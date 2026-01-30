import ajvFormats from "ajv-formats";
import type { EnvSchemaOpt } from "env-schema";
import { type Static, Type } from "typebox";
import { authConfigSchema } from "./envConfigSchema/auth";
import { baseConfigSchema } from "./envConfigSchema/base";
import { databaseConfigSchema } from "./envConfigSchema/database";
import { emailConfigSchema } from "./envConfigSchema/email";
import { graphqlConfigSchema } from "./envConfigSchema/graphql";
import { metricsConfigSchema } from "./envConfigSchema/metrics";
import { minioConfigSchema } from "./envConfigSchema/minio";
import { socialConfigSchema } from "./envConfigSchema/social";

/**
 * JSON schema of a record of environment variables accessible to the talawa api at runtime.
 */
export const envConfigSchema = Type.Object({
	...baseConfigSchema.properties,
	...authConfigSchema.properties,
	...databaseConfigSchema.properties,
	...emailConfigSchema.properties,
	...graphqlConfigSchema.properties,
	...metricsConfigSchema.properties,
	...minioConfigSchema.properties,
	...socialConfigSchema.properties,
});

/**
 * Type of the object containing parsed configuration environment variables.
 */
export type EnvConfig = Static<typeof envConfigSchema>;

/**
 * The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
 */
export const envSchemaAjv: EnvSchemaOpt["ajv"] = {
	customOptions: (ajvInstance) => {
		ajvFormats.default(ajvInstance, {
			formats: ["email", "uri"],
		});

		// Custom "json" format validator for fail-fast JSON object validation
		// Only accepts non-null objects (not arrays or primitives)
		ajvInstance.addFormat("json", {
			type: "string",
			validate: (value: string): boolean => {
				try {
					const parsed = JSON.parse(value);
					return (
						parsed !== null &&
						typeof parsed === "object" &&
						!Array.isArray(parsed)
					);
				} catch {
					return false;
				}
			},
		});

		return ajvInstance;
	},
};

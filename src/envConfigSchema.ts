import { type Static, Type } from "@sinclair/typebox";
import ajvFormats from "ajv-formats";
import type { EnvSchemaOpt } from "env-schema";

// THIS FILE CONTAINS JSON SCHEMA DEFINITIONS FOR ALL ENVIRONMENT VARIABLES PASSED TO THE EXECUTION CONTEXT OF TALAWA API FOR CONFIGURING IT.

/**
 * JSON schema of a record of environment variables accessible to the talawa api at runtime.
 */
export const envConfigSchema = Type.Composite([
	Type.Object({
		/**
		 * Used for providing the host of the domain on which talawa api will run.
		 */
		API_HOST: Type.String({
			minLength: 1,
		}),
		/**
		 * Used for providing the decision for whether to enable pretty logging with pino.js logger. It is useful to enable prettier logging in development environments for easier developer log comprehension.
		 */
		API_IS_PINO_PRETTY: Type.Boolean(),
		/**
		 * Used for providing the log level for the logger used in talawa api.
		 *
		 * @privateRemarks
		 * Log levels should only be changed when the developers know what they're doing. Otherwise the default log level should be used.
		 */
		API_LOG_LEVEL: Type.Enum({
			debug: "debug",
			error: "error",
			fatal: "fatal",
			info: "info",
			trace: "trace",
			warn: "warn",
		}),
		/**
		 * Used for providing the port of the domain on which the server will run.
		 */
		API_PORT: Type.Number({
			maximum: 65535,
			minimum: 0,
		}),
		/**
		 * Used for providing the secret for signing and verifying json web tokens by talawa api.
		 */
		API_JWT_SECRET: Type.String({
			minLength: 1,
		}),
	}),
]);

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
		return ajvInstance;
	},
};

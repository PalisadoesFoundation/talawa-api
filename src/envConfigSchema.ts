import { type Static, Type } from "@sinclair/typebox";
import ajvFormats from "ajv-formats";
import type { EnvSchemaOpt } from "env-schema";

/**
 * Enum for API log levels.
 */
const LogLevelEnum = {
	debug: "debug",
	error: "error",
	fatal: "fatal",
	info: "info",
	trace: "trace",
	warn: "warn",
} as const;

/**
 * JSON schema of a record of environment variables accessible to the Talawa API at runtime.
 */
export const envConfigSchema = Type.Object({
	API_ADMINISTRATOR_USER_EMAIL_ADDRESS: Type.String({ format: "email" }),
	API_ADMINISTRATOR_USER_NAME: Type.String({ minLength: 1, maxLength: 256 }),
	API_ADMINISTRATOR_USER_PASSWORD: Type.String({ minLength: 1 }),
	API_BASE_URL: Type.String({ minLength: 1 }),
	API_COMMUNITY_FACEBOOK_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_GITHUB_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: Type.Optional(Type.Integer({ minimum: 1 })), // Fixed comment inconsistency
	API_COMMUNITY_INSTAGRAM_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_LINKEDIN_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_NAME: Type.String({ minLength: 1 }),
	API_COMMUNITY_REDDIT_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_SLACK_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_WEBSITE_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_X_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_COMMUNITY_YOUTUBE_URL: Type.Optional(Type.String({ minLength: 1 })),
	API_HOST: Type.String({ minLength: 1 }),
	API_IS_APPLY_DRIZZLE_MIGRATIONS: Type.Boolean(),
	API_IS_GRAPHIQL: Type.Boolean(),
	API_IS_PINO_PRETTY: Type.Boolean(),
	API_JWT_EXPIRES_IN: Type.Number({ minimum: 0 }),
	API_JWT_SECRET: Type.String({ minLength: 64 }),
	API_LOG_LEVEL: Type.Enum(LogLevelEnum), // Fixed the Enum definition
	MINIO_ROOT_USER: Type.Optional(Type.String({ minLength: 1 })),
	API_MINIO_ACCESS_KEY: Type.String(),
	API_MINIO_END_POINT: Type.String(),
	API_MINIO_PORT: Type.Number(),
	API_MINIO_SECRET_KEY: Type.String(),
	API_MINIO_USE_SSL: Type.Boolean(),
	API_PORT: Type.Number({ maximum: 65535, minimum: 0 }),
	API_POSTGRES_DATABASE: Type.String({ minLength: 1 }),
	API_POSTGRES_HOST: Type.String({ minLength: 1 }),
	API_POSTGRES_PASSWORD: Type.String({ minLength: 1 }),
	API_POSTGRES_PORT: Type.Number({ maximum: 65535, minimum: 0 }),
	API_POSTGRES_SSL_MODE: Type.Union([
		Type.Enum({
			allow: "allow",
			prefer: "prefer",
			require: "require",
			verify_full: "verify-full",
		}),
		Type.Boolean(),
	]),
	API_POSTGRES_USER: Type.String(),
});

/**
 * Type of the object containing parsed configuration environment variables.
 */
export type EnvConfig = Static<typeof envConfigSchema>;

/**
 * Custom format validation for `ajv`
 */
export const envSchemaAjv: EnvSchemaOpt["ajv"] = {
	customOptions: (ajvInstance) => {
		ajvFormats(ajvInstance, ["email", "uri"]); // Removed `.default`
		return ajvInstance;
	},
};

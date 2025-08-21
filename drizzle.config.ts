/**
 * More information at this link: {@link https://orm.drizzle.team/kit-docs/config-reference}
 */
import { type Static, Type } from "@sinclair/typebox";
import { defineConfig } from "drizzle-kit";
import { envSchema } from "env-schema";
import { envConfigSchema, envSchemaAjv } from "./src/envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"API_POSTGRES_DATABASE",
	"API_POSTGRES_PASSWORD",
	"API_POSTGRES_HOST",
	"API_POSTGRES_PORT",
	"API_POSTGRES_USER",
	"API_POSTGRES_SSL_MODE",
]);

const envConfig = envSchema<Static<typeof schema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});

export default defineConfig({
	// https://orm.drizzle.team/docs/drizzle-config-file#dbcredentials
	dbCredentials: {
		database: envConfig.API_POSTGRES_DATABASE,
		password: envConfig.API_POSTGRES_PASSWORD,
		host: envConfig.API_POSTGRES_HOST,
		port: envConfig.API_POSTGRES_PORT,
		user: envConfig.API_POSTGRES_USER,
		ssl: envConfig.API_POSTGRES_SSL_MODE,
	},
	// https://orm.drizzle.team/docs/drizzle-config-file#dialect
	dialect: "postgresql",
	// https://orm.drizzle.team/docs/drizzle-config-file#introspect
	introspect: {
		casing: "camel",
	},
	// https://orm.drizzle.team/docs/drizzle-config-file#migrations
	migrations: {
		prefix: "timestamp",
	},
	// https://orm.drizzle.team/docs/drizzle-config-file#out
	out: "./drizzle_migrations",
	// https://orm.drizzle.team/docs/drizzle-config-file#schema
	schema: "./src/drizzle/schema.ts",
	// https://orm.drizzle.team/docs/drizzle-config-file#strict
	strict: true,
	// https://orm.drizzle.team/docs/drizzle-config-file#verbose
	verbose: true,
});

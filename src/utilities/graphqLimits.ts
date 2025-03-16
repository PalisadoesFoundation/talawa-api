import { type Static, Type } from "@sinclair/typebox";
import { envSchema } from "env-schema";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"API_GRAPHQL_SCALAR_FIELD_COST",
	"API_GRAPHQL_OBJECT_FIELD_COST",
	"API_GRAPHQL_LIST_FIELD_COST",
	"API_GRAPHQL_MUTATION_BASE_COST",
]);

const envConfig = envSchema<Static<typeof schema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});

export default envConfig;

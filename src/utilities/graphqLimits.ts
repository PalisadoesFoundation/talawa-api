import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"API_GRAPHQL_SCALAR_FIELD_COST",
	"API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST",
	"API_GRAPHQL_OBJECT_FIELD_COST",
	"API_GRAPHQL_LIST_FIELD_COST",
	"API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST",
	"API_GRAPHQL_MUTATION_BASE_COST",
	"API_GRAPHQL_SUBSCRIPTION_BASE_COST",
]);

const envConfig = envSchema<Static<typeof schema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});

export default envConfig;

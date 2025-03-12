import SchemaBuilder from "@pothos/core";
import relayPlugin from "@pothos/plugin-relay";
import ComplexityPlugin from '@pothos/plugin-complexity';
import type { GraphQLContext } from "~/src/graphql/context";
import type { CustomScalars } from "./scalars/index";
import envConfig from "../utilities/graphqLimits";
/**
 * This is the pothos schema builder used for talawa api's code first graphql implementation.
 */
export const builder = new SchemaBuilder<{
	
	Context: GraphQLContext;
	Scalars: CustomScalars;
}>({
	plugins: [relayPlugin, ComplexityPlugin],
	complexity : {
		defaultComplexity : envConfig.API_GRAPHQL_SCALAR_FIELD_COST, // default cost for scalar fields
		defaultListMultiplier : 0,
	},
	relay: {},
});


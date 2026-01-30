import { Type } from "typebox";

export const graphqlConfigSchema = Type.Object({
	API_GRAPHQL_SCALAR_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of scalar field with resolvers
	API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of object field
	API_GRAPHQL_OBJECT_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of list field
	API_GRAPHQL_LIST_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// cost of non-paginated list field
	API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: Type.Number({
		minimum: 0,
	}),
	// base cost of mutation
	API_GRAPHQL_MUTATION_BASE_COST: Type.Number({
		minimum: 0,
	}),
	// base cost of subscription
	API_GRAPHQL_SUBSCRIPTION_BASE_COST: Type.Number({
		minimum: 0,
	}),
	/**
	 * Used for providing the decision for whether to enable graphiql web client. It is useful to enable the graphiql web client in development environments for easier graphql schema exploration.
	 */
	API_IS_GRAPHIQL: Type.Boolean(),
});

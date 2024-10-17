import SchemaBuilder from "@pothos/core";
import type { GraphQLContext } from "~/src/graphql/context";
// import type { PothosScalars } from "./scalars/index";

/**
 * This is the pothos schema builder used for talawa api's code first graphql implementation.
 */
export const builder = new SchemaBuilder<{
	Context: GraphQLContext;
	// Scalars: PothosScalars;
}>({});

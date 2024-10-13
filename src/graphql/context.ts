import type { PubSub } from "./pubsub";

/**
 * Type of the implicit context object passed by mercurius that is merged with the explicit context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type ImplicitMercuriusContext = {
	pubsub: PubSub;
};

/**
 * Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type ExplicitGraphQLContext = {
	placeholder: string;
};

/**
 * Type of the transport protocol agnostic context object passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type GraphQLContext = ExplicitGraphQLContext & ImplicitMercuriusContext;

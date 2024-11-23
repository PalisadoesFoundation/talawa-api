import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FastifyBaseLogger } from "fastify";
import type * as drizzleSchema from "~/src/drizzle/schema";
import type { usersTable } from "~/src/drizzle/tables/users";
import type { PubSub } from "./pubsub";

/**
 * Type of the implicit context object passed by mercurius that is merged with the explicit context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type ImplicitMercuriusContext = {
	pubsub: PubSub;
};

/**
 * Type of the payload encoded into or decoded from the authentication json web token.
 */
export type ExplicitAuthenticationTokenPayload = {
	user: Pick<typeof usersTable.$inferSelect, "id">;
};

/**
 * Type of the client-specific context for a grahphql operation client.
 */
export type CurrentClient =
	| ({
			/**
			 * Type union discriminator field when the current client is unauthenticated.
			 */
			isAuthenticated: false;
	  } & {
			[K in keyof ExplicitAuthenticationTokenPayload]?: never;
	  })
	| ({
			/**
			 * Type union discriminator field when the current client is authenticated.
			 */
			isAuthenticated: true;
	  } & ExplicitAuthenticationTokenPayload);

/**
 * Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type ExplicitGraphQLContext = {
	currentClient: CurrentClient;
	drizzleClient: PostgresJsDatabase<typeof drizzleSchema>;
	log: FastifyBaseLogger;
	jwt: {
		sign: (payload: ExplicitAuthenticationTokenPayload) => string;
	};
};

/**
 * Type of the transport protocol agnostic context object passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type GraphQLContext = ExplicitGraphQLContext & ImplicitMercuriusContext;

import type { FastifyInstance } from "fastify";
import type { usersTable } from "~/src/drizzle/tables/users";
import type { CacheService } from "~/src/services/caching";
import type { Dataloaders } from "~/src/utilities/dataloaders";
import type { AppLogger } from "~/src/utilities/logging/logger";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import type { metricsCacheProxy } from "../services/metrics/metricsCacheProxy";
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
	/**
	 * Redis-backed cache service for caching entities and query results.
	 */
	cache: CacheService | ReturnType<typeof metricsCacheProxy>;
	currentClient: CurrentClient;
	/**
	 * Request-scoped DataLoaders for batching database queries.
	 */
	dataloaders: Dataloaders;
	drizzleClient: FastifyInstance["drizzleClient"];
	envConfig: Pick<
		FastifyInstance["envConfig"],
		| "API_ACCOUNT_LOCKOUT_DURATION_MS"
		| "API_ACCOUNT_LOCKOUT_THRESHOLD"
		| "API_BASE_URL"
		| "API_COMMUNITY_NAME"
		| "API_REFRESH_TOKEN_EXPIRES_IN"
		| "API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS"
		| "API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS"
		| "API_COOKIE_DOMAIN"
		| "API_IS_SECURE_COOKIES"
		| "API_JWT_EXPIRES_IN"
		| "AWS_ACCESS_KEY_ID"
		| "AWS_SECRET_ACCESS_KEY"
		| "AWS_SES_REGION"
		| "AWS_SES_FROM_EMAIL"
		| "AWS_SES_FROM_NAME"
		| "FRONTEND_URL"
		| "RECAPTCHA_SECRET_KEY"
	>;
	jwt: {
		sign: (payload: ExplicitAuthenticationTokenPayload) => string;
	};
	/**
	 * Cookie helper for setting HTTP-Only authentication cookies.
	 * Only available for HTTP requests (not WebSocket subscriptions).
	 */
	cookie?: {
		/**
		 * Sets both access token and refresh token as HTTP-Only cookies.
		 * @param accessToken - The JWT access token
		 * @param refreshToken - The refresh token
		 */
		setAuthCookies: (accessToken: string, refreshToken: string) => void;
		/**
		 * Clears both authentication cookies (for logout).
		 */
		clearAuthCookies: () => void;
		/**
		 * Gets the refresh token from cookies if present.
		 */
		getRefreshToken: () => string | undefined;
	};
	log: AppLogger;
	minio: FastifyInstance["minio"];
	/**
	 * Per-request notification helper. Implementations may enqueue notifications
	 * for delivery and support flush() to perform delivery after transaction commit.
	 */
	notification?: {
		flush: (ctx: GraphQLContext) => Promise<void>;
		enqueueEventCreated: (payload: {
			eventId: string;
			eventName: string;
			organizationId: string;
			organizationName: string;
			startDate: string;
			creatorName: string;
		}) => void;
		enqueueSendEventInvite: (payload: {
			inviteeEmail: string;
			inviteeName?: string;
			eventId?: string;
			eventName?: string;
			organizationId: string;
			inviterId: string;
			invitationToken: string;
			invitationUrl: string;
		}) => void;
		emitEventCreatedImmediate?: (
			payload: {
				eventId: string;
				eventName: string;
				organizationId: string;
				organizationName: string;
				startDate: string;
				creatorName: string;
			},
			ctx: GraphQLContext,
		) => Promise<void>;
	};
	/**
	 * Request-scoped performance tracker for monitoring operation durations,
	 * cache behavior (hits/misses), and GraphQL complexity scores.
	 * Available in all GraphQL contexts (HTTP and WebSocket).
	 */
	perf?: PerformanceTracker;
};

/**
 * Type of the transport protocol agnostic context object passed to the graphql resolvers each time they resolve a graphql operation at runtime.
 */
export type GraphQLContext = ExplicitGraphQLContext & ImplicitMercuriusContext;

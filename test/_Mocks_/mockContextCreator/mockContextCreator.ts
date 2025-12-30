import type { FastifyInstance } from "fastify";
import { createMockLogger } from "test/utilities/mockLogger";
import { type MockInstance, vi } from "vitest";
import type {
	CurrentClient,
	ExplicitGraphQLContext,
	GraphQLContext,
} from "~/src/graphql/context";
import { createDataloaders } from "~/src/utilities/dataloaders";
import { createMockDrizzleClient } from "../drizzleClientMock";
import { createMockMinioClient } from "../mockMinioClient";
import { createMockPubSub } from "../pubsubMock";

/**
 * Mock for an **unauthenticated user**.
 */
const unauthenticatedClient: CurrentClient = {
	isAuthenticated: false,
};

/**
 * Mock for an **authenticated user**.
 */
const authenticatedClient = (userId: string): CurrentClient => ({
	isAuthenticated: true,
	user: { id: userId },
});

/**
 * Function to create a **mock GraphQL context** with exposed mock instances.
 * @param isAuthenticated - Whether the client is authenticated.
 * @param userId - The user ID (only for authenticated users).
 * @returns An object containing the context and exposed mocks for testing.
 */
export function createMockGraphQLContext(
	isAuthenticated = true,
	userId = "user123",
) {
	// Create mock instances with proper typing
	const mockDrizzleClient = createMockDrizzleClient();
	const mockMinioClient = createMockMinioClient();
	const mockPubSub = createMockPubSub();
	const mockJwtSign = vi
		.fn()
		.mockImplementation(
			(payload) => `mocked.jwt.${JSON.stringify(payload)}.token`,
		);

	// Create the explicit context
	const explicitContext: ExplicitGraphQLContext = {
		cache: {
			get: vi.fn().mockResolvedValue(null),
			set: vi.fn().mockResolvedValue(undefined),
			del: vi.fn().mockResolvedValue(undefined),
			clearByPattern: vi.fn().mockResolvedValue(undefined),
			mget: vi
				.fn()
				.mockImplementation(async (keys: string[]) => keys.map(() => null)),
			mset: vi.fn().mockResolvedValue(undefined),
		},
		currentClient: isAuthenticated
			? authenticatedClient(userId)
			: unauthenticatedClient,
		dataloaders: createDataloaders(
			mockDrizzleClient as unknown as FastifyInstance["drizzleClient"],
		),
		drizzleClient:
			mockDrizzleClient as unknown as FastifyInstance["drizzleClient"],
		envConfig: {
			API_BASE_URL: "http://localhost:4000",
			API_COMMUNITY_NAME: "Test Community",
			API_REFRESH_TOKEN_EXPIRES_IN: 604800000,
			API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS: 1209600,
			API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS: 3600,
			API_JWT_EXPIRES_IN: 900000,
			API_COOKIE_DOMAIN: undefined,
			API_IS_SECURE_COOKIES: false,
			FRONTEND_URL: "http://localhost:3000",
		},
		jwt: {
			sign: mockJwtSign,
		},
		log: createMockLogger(),
		minio: mockMinioClient,
	};

	// Create the implicit context
	const implicitContext = { pubsub: mockPubSub };

	// Combine them into the full context
	const context: GraphQLContext = {
		...explicitContext,
		...implicitContext,
	};

	// Provide a minimal notification stub compatible with the real NotificationService
	(context as GraphQLContext).notification = {
		flush: async () => {},
		enqueueEventCreated: () => {},
		enqueueSendEventInvite: () => {},
		emitEventCreatedImmediate: async () => {},
	};

	// Return both the context and exposed mocks for easier testing
	return {
		context,
		mocks: {
			drizzleClient: mockDrizzleClient,
			minioClient: mockMinioClient,
			pubsub: mockPubSub,
			jwtSign: mockJwtSign as MockInstance,
		},
	};
}

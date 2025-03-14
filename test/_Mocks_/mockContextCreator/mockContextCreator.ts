import type { FastifyInstance } from "fastify";
import { createMockLogger } from "test/utilities/mockLogger";
import { type MockInstance, vi } from "vitest";
import type {
	CurrentClient,
	ExplicitGraphQLContext,
	GraphQLContext,
} from "~/src/graphql/context";
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
		currentClient: isAuthenticated
			? authenticatedClient(userId)
			: unauthenticatedClient,
		drizzleClient:
			mockDrizzleClient as unknown as FastifyInstance["drizzleClient"],
		envConfig: { API_BASE_URL: "http://localhost:4000" },
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

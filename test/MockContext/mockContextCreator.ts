
import type {
    CurrentClient,
    ExplicitGraphQLContext,
    GraphQLContext,
} from "~/src/graphql/context";
import type { FastifyInstance } from "fastify";
import type { Client as MinioClient } from "minio";
import { createMockLogger } from "test/utilities/mockLogger";
import { createMockMinioClient } from "test/MockContext/mocks/mockMinioClient";
import { createMockPubSub } from "./mocks/pubSubMock";
import { createMockDrizzleClient } from "./mocks/drizzleClientMock";
import { vi } from "vitest";


/**
 *  Mock for an **unauthenticated user**.
 */
const unauthenticatedClient: CurrentClient = {
	isAuthenticated: false,
};

/**
 *  Mock for an **authenticated user**.
 */
const authenticatedClient = (userId: string): CurrentClient => ({
	isAuthenticated: true,
	user: { id: userId },
});


/**
 * @usage make sure the params are passed properly and userId is passed as per your usage in the code 
 * @example createMockGraphQLContext(true/false,"user123")

 * Function to create a **mock GraphQL context**.
 * @param isAuthenticated - Whether the client is authenticated.
 * @param userId - The user ID (only for authenticated users).
 * @returns A fully mocked GraphQL context object.
 */


export function createMockGraphQLContext(
	isAuthenticated = true,
	userId = "user123",
): GraphQLContext {
	const explicitContext: ExplicitGraphQLContext = {
		currentClient: isAuthenticated
			? authenticatedClient(userId)
			: unauthenticatedClient,
		drizzleClient:
			createMockDrizzleClient() as unknown as FastifyInstance["drizzleClient"], 
            // Deliberate type assertion due to limited usage by types resolvers of drizzle client operations in mock testing 

		envConfig: { API_BASE_URL: "http://localhost:4000" }, // Fake API base URL
		jwt: { sign: vi.fn().mockReturnValue("mocked.jwt.token") }, //  Mock JWT sign
		log: createMockLogger(),
		minio: {
			bucketName: "talawa",
			client: createMockMinioClient() as MinioClient,
		},
	};

	const implicitContext = { pubsub: createMockPubSub() };

	return { ...explicitContext, ...implicitContext };
}


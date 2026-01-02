import type { FastifyInstance } from "fastify";
import { createMockLogger } from "test/utilities/mockLogger";
import { type MockInstance, vi } from "vitest";
import type {
	CurrentClient,
	ExplicitGraphQLContext,
	GraphQLContext,
} from "~/src/graphql/context";
import { createDataloaders } from "~/src/utilities/dataloaders";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
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
	cacheState: Record<string, unknown> = {},
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

	// Create mock performance tracker
	const mockPerf: PerformanceTracker = {
		time: vi.fn().mockImplementation(async (_op, fn) => fn()),
		start: vi.fn().mockReturnValue(() => {}),
		trackDb: vi.fn(),
		trackCacheHit: vi.fn(),
		trackCacheMiss: vi.fn(),
		snapshot: vi.fn().mockReturnValue({
			totalMs: 0,
			totalOps: 0,
			cacheHits: 0,
			cacheMisses: 0,
			ops: {},
			slow: [],
			hitRate: 0,
		}),
	};

	// Create the explicit context
	const explicitContext: ExplicitGraphQLContext = {
		cache: {
			get: vi.fn().mockImplementation(async (key: string) => {
				return cacheState[key] ?? null;
			}),
			set: vi.fn().mockImplementation(async (key: string, value: unknown) => {
				cacheState[key] = value;
			}),
			del: vi.fn().mockImplementation(async (keys: string | string[]) => {
				const arr = Array.isArray(keys) ? keys : [keys];
				for (const k of arr) delete cacheState[k];
			}),
			clearByPattern: vi.fn().mockImplementation(async (pattern: string) => {
				// Simple mock, doesn't actually clear by pattern to avoid regex complexity
				// Just clears if empty pattern given for full flush
				if (pattern === "*") {
					for (const k in cacheState) delete cacheState[k];
				}
			}),
			mget: vi
				.fn()
				.mockImplementation(async (keys: string[]) =>
					keys.map((k) => (cacheState[k] as unknown) ?? null),
				),
			mset: vi
				.fn()
				.mockImplementation(
					async (
						entries: Array<{ key: string; value: unknown; ttlSeconds: number }>,
					) => {
						for (const { key, value } of entries) {
							cacheState[key] = value;
						}
					},
				),
		},
		currentClient: isAuthenticated
			? authenticatedClient(userId)
			: unauthenticatedClient,
		dataloaders: createDataloaders(
			mockDrizzleClient as unknown as FastifyInstance["drizzleClient"],
			mockPerf,
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
		perf: mockPerf,
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

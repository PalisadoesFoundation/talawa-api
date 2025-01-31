import type { FastifyBaseLogger } from "fastify";
import type { Client as MinioClient } from "minio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "~/src/graphql/types/Community/Community";
import { CommunityResolver } from "~/src/graphql/types/Community/Community";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";

type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

type LogBindings = Record<string, string | number | boolean>;
type LogOptions = Record<string, string | number | boolean>;

type PubSubEvents = {
	COMMUNITY_CREATED: { id: string };
	POST_CREATED: { id: string };
	// Add other event types as needed
};

interface TestContext extends Omit<GraphQLContext, "log"> {
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	} & GraphQLContext["drizzleClient"];
	log: FastifyBaseLogger;
}

const createMockLogger = (): FastifyBaseLogger => {
	// Create base logger object with explicit types
	const logger = {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
		silent: vi.fn(),
		child: (bindings: LogBindings, options?: LogOptions) => createMockLogger(),
		level: "info",
		isLevelEnabled: vi.fn().mockReturnValue(true),
		bindings: vi.fn().mockReturnValue({}),
		flush: vi.fn(),
		// Add level-enabled methods explicitly
		isFatalEnabled: vi.fn().mockReturnValue(true),
		isErrorEnabled: vi.fn().mockReturnValue(true),
		isWarnEnabled: vi.fn().mockReturnValue(true),
		isInfoEnabled: vi.fn().mockReturnValue(true),
		isDebugEnabled: vi.fn().mockReturnValue(true),
		isTraceEnabled: vi.fn().mockReturnValue(true),
		isSilentEnabled: vi.fn().mockReturnValue(true),
	};

	return logger as unknown as FastifyBaseLogger;
};

const createMockPubSub = () => ({
	publish: vi.fn().mockImplementation(
		(
			event: {
				topic: keyof PubSubEvents;
				payload: PubSubEvents[keyof PubSubEvents];
			},
			callback?: () => void,
		) => {
			if (callback) callback();
			return;
		},
	),
	subscribe: vi.fn(),
	asyncIterator: vi.fn(),
});

describe("Community Resolver - Updater Field", () => {
	let ctx: TestContext;
	let mockUser: DeepPartial<User>;
	let mockCommunity: Community;

	beforeEach(() => {
		mockUser = {
			id: "123",
			name: "John Doe",
			role: "administrator",
			createdAt: new Date(),
			updatedAt: null,
		};

		mockCommunity = {
			id: "community-123",
			name: "Test Community",
			createdAt: new Date(),
			updatedAt: new Date(),
			updaterId: "456",
			facebookURL: null,
			githubURL: null,
			inactivityTimeoutDuration: null,
			instagramURL: null,
			linkedinURL: null,
			logoMimeType: null,
			logoName: null,
			redditURL: null,
			slackURL: null,
			websiteURL: null,
			xURL: null,
			youtubeURL: null,
		};

		const mockLogger = createMockLogger();

		ctx = {
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue(mockUser),
					},
				},
			} as unknown as TestContext["drizzleClient"],
			log: mockLogger,
			pubsub: createMockPubSub(),
			envConfig: {
				API_BASE_URL: "http://localhost:3000",
			},
			jwt: {
				sign: vi.fn().mockReturnValue("mock-token"),
			},
			minio: {
				bucketName: "talawa", // Match your actual bucket name
				client: {
					listBuckets: vi.fn(),
					putObject: vi.fn(),
					getObject: vi.fn(),
					// Add other required Minio client methods
				} as unknown as MinioClient, // Type assertion for client
			},
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "123", // Must match mockUser.id
					role: "administrator",
				},
			},
		};
	});

	it("should return updater user", async () => {
		const result = await CommunityResolver.updater(mockCommunity, {}, ctx);
		expect(result).toEqual(mockUser);
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});

	it("should return null when updaterId is null", async () => {
		const nullUpdaterCommunity = {
			...mockCommunity,
			updaterId: null,
		};

		const result = await CommunityResolver.updater(
			nullUpdaterCommunity,
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("should throw unauthenticated error", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authenticated",
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthorized error for non-admin", async () => {
		ctx.currentClient = {
			isAuthenticated: true,
			user: {
				id: "123",
				role: "regular",
			},
		};

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authorized",
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unauthorized error for non-admin", async () => {
		// Create a non-admin user with the correct role type
		const nonAdminUser: DeepPartial<User> = {
			id: "789",
			name: "Regular User",
			role: "regular" as const, // Using the correct role type
			createdAt: new Date(),
			updatedAt: null,
		};

		// Reset the mock implementation
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockResolvedValueOnce(nonAdminUser); // First call returns non-admin user

		// Update context with non-admin user
		ctx.currentClient = {
			isAuthenticated: true,
			user: {
				id: nonAdminUser.id ?? "default-id", // Provide a sensible default or handle null case
				role: nonAdminUser.role ?? "regular", // Replace with an appropriate default role
			},
		};

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authorized",
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null for non-admin with null updaterId", async () => {
		ctx.currentClient = {
			isAuthenticated: true,
			user: {
				id: "123",
				role: "regular",
			},
		};
		const nullUpdaterCommunity = {
			...mockCommunity,
			updaterId: null,
		};

		const result = await CommunityResolver.updater(
			nullUpdaterCommunity,
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("should handle database errors gracefully", async () => {
		const dbError = new Error("Database connection failed");

		ctx.drizzleClient.query.usersTable.findFirst
			.mockRejectedValueOnce(dbError)
			.mockResolvedValueOnce(mockUser);

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrow(dbError);

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Database error in community updater resolver",
			{ error: dbError },
		);
	});

	it("should fetch different user when updaterId doesn't match current user", async () => {
		const differentUpdaterCommunity = {
			...mockCommunity,
			updaterId: "different-id-789",
		};

		const differentUser: DeepPartial<User> = {
			...mockUser,
			id: "different-id-789",
			name: "Jane Smith",
		};

		// Mock database calls
		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser) // First call: current user lookup
			.mockResolvedValueOnce(differentUser); // Second call: different user lookup

		const result = await CommunityResolver.updater(
			differentUpdaterCommunity,
			{},
			ctx,
		);

		// Verify the result matches the different user
		expect(result).toEqual(differentUser);

		// Verify two database calls were made
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);

		// Verify the second call used the correct updaterId
		expect(
			ctx.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenNthCalledWith(2, {
			where: expect.any(Function), // Should query for id: "different-id-789"
		});
	});
});

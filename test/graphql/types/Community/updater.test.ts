import type { FastifyBaseLogger } from "fastify";
import type { Client as MinioClient } from "minio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "~/src/graphql/types/Community/Community";
import { CommunityResolver } from "~/src/graphql/types/Community/Community";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";
import { createMockLogger } from "../../../utilities/mockLogger";

type DeepPartial<T> = Partial<T>;

type PubSubEvents = {
	COMMUNITY_CREATED: { id: string };
	POST_CREATED: { id: string };
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
		// Mock user with role for resolver logic, even though context user won't have it
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
				bucketName: "talawa",
				client: {
					listBuckets: vi.fn(),
					putObject: vi.fn(),
					getObject: vi.fn(),
				} as unknown as MinioClient,
			},
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "123", // Ensure this is always set
				},
			},
		};
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

	it("should make correct database queries with expected parameters", async () => {
		const updaterUser = {
			id: "456",
			name: "Jane Updater",
			role: "user",
			createdAt: new Date(),
			updatedAt: null,
		};

		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(updaterUser);

		await CommunityResolver.updater(mockCommunity, {}, ctx);

		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});

	it("should successfully return updater user when all conditions are met", async () => {
		const updaterUser = {
			id: "456",
			name: "Jane Updater",
			role: "user",
			createdAt: new Date(),
			updatedAt: null,
		};

		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(updaterUser);

		const result = await CommunityResolver.updater(mockCommunity, {}, ctx);

		expect(result).toEqual(updaterUser);
		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});

	it("should correctly query the database for current user and updater user", async () => {
		const updaterUser = {
			id: "456",
			name: "Jane Updater",
			role: "user",
			createdAt: new Date(),
			updatedAt: null,
		};

		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser) // First call for current user
			.mockResolvedValueOnce(updaterUser); // Second call for updater user

		await CommunityResolver.updater(mockCommunity, {}, ctx);

		expect(ctx.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledTimes(
			2,
		);
	});

	it("should log a warning when an updater ID exists but no user is found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			CommunityResolver.updater(mockCommunity, {}, ctx),
		).rejects.toThrowError(
			new TalawaGraphQLError({
				message: "Updater user not found",
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["updaterId"] }],
				},
			}),
		);

		expect(ctx.log.warn).toHaveBeenCalledWith(
			`No user found for updaterId: ${mockCommunity.updaterId}`,
		);
	});
});

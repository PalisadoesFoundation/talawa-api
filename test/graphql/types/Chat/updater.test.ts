import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mock, vi } from "vitest";
import type { z } from "zod";
import type { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import type { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import type { userRoleEnum } from "~/src/drizzle/enums/userRole";
import type { PubSub } from "../../../../src/graphql/pubsub";
import { resolveUpdater } from "../../../../src/graphql/types/Chat/updater";

// Infer types from the zod enums
type UserRole = z.infer<typeof userRoleEnum>;
type ChatMembershipRole = z.infer<typeof chatMembershipRoleEnum>;
type OrganizationMembershipRole = z.infer<
	typeof organizationMembershipRoleEnum
>;

type MockUser = {
	id: string;
	role: UserRole;
	chatMembershipsWhereMember: Array<{ role: ChatMembershipRole }>;
	organizationMembershipsWhereMember: Array<{
		role: OrganizationMembershipRole;
	}>;
};

type MockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: Mock<(params?: unknown) => Promise<MockUser | undefined>>;
		};
	};
};

const mockCurrentUser: MockUser = {
	id: "user_1",
	role: "regular" as UserRole,
	chatMembershipsWhereMember: [],
	organizationMembershipsWhereMember: [],
};

const mockUpdaterUser: MockUser = {
	id: "updater_1",
	role: "regular" as UserRole,
	chatMembershipsWhereMember: [],
	organizationMembershipsWhereMember: [],
};

const mockParent = {
	id: "chat_1",
	organizationId: "org_1",
	updatedAt: new Date("2023-10-01T00:00:00Z"),
	createdAt: new Date("2023-10-01T00:00:00Z"),
	name: "Amaan",
	description: "chat description",
	creatorId: "creator_1",
	avatarMimeType: null,
	avatarName: "avatar_name",
	updaterId: "updater_1",
};

const drizzleClientMock = {
	query: {
		usersTable: {
			findFirst: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
		},
	},
} as unknown as FastifyInstance["drizzleClient"] & MockDrizzleClient;

const mockLogger = {
	error: vi.fn(),
} as unknown as FastifyInstance["log"];

const authenticatedContext = {
	currentClient: {
		isAuthenticated: true as const,
		user: {
			id: "user_1",
		},
	},
	drizzleClient: drizzleClientMock,
	envConfig: { API_BASE_URL: "API_BASE" },
	log: mockLogger,
	minio: {} as unknown as FastifyInstance["minio"],
	jwt: {
		sign: vi.fn(),
	},
	pubsub: {} as unknown as PubSub,
};

const unauthenticatedContext = {
	...authenticatedContext,
	currentClient: {
		isAuthenticated: false as const,
	},
};

describe("Chat.updater resolver", () => {
	beforeEach(() => vi.resetAllMocks());

	it("throws unauthenticated error when user is not authenticated", async () => {
		await expect(
			resolveUpdater(mockParent, {}, unauthenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when user is not found", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockImplementation(() =>
			Promise.resolve(undefined),
		);

		await expect(
			resolveUpdater(mockParent, {}, authenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthorized error when user lacks permissions", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockImplementation(() =>
			Promise.resolve({
				...mockCurrentUser,
				role: "regular" as UserRole,
				chatMembershipsWhereMember: [],
				organizationMembershipsWhereMember: [],
			}),
		);

		await expect(
			resolveUpdater(mockParent, {}, authenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("returns null when updaterId is null", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockImplementation(() =>
			Promise.resolve({
				...mockCurrentUser,
				role: "administrator" as UserRole,
			}),
		);

		const parentWithNullUpdater = { ...mockParent, updaterId: null };

		const result = await resolveUpdater(
			parentWithNullUpdater,
			{},
			authenticatedContext,
		);
		expect(result).toBeNull();
	});

	it("returns current user when updaterId matches current user", async () => {
		const currentUserWithPermissions = {
			...mockCurrentUser,
			role: "administrator" as UserRole,
		};

		drizzleClientMock.query.usersTable.findFirst.mockImplementation(() =>
			Promise.resolve(currentUserWithPermissions),
		);

		const parentWithCurrentUserAsUpdater = {
			...mockParent,
			updaterId: "user_1",
		};

		const result = await resolveUpdater(
			parentWithCurrentUserAsUpdater,
			{},
			authenticatedContext,
		);
		expect(result).toEqual(currentUserWithPermissions);
	});

	it("throws unexpected error when updaterId exists but user is not found", async () => {
		// Mock implementation for findFirst
		// First call returns current user with admin role
		// Second call returns undefined (updater not found)
		drizzleClientMock.query.usersTable.findFirst
			.mockImplementationOnce(() =>
				Promise.resolve({
					...mockCurrentUser,
					role: "administrator" as UserRole,
				}),
			)
			.mockImplementationOnce(() => Promise.resolve(undefined));

		await expect(
			resolveUpdater(mockParent, {}, authenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
					message: expect.stringContaining(
						`Updater with ID ${mockParent.updaterId}`,
					),
				}),
			}),
		);
		expect(mockLogger.error).toHaveBeenCalled();
	});

	describe("admin role authorization", () => {
		const adminRoles = [
			{
				scenario: "global admin",
				user: {
					...mockCurrentUser,
					role: "administrator" as UserRole,
				},
			},
			{
				scenario: "organization admin",
				user: {
					...mockCurrentUser,
					role: "regular" as UserRole,
					organizationMembershipsWhereMember: [
						{ role: "administrator" as OrganizationMembershipRole },
					],
				},
			},
			{
				scenario: "chat admin",
				user: {
					...mockCurrentUser,
					role: "regular" as UserRole,
					chatMembershipsWhereMember: [
						{ role: "administrator" as ChatMembershipRole },
					],
				},
			},
		];

		for (const { scenario, user } of adminRoles) {
			it(`returns updater when user is a ${scenario}`, async () => {
				// Mock implementation for findFirst
				// First call returns current user with appropriate admin role
				// Second call returns updater user
				drizzleClientMock.query.usersTable.findFirst
					.mockImplementationOnce(() => Promise.resolve(user))
					.mockImplementationOnce(() => Promise.resolve(mockUpdaterUser));

				const result = await resolveUpdater(
					mockParent,
					{},
					authenticatedContext,
				);
				expect(result).toEqual(mockUpdaterUser);
			});
		}
	});
});

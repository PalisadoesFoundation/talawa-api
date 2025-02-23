import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import { type Mock, vi } from "vitest";
import type { z } from "zod";
import type { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import type { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import type { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { PubSub } from "../../../../src/graphql/pubsub";
import { resolveUpdatedAt } from "../../../../src/graphql/types/Chat/updatedAt";

// Infer types from the zod enums
type UserRole = z.infer<typeof userRoleEnum>;
type ChatMembershipRole = z.infer<typeof chatMembershipRoleEnum>;
type OrganizationMembershipRole = z.infer<
	typeof organizationMembershipRoleEnum
>;

type MockUser = {
	role: UserRole;
	chatMembershipsWhereMember: Array<{ role: ChatMembershipRole }>;
	organizationMembershipsWhereMember: Array<{
		role: OrganizationMembershipRole;
	}>;
};

type MockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: Mock<() => Promise<MockUser | undefined>>;
		};
	};
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

const authenticatedContext = {
	currentClient: {
		isAuthenticated: true as const,
		user: {
			id: "user_1",
		},
	},
	drizzleClient: drizzleClientMock,
	envConfig: { API_BASE_URL: "API_BASE" },
	log: {} as unknown as FastifyInstance["log"],
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

describe("Chat.updatedAt resolver", () => {
	beforeEach(() => vi.resetAllMocks());

	it("throws unauthenticated error when user is not authenticated", async () => {
		await expect(
			resolveUpdatedAt(mockParent, {}, unauthenticatedContext),
		).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringMatching(/authenticated/i),
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("throws unauthenticated error when user is not found", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdatedAt(mockParent, {}, authenticatedContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("throws unauthorized error when user lacks permissions", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [],
			organizationMembershipsWhereMember: [],
		});

		await expect(
			resolveUpdatedAt(mockParent, {}, authenticatedContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("returns updatedAt when user is global admin", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
			chatMembershipsWhereMember: [],
			organizationMembershipsWhereMember: [],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is an administrator in the organization and not global administrator", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "regular" }],
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is a chat administrator and not global administrator", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "administrator" }],
			organizationMembershipsWhereMember: [{ role: "regular" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});

	it("returns updatedAt when user is both organization and chat admin", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
			chatMembershipsWhereMember: [{ role: "administrator" }],
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const result = await resolveUpdatedAt(mockParent, {}, authenticatedContext);
		expect(result).toEqual(mockParent.updatedAt);
	});
});

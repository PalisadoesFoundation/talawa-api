import type { FastifyInstance, FastifyReply } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Tag as TagType } from "~/src/graphql/types/Tag/Tag";
import { resolveUpdater } from "~/src/graphql/types/Tag/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockLogger } from "../../../utilities/mockLogger";

interface CurrentClient {
	isAuthenticated: boolean;
	user?: {
		id: string;
		role: string;
	};
}

// Create mock Fastify instance
const mockApp = {
	addHook: vi.fn(),
	decorate: vi.fn(),
	get: vi.fn(),
	post: vi.fn(),
} as unknown as FastifyInstance;

// Create mock Fastify reply
const mockReply = {
	code: vi.fn(),
	send: vi.fn(),
	header: vi.fn(),
} as unknown as FastifyReply;

// Create mock logger
const mockLogger = createMockLogger();

const createMockContext = () => {
	const mockContext = {
		currentClient: {
			isAuthenticated: true,
			user: { id: "user-123", role: "administrator" },
		} as CurrentClient,
		drizzleClient: { query: { usersTable: { findFirst: vi.fn() } } },
		envConfig: { API_BASE_URL: "mock url" },
		jwt: { sign: vi.fn() },
		log: mockLogger,
		app: mockApp,
		reply: mockReply,
		__currentQuery: "query { test }", // Mock GraphQL query string
		minio: { presignedUrl: vi.fn(), putObject: vi.fn(), getObject: vi.fn() },
	};
	return mockContext as unknown as GraphQLContext;
};

describe("Tag Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockTag: TagType;

	beforeEach(() => {
		ctx = createMockContext();
		mockTag = {
			id: "tag-123",
			name: "Test Tag",
			createdAt: new Date(),
			creatorId: "user-123",
			updaterId: "user-123",
			folderId: "folder-123",
			organizationId: "org-123",
		} as TagType;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const testCtx = {
			...ctx,
			currentClient: {
				isAuthenticated: false,
				user: undefined,
			},
		} as unknown as GraphQLContext;

		await expect(async () => {
			await resolveUpdater(mockTag, {}, testCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should return null if updaterId is null", async () => {
		mockTag.updaterId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		const result = await resolveUpdater(mockTag, {}, ctx);
		expect(result).toBeNull();
	});

	it("should fetch and return updater if different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const updaterUser = {
			id: "user-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockTag.updaterId = "user-456";
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(updaterUser);

		const result = await resolveUpdater(mockTag, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mockTag.updaterId = "user-456";
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(undefined);

		await expect(async () => {
			await resolveUpdater(mockTag, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("should return current user if they are the updater", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					organizationId: "org-123",
					role: "administrator",
				},
			],
		};

		mockTag.updaterId = "user-123";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(currentUser);

		const result = await resolveUpdater(mockTag, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unauthorized error if user is not an administrator", async () => {
		const nonAdminUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockTag.updaterId = "user-456";
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(nonAdminUser);

		await expect(async () => {
			await resolveUpdater(mockTag, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: mockTag.organizationId },
			],
		};

		// Mock implementation to verify if organizationId filter is used
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = { organizationId: "org-123" };
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockTag.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUser);
		});

		const result = await resolveUpdater(mockTag, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should throw an error if the current user is not found", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(undefined);

		await expect(async () => {
			await resolveUpdater(mockTag, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthorized error if user is not an administrator even with organization membership", async () => {
		const nonAdminUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{ role: "member", organizationId: mockTag.organizationId },
			],
		};

		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(nonAdminUser);

		await expect(async () => {
			await resolveUpdater(mockTag, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});

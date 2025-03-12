import type { FastifyInstance, FastifyReply } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Post as PostType } from "~/src/graphql/types/Post/Post";
import { resolveUpdater } from "~/src/graphql/types/Post/updater";
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

describe("Post Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockPost: PostType;

	beforeEach(() => {
		mockPost = {
			id: "post-123",
			caption: "Test Caption",
			createdAt: new Date(),
			creatorId: "user-123",
			body: "Test Body",
			title: "Test Title",
			updaterId: "user-123",
			organizationId: "org-123",
			updatedAt: new Date(),
			pinnedAt: new Date(),
			attachments: [],
		} as PostType;

		ctx = createMockContext();
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
			await resolveUpdater(mockPost, {}, testCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should allow access if user is system administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should allow access if user is organization administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should throw unauthorized error if user is not an administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
				},
			],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if post has no updater", async () => {
		mockPost.updaterId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if they are the updater", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return updater if different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const updaterUser = {
			id: "updater-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockPost.updaterId = "updater-456";
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(updaterUser);

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should handle empty organization memberships array", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(mockUser);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mockPost.updaterId = "updater-456";
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(undefined);

		await expect(async () => {
			await resolveUpdater(mockPost, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: mockPost.organizationId },
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
					[mockFields.organizationId]: mockPost.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUser);
		});

		const result = await resolveUpdater(mockPost, {}, ctx);
		expect(result).toEqual(mockUser);
	});
});

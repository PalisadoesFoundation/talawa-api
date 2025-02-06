import type { FastifyInstance, FastifyReply } from "fastify";
import type { MercuriusContext } from "mercurius";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
type ResolverContext = GraphQLContext & MercuriusContext;

interface CurrentClient {
	isAuthenticated: boolean;
	user?: {
		id: string;
		role: string;
	};
}

interface TestContext extends Partial<MercuriusContext> {
	currentClient: CurrentClient;
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	};
	log: {
		error: ReturnType<typeof vi.fn>;
	};
	app: FastifyInstance;
	reply: FastifyReply;
	__currentQuery: string;
}

interface VenueParent {
	id: string;
	name: string;
	description: string;
	creatorId: string | null;
	organizationId: string;
}

const resolveCreator = async (
	parent: VenueParent,
	_args: Record<string, never>,
	ctx: ResolverContext,
): Promise<typeof User | null> => {
	if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user?.id) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		(!currentUserOrganizationMembership ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	if (parent.creatorId === null) {
		return null;
	}

	if (parent.creatorId === currentUserId) {
		return currentUser as unknown as typeof User;
	}

	if (typeof parent.creatorId !== "string") {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.creatorId as string),
	});

	if (!existingUser) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a venue's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser as unknown as typeof User;
};

// Tests section
describe("Venue Resolver - Creator Field", () => {
	let ctx: TestContext;
	let mockVenue: VenueParent;

	beforeEach(() => {
		mockVenue = {
			id: "venue-123",
			name: "Test Venue",
			description: "Test Description",
			creatorId: "user-123",
			organizationId: "org-123",
		};

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

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "user-123",
					role: "member",
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn(),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
			app: mockApp,
			reply: mockReply,
			__currentQuery: "query { test }", // Mock GraphQL query string
		};
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const testCtx = {
			...ctx,
			currentClient: {
				isAuthenticated: false,
				user: undefined,
			},
		} as unknown as ResolverContext;

		await expect(async () => {
			await resolveCreator(mockVenue, {}, testCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const testCtx = {
			...ctx,
			currentClient: {
				isAuthenticated: false,
				user: undefined,
			},
		} as unknown as ResolverContext;

		await expect(async () => {
			await resolveCreator(mockVenue, {}, testCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(async () => {
			await resolveCreator(mockVenue, {}, ctx as unknown as ResolverContext);
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
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveCreator(
			mockVenue,
			{},
			ctx as unknown as ResolverContext,
		);
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
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveCreator(
			mockVenue,
			{},
			ctx as unknown as ResolverContext,
		);
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
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveCreator(mockVenue, {}, ctx as unknown as ResolverContext);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if venue has no creator", async () => {
		mockVenue.creatorId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveCreator(
			mockVenue,
			{},
			ctx as unknown as ResolverContext,
		);
		expect(result).toBeNull();
	});

	it("should return current user if they are the creator", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveCreator(
			mockVenue,
			{},
			ctx as unknown as ResolverContext,
		);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return creator if different from current user ", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const creatorUser = {
			id: "creator-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockVenue.creatorId = "creator-456";
		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(creatorUser);

		const result = await resolveCreator(
			mockVenue,
			{},
			ctx as unknown as ResolverContext,
		);
		expect(result).toEqual(creatorUser);
	});

	it("should handle empty organization memberships array", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveCreator(mockVenue, {}, ctx as unknown as ResolverContext);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should handle undefined organization membership role", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: undefined }],
		};
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveCreator(mockVenue, {}, ctx as unknown as ResolverContext);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});

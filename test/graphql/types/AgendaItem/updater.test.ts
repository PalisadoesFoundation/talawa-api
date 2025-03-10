import type { FastifyInstance, FastifyReply } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveUpdater } from "~/src/graphql/types/AgendaItem/updater";
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
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				agendaFoldersTable: { findFirst: vi.fn() },
			},
		},
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

describe("AgendaItem Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockAgendaItem: AgendaItemType;

	beforeEach(() => {
		mockAgendaItem = {
			id: "agendaItem-123",
			folderId: "folder-123",
			updaterId: "user-123",
		} as AgendaItemType;

		ctx = createMockContext();
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unexpected error if agenda folder is not found", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		(
			ctx.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue(undefined);

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("should throw unauthorized_action error if user is not an administrator", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "user-123",
			role: "member",
		});
		(
			ctx.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			})
			.mockResolvedValueOnce(undefined);

		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("should resolve successfully if user is an administrator and part of the organization", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		(
			ctx.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockAgendaItem, {}, ctx),
		).resolves.toBeDefined();

		// Should return null if updaterId is null in AgendaItem
		mockAgendaItem.updaterId = null;
		const result_1 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_1).toBeNull();

		// Should return currentUser if updaterId==currentUser.id  in AgendaItem
		mockAgendaItem.updaterId = "user-123";
		const result_2 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_2).toEqual({
			id: "user-123",
			role: "administrator",
		});

		// updaterId exist but updaterId==currentUser.id
		mockAgendaItem.updaterId = "user-456";
		const result_3 = await resolveUpdater(mockAgendaItem, {}, ctx);
		expect(result_3).toEqual({
			id: "user-123",
			role: "administrator",
		});
	});

	it("should throw unexpected error if updater is not current user and updater does not exist", async () => {
		(ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
			})
			.mockResolvedValueOnce(undefined);
		(
			ctx.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockResolvedValue({
			event: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		mockAgendaItem.updaterId = "user-456";
		await expect(resolveUpdater(mockAgendaItem, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's updater id that isn't null.",
		);
	});

	it("should test the innermost where clause in query", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: "user-123",
			role: "administrator",
		});
		(
			ctx.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = { memberId: "user-123" };
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.event.with.organization.with.membershipsWhereOrganization.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.memberId]: "user-123",
				}),
			);
			return Promise.resolve({
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			});
		});

		await expect(
			resolveUpdater(mockAgendaItem, {}, ctx),
		).resolves.toBeDefined();
	});
});

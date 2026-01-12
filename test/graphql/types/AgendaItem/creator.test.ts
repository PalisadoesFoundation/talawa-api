import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/AgendaItem/creator";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

// Get the creator resolver from the schema
const agendaItemType = schema.getType("AgendaItem") as GraphQLObjectType;
const creatorField = agendaItemType.getFields().creator;
if (!creatorField) {
	throw new Error("creator field not found on AgendaItem type");
}
const creatorResolver = creatorField.resolve as (
	parent: AgendaItem,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<unknown>;

describe("AgendaItem.creator field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockAgendaItem: AgendaItem;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	// Helper function to setup common authorized user and agenda folder mocks
	const setupAuthorizedMocks = (
		userRole: "administrator" | "member" = "administrator",
		orgMembershipRole: "administrator" | "member" = "administrator",
	) => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: userRole,
		});
		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
			isAgendaItemFolder: true,
			event: {
				startAt: new Date("2024-01-01T00:00:00Z"),
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [{ role: orgMembershipRole }],
				},
			},
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
		mockAgendaItem = {
			id: "agenda-item-111",
			folderId: "folder-456",
			creatorId: "creator-789",
			updaterId: "updater-000",
			createdAt: new Date("2024-01-15T10:30:00Z"),
			updatedAt: new Date("2024-01-16T10:30:00Z"),
			name: "Opening Ceremony",
			description: "Welcome speech and introductions",
			duration: "30 minutes",
			key: null,
			notes: "note 1",
			sequence: 1,
			eventId: "eventId-123",
			categoryId: "categoryId-123",
		};
	});

	describe("Authentication checks", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error when currentUser is undefined (user not found in database)", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					return Promise.resolve(undefined);
				},
			);
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			});

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Corrupted data checks", () => {
		it("should throw unexpected error when existingAgendaFolder is undefined (corrupted data)", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "administrator",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							event?: {
								with?: {
									organization?: {
										with?: {
											membershipsWhereOrganization?: {
												where?: (fields: unknown, operators: unknown) => void;
											};
										};
									};
								};
							};
						};
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "agendaFolders.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					// Execute nested where callbacks for membershipsWhereOrganization
					if (
						args?.with?.event?.with?.organization?.with
							?.membershipsWhereOrganization?.where
					) {
						const fields = { memberId: "organizationMemberships.memberId" };
						const operators = { eq: vi.fn() };
						args.with.event.with.organization.with.membershipsWhereOrganization.where(
							fields,
							operators,
						);
					}

					return Promise.resolve(undefined);
				},
			);

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
			);
		});

		it("should throw unexpected error when creator user is not found (corrupted data)", async () => {
			setupAuthorizedMocks();

			// First call returns the current user, second call returns undefined for creator
			let callCount = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					callCount++;
					if (callCount === 1) {
						// First call - return current user
						return Promise.resolve({
							id: "user123",
							role: "administrator",
						});
					}
					// Second call - creator not found
					return Promise.resolve(undefined);
				},
			);

			// Set creatorId to a different user
			mockAgendaItem.creatorId = "different-creator-id";

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an agenda item's creator id that isn't null.",
			);
		});
	});

	describe("Authorization checks", () => {
		it("should throw unauthorized_action when user is not admin and has no organization membership", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "member",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [],
					},
				},
			});

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});

		it("should throw unauthorized_action when user is not admin and org membership role is not administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "member",
			});
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "member" }],
					},
				},
			});

			await expect(
				creatorResolver(mockAgendaItem, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});
	});

	describe("Successful resolution", () => {
		it("should return null when creatorId is null", async () => {
			setupAuthorizedMocks();
			mockAgendaItem.creatorId = null;

			const result = await creatorResolver(mockAgendaItem, {}, ctx);

			expect(result).toBeNull();
		});

		it("should return current user when creatorId matches currentUserId", async () => {
			const currentUser = {
				id: "user123",
				role: "administrator",
				name: "Current User",
				email: "current@example.com",
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				currentUser,
			);
			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			});

			// Set creatorId to match the current user
			mockAgendaItem.creatorId = "user123";

			const result = await creatorResolver(mockAgendaItem, {}, ctx);

			expect(result).toEqual(currentUser);
			// Should only call usersTable.findFirst once (for current user)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should return creator user when creatorId is different from currentUserId", async () => {
			const currentUser = {
				id: "user123",
				role: "administrator",
				name: "Current User",
				email: "current@example.com",
			};
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			// First call returns current user, second call returns creator
			let callCount = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
					};

					// Execute the where callback to ensure coverage
					if (args?.where) {
						const fields = { id: "users.id" };
						const operators = { eq: vi.fn() };
						args.where(fields, operators);
					}

					callCount++;
					if (callCount === 1) {
						return Promise.resolve(currentUser);
					}
					return Promise.resolve(creatorUser);
				},
			);

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			});

			// Set creatorId to a different user
			mockAgendaItem.creatorId = "creator-789";

			const result = await creatorResolver(mockAgendaItem, {}, ctx);

			expect(result).toEqual(creatorUser);
			// Should call usersTable.findFirst twice (once for current user, once for creator)
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});

		it("should return creator when user is system administrator", async () => {
			setupAuthorizedMocks("administrator", "member");

			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			let callCount = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						id: "user123",
						role: "administrator",
					});
				}
				return Promise.resolve(creatorUser);
			});

			mockAgendaItem.creatorId = "creator-789";

			const result = await creatorResolver(mockAgendaItem, {}, ctx);

			expect(result).toEqual(creatorUser);
		});

		it("should return creator when user is organization administrator", async () => {
			const creatorUser = {
				id: "creator-789",
				role: "member",
				name: "Creator User",
				email: "creator@example.com",
			};

			let callCount = 0;
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						id: "user123",
						role: "member", // Not a system admin
					});
				}
				return Promise.resolve(creatorUser);
			});

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValue({
				isAgendaItemFolder: true,
				event: {
					startAt: new Date("2024-01-01T00:00:00Z"),
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [{ role: "administrator" }], // But is org admin
					},
				},
			});

			mockAgendaItem.creatorId = "creator-789";

			const result = await creatorResolver(mockAgendaItem, {}, ctx);

			expect(result).toEqual(creatorUser);
		});
	});

	describe("Where clause coverage", () => {
		it("should execute agendaFoldersTable where clause with correct parameters", async () => {
			const eqMock = vi.fn();

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user123",
				role: "administrator",
			});

			mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockImplementation(
				(...funcArgs: unknown[]) => {
					const args = funcArgs[0] as {
						where?: (fields: unknown, operators: unknown) => void;
						with?: {
							event?: {
								with?: {
									organization?: {
										with?: {
											membershipsWhereOrganization?: {
												where?: (fields: unknown, operators: unknown) => void;
											};
										};
									};
								};
							};
						};
					};

					// Execute the main where callback
					if (args?.where) {
						const fields = { id: "agendaFolders.id" };
						const operators = { eq: eqMock };
						args.where(fields, operators);
					}

					// Execute nested where callback for membershipsWhereOrganization
					if (
						args?.with?.event?.with?.organization?.with
							?.membershipsWhereOrganization?.where
					) {
						const fields = { memberId: "organizationMemberships.memberId" };
						const operators = { eq: eqMock };
						args.with.event.with.organization.with.membershipsWhereOrganization.where(
							fields,
							operators,
						);
					}

					return Promise.resolve({
						isAgendaItemFolder: true,
						event: {
							startAt: new Date("2024-01-01T00:00:00Z"),
							organization: {
								countryCode: "US",
								membershipsWhereOrganization: [{ role: "administrator" }],
							},
						},
					});
				},
			);

			mockAgendaItem.creatorId = null;

			await creatorResolver(mockAgendaItem, {}, ctx);

			// Verify eq was called for folder id lookup
			expect(eqMock).toHaveBeenCalledWith(
				"agendaFolders.id",
				mockAgendaItem.folderId,
			);
			// Verify eq was called for membership lookup
			expect(eqMock).toHaveBeenCalledWith(
				"organizationMemberships.memberId",
				"user123",
			);
		});
	});
});

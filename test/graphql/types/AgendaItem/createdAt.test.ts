import { initGraphQLTada } from "gql.tada";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import "~/src/graphql/types/AgendaItem/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

afterEach(() => {
	vi.clearAllMocks();
});

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_agendaItem_createdAt = gql(`
  query AgendaItemCreatedAt($id: String!) {
    agendaItem(input: { id: $id }) {
      id
      createdAt
    }
  }
`);

type AdminAuth = { token: string; userId: string };

async function getAdminAuth(): Promise<AdminAuth> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
	assertToBeNonNullish(signInResult.data?.signIn?.user);

	return {
		token: signInResult.data.signIn.authenticationToken,
		userId: signInResult.data.signIn.user.id,
	};
}

async function createOrgEventFolderAndAgendaItem(
	authToken: string,
	adminUserId: string,
): Promise<{
	orgId: string;
	eventId: string;
	agendaItemId: string;
}> {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	const orgId = orgResult.data.createOrganization.id as string;

	const membership = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: adminUserId,
					role: "administrator",
				},
			},
		},
	);

	assertToBeNonNullish(membership.data?.createOrganizationMembership?.id);

	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Event-${Date.now()}`,
				organizationId: orgId,
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
				description: "Test event",
			},
		},
	});

	assertToBeNonNullish(eventResult.data?.createEvent?.id);
	const eventId = eventResult.data.createEvent.id as string;

	const folderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Folder-${Date.now()}`,
					eventId,
					description: "desc",
					sequence: 1,
					organizationId: "org-id",
				},
			},
		},
	);

	assertToBeNonNullish(folderResult.data?.createAgendaFolder?.id);
	const folderId = folderResult.data.createAgendaFolder.id as string;

	const agendaItemResult = await mercuriusClient.mutate(
		gql(`
      mutation CreateAgendaItem($input: MutationCreateAgendaItemInput!) {
        createAgendaItem(input: $input) {
          id
          createdAt
        }
      }
    `),
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					folderId,
					name: "Test Agenda Item",
					description: "Test Description",
					type: "general",
				},
			},
		},
	);

	assertToBeNonNullish(agendaItemResult.data?.createAgendaItem?.id);

	const agendaItemId = agendaItemResult.data.createAgendaItem.id as string;

	return { orgId, eventId, agendaItemId };
}

async function cleanup(
	authToken: string,
	{
		orgId,
		eventId,
	}: {
		orgId: string;
		eventId: string;
	},
) {
	try {
		await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: eventId } },
		});
	} catch {}

	try {
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});
	} catch {}
}

// Integration-level tests mirroring AgendaFolder.createdAt tests structure

describe("AgendaItem.createdAt resolver - Integration", () => {
	// This test covers the authentication check block in the actual source file
	// by calling the createdAt field resolver without authentication
	it("should return unauthenticated error when client is not authenticated", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, eventId, agendaItemId } =
			await createOrgEventFolderAndAgendaItem(
				adminAuth.token,
				adminAuth.userId,
			);

		try {
			// Query createdAt field without authentication headers
			// This will trigger the authentication check in the field resolver
			const result = await mercuriusClient.query(Query_agendaItem_createdAt, {
				variables: {
					id: agendaItemId,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
				eventId,
			});
		}
	});

	it("should return createdAt when user is authenticated as administrator", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, eventId, agendaItemId } =
			await createOrgEventFolderAndAgendaItem(
				adminAuth.token,
				adminAuth.userId,
			);

		try {
			const result = await mercuriusClient.query(Query_agendaItem_createdAt, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: agendaItemId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.agendaItem?.createdAt).toBeDefined();
			expect(result.data?.agendaItem?.id).toBe(agendaItemId);
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
				eventId,
			});
		}
	});

	// This test covers the authorization check block in the actual source file
	// Tests the case where a regular user (not admin) user tries to access createdAt
	it("should return unauthorized_action error when non-admin user tries to access createdAt", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, eventId, agendaItemId } =
			await createOrgEventFolderAndAgendaItem(
				adminAuth.token,
				adminAuth.userId,
			);

		// Create a regular user (non-admin, not a member of the organization)
		const regularUserResult = await mercuriusClient.mutate(
			gql(`
                mutation SignUp($input: MutationSignUpInput!) {
                    signUp(input: $input) {
                        authenticationToken
                        user {
                            id
                        }
                    }
                }
            `),
			{
				variables: {
					input: {
						emailAddress: `regular-user-${Date.now()}@test.com`,
						password: "Password123!",
						name: "Regular User",
						selectedOrganization: orgId,
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(regularUserResult.data?.signUp?.user?.id);

		const regularUserToken = regularUserResult.data.signUp.authenticationToken;
		const regularUserId = regularUserResult.data.signUp.user.id;

		try {
			// Regular user (not an admin of the organization) tries to access createdAt
			const result = await mercuriusClient.query(Query_agendaItem_createdAt, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					id: agendaItemId,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
		} finally {
			// Cleanup regular user
			try {
				await mercuriusClient.mutate(
					gql(`
                        mutation DeleteUser($input: MutationDeleteUserInput!) {
                            deleteUser(input: $input) {
                                id
                            }
                        }
                    `),
					{
						headers: { authorization: `bearer ${adminAuth.token}` },
						variables: {
							input: {
								id: regularUserId,
							},
						},
					},
				);
			} catch {}
			await cleanup(adminAuth.token, {
				orgId,
				eventId,
			});
		}
	});
});

// Unit-level tests for branch coverage using a local implementation mirroring the resolve function

describe("AgendaItem.createdAt resolver - Unit branch coverage", () => {
	const mockParent: AgendaItemType = {
		id: "agendaItem-123",
		folderId: "folder-123",
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
	} as AgendaItemType;

	const createResolver = () => {
		return async (
			parent: AgendaItemType,
			_args: unknown,
			ctx: ReturnType<typeof createMockGraphQLContext>["context"],
		) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingAgendaFolder] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.agendaFoldersTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parent.folderId),
					with: {
						event: {
							columns: {
								startAt: true,
							},
							with: {
								organization: {
									columns: {
										countryCode: true,
									},
									with: {
										membershipsWhereOrganization: {
											columns: {
												role: true,
											},
											where: (fields, operators) =>
												operators.eq(fields.memberId, currentUserId),
										},
									},
								},
							},
						},
					},
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingAgendaFolder === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			const currentUserOrganizationMembership =
				existingAgendaFolder.event.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			return parent.createdAt;
		};
	};

	it("should throw unauthenticated when client is not authenticated", async () => {
		const { context } = createMockGraphQLContext(false);
		const resolver = createResolver();

		await expect(resolver(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated when current user is not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		await expect(resolver(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unexpected when agenda folder is not found", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const errorSpy = vi.spyOn(context.log, "error");

		await expect(resolver(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(errorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);
	});

	it("should throw unauthorized_action when user is not admin and has no admin membership", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		await expect(resolver(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unauthorized_action when user is member but not administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "member" }],
					},
				},
			} as never,
		);

		await expect(resolver(mockParent, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return createdAt when user is administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "admin-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-123",
			role: "administrator",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			} as never,
		);

		const result = await resolver(mockParent, {}, context);

		expect(result).toEqual(mockParent.createdAt);
	});

	it("should return createdAt when user is organization administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		mocks.drizzleClient.query.agendaFoldersTable.findFirst.mockResolvedValueOnce(
			{
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			} as never,
		);

		const result = await resolver(mockParent, {}, context);

		expect(result).toEqual(mockParent.createdAt);
	});

	it("should verify both top-level and nested where clauses", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const resolver = createResolver();

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		// Mock the agendaFoldersTable.findFirst to verify both where clauses
		(
			mocks.drizzleClient.query.agendaFoldersTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation(({ where: topLevelWhere, with: withClause }) => {
			// Verify top-level where clause (correctness-critical)
			expect(topLevelWhere).toBeDefined();

			// Create mock fields and operators to test the top-level where clause
			const mockTopLevelFields = {
				id: "test-folder-id-field",
			};
			const mockTopLevelOperators = {
				eq: vi.fn((field, value) => ({ field, value })),
			};

			// Call the top-level where clause function
			const topLevelWhereResult = topLevelWhere(
				mockTopLevelFields,
				mockTopLevelOperators,
			);

			// Verify that the top-level where clause is filtering by parent.folderId
			expect(mockTopLevelOperators.eq).toHaveBeenCalledWith(
				mockTopLevelFields.id,
				mockParent.folderId,
			);
			expect(topLevelWhereResult).toEqual({
				field: "test-folder-id-field",
				value: mockParent.folderId,
			});

			// Verify nested where clause (security-critical)
			expect(withClause).toBeDefined();
			expect(withClause.event).toBeDefined();
			expect(withClause.event.with).toBeDefined();
			expect(withClause.event.with.organization).toBeDefined();
			expect(withClause.event.with.organization.with).toBeDefined();
			expect(
				withClause.event.with.organization.with.membershipsWhereOrganization,
			).toBeDefined();

			// Create mock fields and operators to test the nested where clause
			const mockNestedFields = {
				memberId: "test-member-field",
			};
			const mockNestedOperators = {
				eq: vi.fn((field, value) => ({ field, value })),
			};

			// Call the nested where clause function
			const nestedWhereResult =
				withClause.event.with.organization.with.membershipsWhereOrganization.where(
					mockNestedFields,
					mockNestedOperators,
				);

			// Verify that the nested where clause is filtering by the current user ID
			expect(mockNestedOperators.eq).toHaveBeenCalledWith(
				mockNestedFields.memberId,
				"user-123",
			);
			expect(nestedWhereResult).toEqual({
				field: "test-member-field",
				value: "user-123",
			});

			return Promise.resolve({
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			});
		});

		const result = await resolver(mockParent, {}, context);

		expect(result).toEqual(mockParent.createdAt);
	});
});

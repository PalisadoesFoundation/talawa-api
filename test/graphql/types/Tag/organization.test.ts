import { initGraphQLTada } from "gql.tada";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Tag/organization";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_signUp,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test Tag.organization field
const Query_tag_organization = gql(`
  query TagOrganization($id: String!) {
    tag(input: { id: $id }) {
      id
      organization {
        id
        name
      }
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

async function createOrgAndTag(
	authToken: string,
	adminUserId: string,
): Promise<{ orgId: string; tagId: string }> {
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

	const tagResult = await mercuriusClient.mutate(Mutation_createTag, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Tag-${Date.now()}`,
				organizationId: orgId,
			},
		},
	});

	assertToBeNonNullish(tagResult.data?.createTag?.id);
	const tagId = tagResult.data.createTag.id as string;

	return { orgId, tagId };
}

async function cleanup(authToken: string, { orgId }: { orgId: string }) {
	try {
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});
	} catch (error) {
		console.warn(`Cleanup failed for org ${orgId}:`, error);
	}
}

describe("Tag.organization resolver - Integration", () => {
	it("unauthenticated → unauthenticated error", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_organization, {
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("admin → organization returned", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.organization).toBeDefined();
			expect(result.data?.tag?.organization?.id).toBe(orgId);
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("org member (non-admin) → organization returned", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		const regularUserResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: `regular-user-${Date.now()}@test.com`,
					password: "Password123!",
					name: "Regular User",
					selectedOrganization: orgId,
				},
			},
		});

		assertToBeNonNullish(regularUserResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(regularUserResult.data?.signUp?.user?.id);

		const regularUserToken = regularUserResult.data.signUp.authenticationToken;
		const regularUserId = regularUserResult.data.signUp.user.id;

		try {
			const result = await mercuriusClient.query(Query_tag_organization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					id: tagId,
				},
			});

			// Organization members should be able to access the organization field
			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.organization).toBeDefined();
			expect(result.data?.tag?.organization?.id).toBe(orgId);
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							id: regularUserId,
						},
					},
				});
			} catch (error) {
				console.warn(`Cleanup failed for user ${regularUserId}:`, error);
			}
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("org admin → organization returned", async () => {
		const adminAuth = await getAdminAuth();

		// Create a temporary org for user signup (required by signUp mutation).
		// The test user will then be granted admin membership on a separate org
		// to verify org-level admin access to tags.
		const tempOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						name: `TempOrg-${Date.now()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(tempOrgResult.data?.createOrganization?.id);
		const tempOrgId = tempOrgResult.data.createOrganization.id as string;

		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		const orgAdminResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: `org-admin-${Date.now()}@test.com`,
					password: "Password123!",
					name: "Org Admin",
					selectedOrganization: tempOrgId,
				},
			},
		});

		assertToBeNonNullish(orgAdminResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(orgAdminResult.data?.signUp?.user?.id);

		const orgAdminToken = orgAdminResult.data.signUp.authenticationToken;
		const orgAdminUserId = orgAdminResult.data.signUp.user.id;

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdminUserId,
					role: "administrator",
				},
			},
		});

		try {
			const result = await mercuriusClient.query(Query_tag_organization, {
				headers: { authorization: `bearer ${orgAdminToken}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.organization).toBeDefined();
			expect(result.data?.tag?.organization?.id).toBe(orgId);
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							id: orgAdminUserId,
						},
					},
				});
			} catch (error) {
				console.warn(`Cleanup failed for user ${orgAdminUserId}:`, error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { input: { id: tempOrgId } },
				});
			} catch (error) {
				console.warn(`Cleanup failed for org ${tempOrgId}:`, error);
			}
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});
});

describe("Tag.organization resolver - Unit test edge case", () => {
	it("should throw unexpected error when organization is not found", async () => {
		const graphqlInstance = (
			server as unknown as {
				graphql?: { schema?: import("graphql").GraphQLSchema };
			}
		).graphql;
		expect(graphqlInstance).toBeDefined();
		const schema = graphqlInstance?.schema;
		expect(schema).toBeDefined();

		const tagType = schema?.getType("Tag");
		expect(tagType).toBeDefined();

		const fields = (tagType as import("graphql").GraphQLObjectType).getFields();
		expect(fields.organization).toBeDefined();

		const resolver = fields.organization?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: "tag-123",
			organizationId: "org-123",
			name: "Test Tag",
		};

		const { context, mocks } = createMockGraphQLContext(true, "admin-user");

		// Mock the current user as an administrator
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-user",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		// Mock organization lookup to return undefined (simulating database corruption or race condition)
		mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		await expect(resolver(parent, {}, ctx, {})).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			} as unknown),
		);

		// Verify error was logged
		expect(context.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a tag's organization id that isn't null.",
		);
	});
});

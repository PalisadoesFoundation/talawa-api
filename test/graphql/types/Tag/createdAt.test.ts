import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Tag/createdAt";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_currentUser,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test Tag.createdAt field
const Query_tag_createdAt = gql(`
  query TagCreatedAt($id: String!) {
    tag(input: { id: $id }) {
      id
      createdAt
    }
  }
`);

type AdminAuth = { token: string; userId: string };

async function getAdminAuth(): Promise<AdminAuth> {
	const { accessToken: token } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${token}` },
	});
	assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
	return {
		token,
		userId: currentUserResult.data.currentUser.id,
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

describe("Tag.createdAt resolver - Integration", () => {
	it("unauthenticated → unauthenticated error", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_createdAt, {
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

	it("admin → createdAt returned", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_createdAt, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.createdAt).toBeDefined();
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("non-admin → unauthorized_action", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		const regularEmail = `regular-user-${Date.now()}@test.com`;
		const regularPassword = "Password123!";
		const createUserRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					emailAddress: regularEmail,
					password: regularPassword,
					name: "Regular User",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const regularUserId = createUserRes.data?.createUser?.user?.id;
		assertToBeNonNullish(regularUserId);
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: regularUserId,
					role: "regular",
				},
			},
		});
		const signInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: regularEmail, password: regularPassword },
		});
		expect(signInRes.statusCode).toBe(200);
		const regularUserToken = signInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(regularUserToken);

		try {
			const result = await mercuriusClient.query(Query_tag_createdAt, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
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

	it("org admin → createdAt returned", async () => {
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

		const orgAdminEmail = `org-admin-${Date.now()}@test.com`;
		const orgAdminPassword = "Password123!";
		const createOrgAdminRes = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						emailAddress: orgAdminEmail,
						password: orgAdminPassword,
						name: "Org Admin",
						role: "regular",
						isEmailAddressVerified: false,
					},
				},
			},
		);
		const orgAdminUserId = createOrgAdminRes.data?.createUser?.user?.id;
		assertToBeNonNullish(orgAdminUserId);
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					organizationId: tempOrgId,
					memberId: orgAdminUserId,
					role: "regular",
				},
			},
		});
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
		const orgAdminSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: orgAdminEmail, password: orgAdminPassword },
		});
		expect(orgAdminSignInRes.statusCode).toBe(200);
		const orgAdminToken = orgAdminSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(orgAdminToken);

		try {
			const result = await mercuriusClient.query(Query_tag_createdAt, {
				headers: { authorization: `bearer ${orgAdminToken}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.createdAt).toBeDefined();
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

describe("Tag.createdAt resolver - Unit test edge case", () => {
	it("should throw unauthenticated error when user is authenticated but not found in database", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context, mocks } = createMockGraphQLContext(true, "missing-user");
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		await expect(resolver(parent, {}, ctx, {})).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			} as unknown),
		);
	});

	it("should throw unauthenticated error when user is NOT authenticated", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context } = createMockGraphQLContext(false);

		await expect(resolver(parent, {}, context, {})).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			} as unknown),
		);
	});

	it("should throw unauthorized_action when user is not a member of the organization", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context, mocks } = createMockGraphQLContext(true, "regular-user");
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "user", // Not an admin
			organizationMembershipsWhereMember: [], // Not a member of the org (as filtered by query)
		});

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		await expect(resolver(parent, {}, ctx, {})).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthorized_action" }),
			} as unknown),
		);
	});

	it("should throw unauthorized_action when user is a regular member but not an admin", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context, mocks } = createMockGraphQLContext(true, "regular-user");
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "user", // Not a global admin
			organizationMembershipsWhereMember: [
				{
					role: "member", // Regular member, not org admin
				},
			],
		});

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		await expect(resolver(parent, {}, ctx, {})).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthorized_action" }),
			} as unknown),
		);
	});

	it("should return createdAt when user is a global administrator", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context, mocks } = createMockGraphQLContext(true, "admin-user");
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "administrator", // Global admin
			organizationMembershipsWhereMember: [],
		});

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		const result = await resolver(parent, {}, ctx, {});
		expect(result).toEqual(parent.createdAt);
	});

	it("should return createdAt when user is an organization administrator", async () => {
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
		expect(fields.createdAt).toBeDefined();

		const resolver = fields.createdAt?.resolve as (
			parent: unknown,
			args: unknown,
			ctx: unknown,
			info: unknown,
		) => Promise<unknown>;

		const parent = {
			id: uuidv7(),
			createdAt: faker.date.past(),
			organizationId: uuidv7(),
		};

		const { context, mocks } = createMockGraphQLContext(true, "org-admin-user");
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			role: "user", // Not a global admin
			organizationMembershipsWhereMember: [
				{
					role: "administrator", // Organization admin
				},
			],
		});

		const ctx = {
			...context,
			drizzleClient: mocks.drizzleClient,
		};

		const result = await resolver(parent, {}, ctx, {});
		expect(result).toEqual(parent.createdAt);
	});

	describe("Error Handling", () => {
		// This test expects the resolver to handle database query errors gracefully
		it("should handle database query errors gracefully", async () => {
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

			const fields = (
				tagType as import("graphql").GraphQLObjectType
			).getFields();
			expect(fields.createdAt).toBeDefined();

			const resolver = fields.createdAt?.resolve as (
				parent: unknown,
				args: unknown,
				ctx: unknown,
				info: unknown,
			) => Promise<unknown>;

			const parent = {
				id: uuidv7(),
				createdAt: faker.date.past(),
				organizationId: uuidv7(),
			};

			const { context, mocks } = createMockGraphQLContext(true, "admin-user");
			// Simulate database error
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				new Error("Database connection failed"),
			);

			const ctx = {
				...context,
				drizzleClient: mocks.drizzleClient,
			};

			await expect(resolver(parent, {}, ctx, {})).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle edge case where organizationMembershipsWhereMember is undefined", async () => {
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

			const fields = (
				tagType as import("graphql").GraphQLObjectType
			).getFields();
			expect(fields.createdAt).toBeDefined();

			const resolver = fields.createdAt?.resolve as (
				parent: unknown,
				args: unknown,
				ctx: unknown,
				info: unknown,
			) => Promise<unknown>;

			const parent = {
				id: uuidv7(),
				createdAt: faker.date.past(),
				organizationId: uuidv7(),
			};

			const { context, mocks } = createMockGraphQLContext(true, "regular-user");
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				role: "user", // Not a global admin
				organizationMembershipsWhereMember: undefined as unknown as [], // undefined memberships
			});

			const ctx = {
				...context,
				drizzleClient: mocks.drizzleClient,
			};

			// This should throw a TypeError when trying to access [0] on undefined
			await expect(resolver(parent, {}, ctx, {})).rejects.toThrow(TypeError);
		});
	});
});

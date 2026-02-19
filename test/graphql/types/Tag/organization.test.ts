import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Tag/organization";
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
				name: `Org-${faker.string.ulid()}`,
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
				name: `Tag-${faker.string.ulid()}`,
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

		const regularEmail = `regular-user-${faker.string.ulid()}@test.com`;
		const regularPassword = "Password123!";
		const createRes = await mercuriusClient.mutate(Mutation_createUser, {
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
		const regularUserId = createRes.data?.createUser?.user?.id;
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

	it("authenticated non-member → unauthorized error", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		// Create a different organization for the non-member user
		const diffOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						name: `DiffOrg-${faker.string.ulid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(diffOrgResult.data?.createOrganization?.id);
		const diffOrgId = diffOrgResult.data.createOrganization.id as string;

		// Create a user in the different organization (authenticated but not a member of the target org)
		const nonMemberEmail = `non-member-${faker.string.ulid()}@test.com`;
		const nonMemberPassword = "Password123!";
		const createNonMemberRes = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						emailAddress: nonMemberEmail,
						password: nonMemberPassword,
						name: "Non Member User",
						role: "regular",
						isEmailAddressVerified: false,
					},
				},
			},
		);
		const nonMemberId = createNonMemberRes.data?.createUser?.user?.id;
		assertToBeNonNullish(nonMemberId);
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					organizationId: diffOrgId,
					memberId: nonMemberId,
					role: "regular",
				},
			},
		});
		const nonMemberSignInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: nonMemberEmail, password: nonMemberPassword },
		});
		expect(nonMemberSignInRes.statusCode).toBe(200);
		const nonMemberToken = nonMemberSignInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(nonMemberToken);

		try {
			const result = await mercuriusClient.query(Query_tag_organization, {
				headers: { authorization: `bearer ${nonMemberToken}` },
				variables: {
					id: tagId,
				},
			});

			// Non-member should be denied access
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		} finally {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							id: nonMemberId,
						},
					},
				});
			} catch (error) {
				console.warn(`Cleanup failed for user ${nonMemberId}:`, error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { input: { id: diffOrgId } },
				});
			} catch (error) {
				console.warn(`Cleanup failed for org ${diffOrgId}:`, error);
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
						name: `TempOrg-${faker.string.ulid()}`,
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

		const orgAdminEmail = `org-admin-${faker.string.ulid()}@test.com`;
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

// Unit tests for the Tag.organization resolver using mocked context
// These tests directly call the exported resolveOrganization function
describe("Tag.organization resolver - Unit tests", () => {
	it("should successfully return organization when DataLoader finds it", async () => {
		const { resolveOrganization } = await import(
			"~/src/graphql/types/Tag/organization"
		);

		const parent = {
			id: "tag-123",
			organizationId: "org-123",
			name: "Test Tag",
			folderId: null,
			creatorId: "user-123",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockOrganization = {
			id: "org-123",
			name: "Test Organization",
		};

		const { context } = createMockGraphQLContext(true, "user-123");
		context.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		const result = await resolveOrganization(parent, {}, context);

		expect(context.dataloaders.organization.load).toHaveBeenCalledWith(
			"org-123",
		);
		expect(result).toEqual(mockOrganization);
	});

	it("should throw 'unexpected' error and log when organization is null (data corruption)", async () => {
		const { resolveOrganization } = await import(
			"~/src/graphql/types/Tag/organization"
		);

		const parent = {
			id: "tag-456",
			organizationId: "org-missing",
			name: "Test Tag",
			folderId: null,
			creatorId: "user-123",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const { context } = createMockGraphQLContext(true, "user-123");
		context.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

		const logErrorSpy = vi.spyOn(context.log, "error");

		await expect(resolveOrganization(parent, {}, context)).rejects.toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			} as unknown),
		);

		expect(logErrorSpy).toHaveBeenCalledWith(
			{
				tagId: "tag-456",
				organizationId: "org-missing",
			},
			"DataLoader returned null for a tag's organization id that isn't null.",
		);
	});

	it("should call DataLoader with correct organizationId from parent", async () => {
		const { resolveOrganization } = await import(
			"~/src/graphql/types/Tag/organization"
		);

		const parent = {
			id: "tag-789",
			organizationId: "specific-org-id",
			name: "Test Tag",
			folderId: null,
			creatorId: "user-123",
			updaterId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockOrganization = { id: "specific-org-id", name: "Specific Org" };

		const { context } = createMockGraphQLContext(true, "user-123");
		context.dataloaders.organization.load = vi
			.fn()
			.mockResolvedValue(mockOrganization);

		await resolveOrganization(parent, {}, context);

		expect(context.dataloaders.organization.load).toHaveBeenCalledTimes(1);
		expect(context.dataloaders.organization.load).toHaveBeenCalledWith(
			"specific-org-id",
		);
	});
});

import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import "~/src/graphql/types/Tag/folder";
import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { schemaManager } from "~/src/graphql/schemaManager";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_createTagFolder,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_signUp,
	Query_signIn,
} from "../documentNodes";

it("should throw unexpected error when schema integrity is compromised (folder missing)", async () => {
	const adminAuth = await getAdminAuth();
	const { orgId, tagId } = await createOrgTagAndFolder(
		adminAuth.token,
		adminAuth.userId,
	);

	// Spy on tagFoldersTable query to simulate missing folder despite ID existing
	const spy = vi
		.spyOn(server.drizzleClient.query.tagFoldersTable, "findFirst")
		.mockResolvedValue(undefined);

	// Silent error logs for this test
	const logSpy = vi.spyOn(server.log, "error").mockImplementation(() => {});

	try {
		const result = await mercuriusClient.query(Query_tag_folder, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				id: tagId,
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		expect(result.errors?.[0]?.path).toEqual(["tag", "folder"]);
	} finally {
		spy.mockRestore();
		logSpy.mockRestore();
		await cleanup(adminAuth.token, {
			orgId,
		});
	}
});

it("should throw unauthenticated error when accessing tag folder via unprotected query (coverage hack)", async () => {
	// 1. Extend schema with unprotected query
	builder.queryField("unprotectedTag", (t) =>
		t.field({
			type: Tag,
			resolve: () => {
				return {
					id: "test-tag-id",
					name: "test-tag",
					organizationId: "org-1",
					folderId: "folder-1",
					createdAt: new Date(),
					updatedAt: new Date(),
				} as Tag;
			},
		}),
	);

	// 2. Rebuild schema
	await schemaManager.rebuildSchema();

	// 3. Query the new field's folder
	// We use a raw string because gql.tada doesn't know about this runtime field
	const UnprotectedQuery = `
            query {
                unprotectedTag {
                    folder {
                        id
                    }
                }
            }
        `;

	const result = await mercuriusClient.query(UnprotectedQuery);

	// 4. Expect unauthenticated error from Tag.folder resolver
	expect(result.errors).toBeDefined();
	expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	expect(result.errors?.[0]?.path).toEqual(["unprotectedTag", "folder"]);
});

import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test Tag.folder field
const Query_tag_folder = gql(`
  query TagFolder($id: String!) {
    tag(input: { id: $id }) {
      id
      folder {
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

async function createOrgTagAndFolder(
	authToken: string,
	adminUserId: string,
): Promise<{ orgId: string; tagId: string; folderId: string }> {
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

	// Create folder first
	const folderResult = await mercuriusClient.mutate(Mutation_createTagFolder, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Folder-${faker.string.ulid()}`,
				organizationId: orgId,
			},
		},
	});

	assertToBeNonNullish(folderResult.data?.createTagFolder?.id);
	const folderId = folderResult.data.createTagFolder.id as string;

	// Create tag with folderId
	const tagResult = await mercuriusClient.mutate(Mutation_createTag, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Tag-${faker.string.ulid()}`,
				organizationId: orgId,
				folderId: folderId,
			},
		},
	});

	assertToBeNonNullish(tagResult.data?.createTag?.id);
	const tagId = tagResult.data.createTag.id as string;

	return { orgId, tagId, folderId };
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

describe("Tag.folder resolver - Integration", () => {
	it("unauthenticated → unauthenticated error", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
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

	it("admin → folder returned when tag has folder", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId, folderId } = await createOrgTagAndFolder(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.folder).toBeDefined();
			expect(result.data?.tag?.folder?.id).toBe(folderId);
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("admin → null returned when tag has no folder", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.folder).toBeNull();
			expect(result.data?.tag?.id).toBe(tagId);
		} finally {
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
		const nonMemberResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: `non-member-${faker.string.ulid()}@test.com`,
					password: "Password123!",
					name: "Non Member User",
					selectedOrganization: diffOrgId,
				},
			},
		});

		assertToBeNonNullish(nonMemberResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(nonMemberResult.data?.signUp?.user?.id);

		const nonMemberToken = nonMemberResult.data.signUp.authenticationToken;
		const nonMemberId = nonMemberResult.data.signUp.user.id;

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
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

	it("org admin → folder returned", async () => {
		const adminAuth = await getAdminAuth();

		// Create a temporary org for user signup (required by signUp mutation).
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

		const { orgId, tagId, folderId } = await createOrgTagAndFolder(
			adminAuth.token,
			adminAuth.userId,
		);

		const orgAdminResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: `org-admin-${faker.string.ulid()}@test.com`,
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
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${orgAdminToken}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.tag?.folder).toBeDefined();
			expect(result.data?.tag?.folder?.id).toBe(folderId);
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

	it("org member (non-admin) → unauthorized_action error", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgTagAndFolder(
			adminAuth.token,
			adminAuth.userId,
		);

		const regularUserResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: `regular-user-${faker.string.ulid()}@test.com`,
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
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					id: tagId,
				},
			});

			// Regular org member (non-admin) should get unauthorized_action on the folder field
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

	it("should throw unauthenticated error when user not found in database (simulated race condition)", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgAndTag(
			adminAuth.token,
			adminAuth.userId,
		);

		const adminUserMock = {
			id: adminAuth.userId,
			role: "administrator" as const,
			organizationMembershipsWhereMember: [
				{
					role: "administrator" as const,
				},
			],
		};

		// Spy on usersTable.findFirst
		// Call 1: Query.tag (auth check) -> Return valid user
		// Call 2: Tag.folder (auth check) -> Return undefined (simulating user deletion or issue)
		const spy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValueOnce(
				adminUserMock as unknown as typeof usersTable.$inferSelect,
			)
			.mockResolvedValueOnce(undefined);

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeDefined();
			// The error code comes from Tag.folder resolver's check
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
			// Verify path to ensure it's the folder field error, not the parent tag error
			// Note: If parent fails, path is ["tag"]. If child fails, path is ["tag", "folder"]
			expect(result.errors?.[0]?.path).toEqual(["tag", "folder"]);
		} finally {
			spy.mockRestore();
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});

	it("should throw unexpected error when schema integrity is compromised (folder missing)", async () => {
		const adminAuth = await getAdminAuth();
		const { orgId, tagId } = await createOrgTagAndFolder(
			adminAuth.token,
			adminAuth.userId,
		);

		// Spy on tagFoldersTable query to simulate missing folder despite ID existing
		const spy = vi
			.spyOn(server.drizzleClient.query.tagFoldersTable, "findFirst")
			.mockResolvedValue(undefined);

		// Silent error logs for this test
		const logSpy = vi.spyOn(server.log, "error").mockImplementation(() => {});

		try {
			const result = await mercuriusClient.query(Query_tag_folder, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					id: tagId,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(result.errors?.[0]?.path).toEqual(["tag", "folder"]);
		} finally {
			spy.mockRestore();
			logSpy.mockRestore();
			await cleanup(adminAuth.token, {
				orgId,
			});
		}
	});
});

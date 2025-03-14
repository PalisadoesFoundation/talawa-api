import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_organization,
	Query_signIn,
} from "../documentNodes";

suite("Organization Members Query", () => {
	let adminAuthToken: string;
	let organizationId: string;
	let regularUserId: string;
	let adminUserId: string;
	const membershipIds: string[] = [];
	const userIds: string[] = [];

	// Helper function to create a test user
	async function createTestUser(
		role: "administrator" | "regular",
		name?: string,
	): Promise<{ id: string; authToken: string }> {
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: false,
					name: name || faker.person.fullName(),
					password: "password123",
					role: role,
				},
			},
		});

		assertToBeNonNullish(createUserResult.data?.createUser);
		return {
			id: createUserResult.data.createUser.user?.id as string,
			authToken: createUserResult.data.createUser.authenticationToken as string,
		};
	}

	// Helper function to create an organization membership
	async function createOrganizationMembership(
		userId: string,
		organizationId: string,
		role: "administrator" | "regular" = "regular",
	) {
		const result = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						memberId: userId,
						organizationId: organizationId,
						role: role,
					},
				},
			},
		);

		assertToBeNonNullish(result.data?.createOrganizationMembership);
		return result.data.createOrganizationMembership.id;
	}

	// Setup
	beforeAll(async () => {
		// Sign in as admin
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
		adminAuthToken = adminSignInResult.data.signIn.authenticationToken;

		// Create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		organizationId = orgResult.data.createOrganization.id;

		// Create a regular user
		const regularUser = await createTestUser("regular");
		regularUserId = regularUser.id as string;
		userIds.push(regularUserId);

		// Create multiple users for testing
		const adminUser = await createTestUser("administrator", "Test Admin User");
		adminUserId = adminUser.id as string;
		userIds.push(adminUserId);

		// Create organization memberships
		const adminMembershipId = await createOrganizationMembership(
			adminUserId,
			organizationId,
			"administrator",
		);
		const regularMembershipId = await createOrganizationMembership(
			regularUserId,
			organizationId,
			"regular",
		);
		membershipIds.push(adminMembershipId, regularMembershipId);
	});

	// Cleanup
	afterAll(async () => {
		// Delete organization memberships
		for (const membershipId of membershipIds) {
			await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						organizationId: organizationId,
						memberId: membershipId,
					},
				},
			});
		}

		// Delete users
		for (const userId of userIds) {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: userId,
					},
				},
			});
		}

		// Delete organization
		if (organizationId) {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: organizationId,
					},
				},
			});
		}
	});

	suite("Authentication and Authorization", () => {
		test("returns error when user is not authenticated", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				variables: {
					input: { id: organizationId },
					first: 5,
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("returns error when authenticated user is not a member of organization", async () => {
			// Create a new non-member user
			const nonMemberUser = await createTestUser("regular");
			userIds.push(nonMemberUser.id);

			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${nonMemberUser.authToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
					}),
				]),
			);
		});
		test("returns error when authenticated user is deleted but token is still valid", async () => {
			//user2
			// Create and sign in as regular user
			const createUser2Result = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							emailAddress: `${faker.string.ulid()}2@test.com`,
							isEmailAddressVerified: false,
							name: "Regular User 2",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(createUser2Result.data?.createUser);
			const regularUser2Id = createUser2Result.data.createUser.user?.id;
			const regularUser2AuthToken =
				createUser2Result.data.createUser.authenticationToken || "";

			if (regularUser2Id) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: regularUser2Id,
						},
					},
				});
			}

			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${regularUser2AuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("Pagination", () => {
		test("returns first page of results with default pagination", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.members?.edges).toBeDefined();
			expect(result.data?.organization?.members?.pageInfo).toBeDefined();
			expect(Array.isArray(result.data?.organization?.members?.edges)).toBe(
				true,
			);
			expect(
				result.data?.organization?.members?.edges?.length,
			).toBeLessThanOrEqual(10);
			expect(result.data?.organization?.members?.pageInfo).toEqual(
				expect.objectContaining({
					hasNextPage: expect.any(Boolean),
					hasPreviousPage: expect.any(Boolean),
				}),
			);
		});

		test("handles forward pagination with cursor", async () => {
			// First page
			const firstResult = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 1,
				},
			});

			if (!firstResult.data?.organization?.members?.edges?.[0]) {
				throw new Error("Failed to get first page of results");
			}
			const cursor = firstResult.data.organization.members.edges[0].cursor;

			// Next page
			const nextResult = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 1,
					after: cursor,
				},
			});

			expect(nextResult.errors).toBeUndefined();
			expect(nextResult.data?.organization?.members?.edges).toBeDefined();
			expect(
				nextResult.data?.organization?.members?.edges?.[0]?.cursor,
			).not.toBe(cursor);
		});

		test("returns last page of results with default pagination", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					last: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.members?.edges).toBeDefined();
			expect(result.data?.organization?.members?.pageInfo).toBeDefined();
			expect(Array.isArray(result.data?.organization?.members?.edges)).toBe(
				true,
			);
			expect(
				result.data?.organization?.members?.edges?.length,
			).toBeLessThanOrEqual(10);
			expect(result.data?.organization?.members?.pageInfo).toEqual(
				expect.objectContaining({
					hasNextPage: expect.any(Boolean),
					hasPreviousPage: expect.any(Boolean),
				}),
			);
		});

		test("handles backwards pagination with cursor", async () => {
			// First page
			const firstResult = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					last: 1,
				},
			});

			if (!firstResult.data?.organization?.members?.edges?.[0]) {
				throw new Error("Failed to get first page of results");
			}
			const cursor = firstResult.data.organization.members.edges[0].cursor;

			// Previous page
			const nextResult = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					last: 1,
					before: cursor,
				},
			});

			expect(nextResult.errors).toBeUndefined();
			expect(nextResult.data?.organization?.members?.edges).toBeDefined();
			expect(
				nextResult.data?.organization?.members?.edges?.[0]?.cursor,
			).not.toBe(cursor);
		});
	});

	suite("Role Filtering", () => {
		test("filters members by administrator role", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
					where: {
						role: {
							equal: organizationMembershipRoleEnum.Values.administrator,
						},
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.members?.edges).toBeDefined();
			expect(result.data?.organization?.members?.edges?.length).toBeGreaterThan(
				0,
			);
			for (const edge of result.data?.organization?.members?.edges || []) {
				expect(edge?.node?.role).toBe("administrator");
			}
		});

		test("filters members by non-administrator role", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
					where: {
						role: {
							notEqual: organizationMembershipRoleEnum.Values.administrator,
						},
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.members?.edges).toBeDefined();
			expect(result.data?.organization?.members?.edges?.length).toBeGreaterThan(
				0,
			);
			for (const edge of result.data?.organization?.members?.edges || []) {
				expect(edge?.node?.role).not.toBe("administrator");
			}
		});
	});

	suite("Input Validation", () => {
		test("validates pagination arguments", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: -1,
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("returns error for invalid cursor", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
					after: "invalid-cursor",
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("returns error for invalid cursor using last", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					last: 5,
					before: "invalid-cursor",
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("returns error for cursor of non-existing user", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					first: 5,
					after:
						"eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTIxVDE1OjEzOjA3Ljk5MVoiLCJtZW1iZXJJZCI6IjAxOTUyOTExLTgyZGEtNzkzZi1hNWJmLTk4MzgxZDlhZWZjOCJ9",
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});

		test("returns error for cursor of non-existing user using last", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: organizationId },
					last: 5,
					before:
						"eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTIxVDE1OjEzOjA3Ljk5MVoiLCJtZW1iZXJJZCI6IjAxOTUyOTExLTgyZGEtNzkzZi1hNWJmLTk4MzgxZDlhZWZjOCJ9",
				},
			});

			expect(result.data?.organization?.members).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});
});

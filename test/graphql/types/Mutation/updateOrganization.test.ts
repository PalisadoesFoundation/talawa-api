import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, expect, suite, test } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateOrganization,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field updateOrganization", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		let firstError: unknown;
		while (testCleanupFunctions.length > 0) {
			const cleanup = testCleanupFunctions.pop();
			if (!cleanup) {
				continue;
			}

			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
				firstError ??= error;
			}
		}

		if (firstError !== undefined) {
			throw firstError;
		}
	});

	test("should return an error with unauthenticated extensions code when no auth token provided", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Updated Organization Name",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error with unauthorized_action extensions code", async () => {
		const { authToken: regularAuthToken, userId: regularUserId } =
			await createRegularUserUsingAdmin();
		assertToBeNonNullish(regularAuthToken);
		assertToBeNonNullish(regularUserId);

		// Add cleanup for the regular user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: regularUserId } },
			});
		});

		// Create an organization as admin first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Regular User",
						description: "Organization for unauthorized update test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Test St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Try to update as regular user
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${regularAuthToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated by Regular User",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error with unauthenticated extensions code when user is deleted", async () => {
		const { authToken: userToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(userToken);

		// Delete the user
		await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
			headers: { authorization: `bearer ${userToken}` },
		});

		// Create an organization as admin first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Deleted User",
						description: "Organization for deleted user test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Main St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Try to update with deleted user's token
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated by Deleted User",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error when no update fields are provided", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Empty Update",
						description: "Organization for empty update test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Empty St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should update basic organization fields", async () => {
		// Create an organization first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Original Organization Name",
						description: "Original description",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Original St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Update the organization
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated Organization Name",
					description: "Updated description",
					addressLine1: "456 Updated Ave",
					city: "Los Angeles",
					state: "CA",
					postalCode: "90210",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				name: "Updated Organization Name",
				description: "Updated description",
				addressLine1: "456 Updated Ave",
				city: "Los Angeles",
				state: "CA",
				postalCode: "90210",
				countryCode: "us",
			}),
		);
	});

	test("should update isUserRegistrationRequired field", async () => {
		// Create an organization first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Registration Test Org",
						description: "Organization for registration test",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "123 Registration St",
						addressLine2: "Suite 200",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Update isUserRegistrationRequired to true
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					isUserRegistrationRequired: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: true,
			}),
		);
	});
	test("should toggle isUserRegistrationRequired from true to false", async () => {
		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Toggle Test Org",
						description: "Organization for toggle test",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "123 Toggle St",
						addressLine2: "Suite 300",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Set to true
		const setTrueResult = await mercuriusClient.mutate(
			Mutation_updateOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId, isUserRegistrationRequired: true },
				},
			},
		);
		expect(setTrueResult.errors).toBeUndefined();
		expect(setTrueResult.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: true,
			}),
		);
		// Toggle back to false
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: { id: orgId, isUserRegistrationRequired: false },
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: false,
			}),
		);
	});
	test("should return an error when organization does not exist", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(), // non-existent ID
					name: "Updated Name",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: expect.stringMatching(/not_found|invalid_arguments/),
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});
	test("should return an error when organization name already exists", async () => {
		// Create first organization
		const createOrg1Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Duplicate Org 1",
						description: "First organization for duplicate test",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "123 Dup St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const org1Id = createOrg1Result.data?.createOrganization?.id;
		assertToBeNonNullish(org1Id);

		// Add cleanup for the first organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org1Id } },
			});
		});

		// Create second organization
		const createOrg2Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Duplicate Org 2",
						description: "Second organization for duplicate test",
						countryCode: "us",
						state: "CA",
						city: "Los Angeles",
						postalCode: "90001",
						addressLine1: "456 Dup Ave",
						addressLine2: "Suite 200",
					},
				},
			},
		);
		const org2Id = createOrg2Result.data?.createOrganization?.id;
		assertToBeNonNullish(org2Id);

		// Add cleanup for the second organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org2Id } },
			});
		});

		// Try to update second organization with first organization's name
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: org2Id,
					name: "Duplicate Org 1",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: "Organization name already exists",
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "name"],
								message: "Organization name already exists",
							},
						],
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});
	test("should allow updating organization to its own current name", async () => {
		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Self Update Org",
						description: "Test self update",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Test St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Update with same name - should succeed
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Self Update Org",
					description: "Updated description",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization?.name).toBe("Self Update Org");
		expect(result.data?.updateOrganization?.description).toBe(
			"Updated description",
		);
	});

	test("should handle case sensitivity for duplicate names (case-sensitive by default)", async () => {
		// Create "Case Org"
		const createOrg1Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Case Org",
						countryCode: "us",
					},
				},
			},
		);
		const org1Id = createOrg1Result.data?.createOrganization?.id;
		assertToBeNonNullish(org1Id);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org1Id } },
			});
		});

		// Create another org
		const createOrg2Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Other Org",
						countryCode: "us",
					},
				},
			},
		);
		const org2Id = createOrg2Result.data?.createOrganization?.id;
		assertToBeNonNullish(org2Id);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org2Id } },
			});
		});

		// Try to update second org to "case org" (lowercase) - should succeed if case-sensitive
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: org2Id,
					name: "case org",
				},
			},
		});

		// If current implementation is case-sensitive, this should succeed (no error)
		// If it fails, that means it's case-insensitive
		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization?.name).toBe("case org");
	});

	test("should handle whitespace in organization names (strict check)", async () => {
		// Create "Whitespace Org"
		const createOrg1Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Whitespace Org",
						countryCode: "us",
					},
				},
			},
		);
		const org1Id = createOrg1Result.data?.createOrganization?.id;
		assertToBeNonNullish(org1Id);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org1Id } },
			});
		});

		// Create another org
		const createOrg2Result = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Other Whitespace Org",
						countryCode: "us",
					},
				},
			},
		);
		const org2Id = createOrg2Result.data?.createOrganization?.id;
		assertToBeNonNullish(org2Id);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: org2Id } },
			});
		});

		// Try to update second org to "Whitespace Org " (trailing space)
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: org2Id,
					name: "Whitespace Org ",
				},
			},
		});

		// Should succeed if whitespace is not trimmed and check is strict
		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization?.name).toBe("Whitespace Org ");
	});
	test("should remove avatar when avatar is set to null", async () => {
		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Avatar Removal Org",
						description: "Organization for avatar removal test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Avatar St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Manually set an avatar in the database
		await (server as FastifyInstance).drizzleClient
			.update(organizationsTable)
			.set({
				avatarName: "test-avatar.png",
				avatarMimeType: "image/png",
			})
			.where(eq(organizationsTable.id, orgId));

		// Call updateOrganization with avatar: null
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					avatar: null,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		// Verify returned object has null avatar
		expect(result.data?.updateOrganization?.avatarMimeType).toBeNull();

		// Verify database state
		const updatedOrg = await (
			server as FastifyInstance
		).drizzleClient.query.organizationsTable.findFirst({
			where: eq(organizationsTable.id, orgId),
			columns: {
				avatarName: true,
				avatarMimeType: true,
			},
		});

		expect(updatedOrg?.avatarName).toBeNull();
		expect(updatedOrg?.avatarMimeType).toBeNull();
	});
});

import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFund,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
} from "../documentNodes";

async function getAdminAuthToken(): Promise<string> {
	const { accessToken } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(accessToken);
	return accessToken;
}

// Helper function to create organization
async function createOrganization(adminAuthToken: string): Promise<string> {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);

	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	return createOrgResult.data.createOrganization.id;
}

// Cleanup helper
async function cleanupFundAndOrg(
	adminAuthToken: string,
	fundId: string,
	orgId: string,
): Promise<void> {
	try {
		await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: fundId } },
		});
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: orgId } },
		});
	} catch (e) {
		console.error(e);
	}
}

suite("Mutation field createFund - New Fields", () => {
	suite("isDefault field tests", () => {
		test("creates fund with isDefault: true", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: true,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
					isTaxDeductible: false,
					isDefault: true,
					isArchived: false,
					referenceNumber: null,
				}),
			);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund with isDefault: false explicitly", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund).toEqual(
				expect.objectContaining({
					isDefault: false,
				}),
			);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund without isDefault (should default to false)", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							// isDefault not provided
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isDefault).toBe(false);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});

	suite("isArchived field tests", () => {
		test("creates fund with isArchived: true", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isArchived: true,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isArchived).toBe(true);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund with isArchived: false explicitly", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isArchived: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isArchived).toBe(false);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund without isArchived (should default to false)", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							// isArchived not provided
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isArchived).toBe(false);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});

	suite("referenceNumber field tests", () => {
		test("creates fund with referenceNumber provided", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const referenceNumber = `REF-${faker.string.alphanumeric(10)}`;

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: referenceNumber,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.referenceNumber).toBe(
				referenceNumber,
			);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund without referenceNumber (should be null)", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							// referenceNumber not provided
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.referenceNumber).toBeNull();

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});

	suite("Combined fields test", () => {
		test("creates fund with all new fields combined", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const referenceNumber = `REF-${faker.string.alphanumeric(10)}`;

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: true,
							isDefault: true,
							isArchived: false,
							referenceNumber: referenceNumber,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
					isTaxDeductible: true,
					isDefault: true,
					isArchived: false,
					referenceNumber: referenceNumber,
				}),
			);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});

	suite("referenceNumber edge cases", () => {
		test("validates referenceNumber with special characters", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const referenceNumber = "REF-#$%&*()-_+=[]{}|;:',.<>?/";

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: referenceNumber,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.referenceNumber).toBe(
				referenceNumber,
			);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("validates referenceNumber with empty string", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: "",
						},
					},
				},
			);

			// Empty string either accepted or throws invalid_arguments error
			if (createFundResult.errors) {
				expect(createFundResult.errors[0]?.extensions?.code).toBe(
					"invalid_arguments",
				);
			} else {
				expect(createFundResult.data?.createFund?.referenceNumber).toBe("");
				if (createFundResult.data?.createFund?.id) {
					await cleanupFundAndOrg(
						adminAuthToken,
						createFundResult.data.createFund.id,
						orgId,
					);
				}
			}

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});

		test("validates referenceNumber with very long string", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const longReferenceNumber = "a".repeat(300);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: longReferenceNumber,
						},
					},
				},
			);

			// Long string either accepted or throws invalid_arguments error
			if (createFundResult.errors) {
				expect(createFundResult.errors[0]?.extensions?.code).toBe(
					"invalid_arguments",
				);
			} else {
				expect(createFundResult.data?.createFund?.referenceNumber).toBe(
					longReferenceNumber,
				);
				if (createFundResult.data?.createFund?.id) {
					await cleanupFundAndOrg(
						adminAuthToken,
						createFundResult.data.createFund.id,
						orgId,
					);
				}
			}

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});
	});

	suite("allows multiple funds tests", () => {
		test("allows multiple non-default funds per organization", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			// Create first fund
			const createFundResult1 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund 1 ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
						},
					},
				},
			);

			expect(createFundResult1.errors).toBeUndefined();

			// Create second fund
			const createFundResult2 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund 2 ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
						},
					},
				},
			);

			expect(createFundResult2.errors).toBeUndefined();

			// Verify both funds exist
			expect(createFundResult1.data?.createFund?.id).toBeDefined();
			expect(createFundResult2.data?.createFund?.id).toBeDefined();
			expect(createFundResult1.data?.createFund?.id).not.toBe(
				createFundResult2.data?.createFund?.id,
			);

			// Cleanup
			if (createFundResult1.data?.createFund?.id) {
				try {
					await mercuriusClient.mutate(Mutation_deleteFund, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: createFundResult1.data.createFund.id } },
					});
				} catch (e) {
					console.error(e);
				}
			}
			if (createFundResult2.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult2.data.createFund.id,
					orgId,
				);
			}
		});
	});
});

suite("Mutation field createFund - Error Handling", () => {
	suite("Authentication errors", () => {
		test("returns unauthenticated error when no auth token provided", async () => {
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					// No authorization header
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: faker.string.uuid(),
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"unauthenticated",
			);
		});

		test("returns unauthenticated error with invalid auth token", async () => {
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: "bearer invalid_token_here" },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: faker.string.uuid(),
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"unauthenticated",
			);
		});

		test("returns unauthenticated error when user is deleted but still has valid token", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			// Create a regular user
			const regularUserEmail = `email${faker.string.ulid()}@email.com`;

			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							isEmailAddressVerified: true,
							name: "User To Be Deleted",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data?.createUser?.authenticationToken,
			);
			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			const deletedUserToken =
				createUserResult.data.createUser.authenticationToken;
			const deletedUserId = createUserResult.data.createUser.user.id;

			// Delete the user using admin credentials
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: deletedUserId },
				},
			});

			// Try to create fund with the deleted user's token
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${deletedUserToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			// The user's JWT is still technically valid, but the user doesn't exist anymore
			// This should trigger the currentUser === undefined branch
			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"unauthenticated",
			);

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});
	});

	suite("Input validation errors", () => {
		test("returns invalid_arguments error when name exceeds maximum length", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const tooLongName = "a".repeat(257); // Max is 256

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: tooLongName,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"invalid_arguments",
			);

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});

		test("returns invalid_arguments error when name is empty", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: "",
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"invalid_arguments",
			);

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});
	});

	suite("Organization validation errors", () => {
		test("returns error when organization does not exist", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const nonExistentOrgId = faker.string.uuid();

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: nonExistentOrgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});

		test("returns error when organizationId has invalid UUID format", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const invalidOrgId = "not-a-valid-uuid";

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: invalidOrgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(
				createFundResult.errors?.some(
					(error) =>
						error.message.includes("got invalid value") ||
						error.message.includes("ID cannot represent") ||
						error.extensions?.code === "invalid_arguments" ||
						error.extensions?.code ===
							"arguments_associated_resources_not_found",
				),
			).toBe(true);
		});
	});

	suite("Duplicate fund name errors", () => {
		test("returns error when fund with same name already exists in organization", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundName = `Fund ${faker.string.uuid()}`;

			// Create first fund with the name
			const createFundResult1 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: fundName,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult1.errors).toBeUndefined();
			expect(createFundResult1.data?.createFund?.id).toBeDefined();

			// Try to create second fund with the same name
			const createFundResult2 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: fundName,
							organizationId: orgId,
							isTaxDeductible: true,
						},
					},
				},
			);

			expect(createFundResult2.errors).toBeDefined();
			expect(createFundResult2.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);

			// Cleanup
			if (createFundResult1.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult1.data.createFund.id,
					orgId,
				);
			}
		});

		test("allows same fund name in different organizations", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId1 = await createOrganization(adminAuthToken);
			const orgId2 = await createOrganization(adminAuthToken);
			const fundName = `Fund ${faker.string.uuid()}`;

			// Create fund with the name in first organization
			const createFundResult1 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: fundName,
							organizationId: orgId1,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult1.errors).toBeUndefined();
			expect(createFundResult1.data?.createFund?.id).toBeDefined();

			// Create fund with the same name in second organization (should succeed)
			const createFundResult2 = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: fundName,
							organizationId: orgId2,
							isTaxDeductible: true,
						},
					},
				},
			);

			// This should succeed - same name is allowed in different organizations
			expect(createFundResult2.errors).toBeUndefined();
			expect(createFundResult2.data?.createFund?.id).toBeDefined();
			expect(createFundResult2.data?.createFund?.name).toBe(fundName);

			// Verify both funds have the same name but different IDs
			expect(createFundResult1.data?.createFund?.id).not.toBe(
				createFundResult2.data?.createFund?.id,
			);

			// Cleanup
			if (createFundResult1.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult1.data.createFund.id,
					orgId1,
				);
			}
			if (createFundResult2.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult2.data.createFund.id,
					orgId2,
				);
			}
		});
	});

	suite("Authorization errors", () => {
		test("returns unauthorized error when regular user (not org member) tries to create fund", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			// Create a regular user
			const regularUserEmail = `email${faker.string.ulid()}@email.com`;
			const regularUserPassword = "password123";

			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							isEmailAddressVerified: true,
							name: "Regular User",
							password: regularUserPassword,
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data?.createUser?.authenticationToken,
			);
			const regularUserToken =
				createUserResult.data.createUser.authenticationToken;

			// Regular user tries to create fund without being an org member
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});

		test("returns unauthorized error when org member with regular role tries to create fund", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			// Create a regular user
			const regularUserEmail = `email${faker.string.ulid()}@email.com`;
			const regularUserPassword = "password123";

			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							isEmailAddressVerified: true,
							name: "Regular Org Member",
							password: regularUserPassword,
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data?.createUser?.authenticationToken,
			);
			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			const regularUserToken =
				createUserResult.data.createUser.authenticationToken;
			const regularUserId = createUserResult.data.createUser.user.id;

			// Add user as regular member to org (not admin)
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						memberId: regularUserId,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			// Regular org member (not admin) tries to create fund
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeDefined();
			expect(createFundResult.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);

			// Cleanup org
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (e) {
				console.error(e);
			}
		});
	});

	suite("Authorization success cases", () => {
		test("allows org admin (non-system admin) to create fund successfully", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			// Create a regular user
			const regularUserEmail = `email${faker.string.ulid()}@email.com`;
			const regularUserPassword = "password123";

			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							isEmailAddressVerified: true,
							name: "Org Admin User",
							password: regularUserPassword,
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data?.createUser?.authenticationToken,
			);
			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			const orgAdminToken =
				createUserResult.data.createUser.authenticationToken;
			const orgAdminId = createUserResult.data.createUser.user.id;

			// Add user as admin member to org
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						memberId: orgAdminId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Org admin (not system admin) creates fund
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: true,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.id).toBeDefined();
			expect(createFundResult.data?.createFund?.isTaxDeductible).toBe(true);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});

	suite("isTaxDeductible field validation", () => {
		test("creates fund with isTaxDeductible: true", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: true,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isTaxDeductible).toBe(true);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});

		test("creates fund with isTaxDeductible: false", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			expect(createFundResult.errors).toBeUndefined();
			expect(createFundResult.data?.createFund?.isTaxDeductible).toBe(false);

			// Cleanup
			if (createFundResult.data?.createFund?.id) {
				await cleanupFundAndOrg(
					adminAuthToken,
					createFundResult.data.createFund.id,
					orgId,
				);
			}
		});
	});
});

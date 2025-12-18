import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_deleteFund,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

// Helper function to get admin auth token
async function getAdminAuthToken(): Promise<string> {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
	return adminSignInResult.data.signIn.authenticationToken;
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
	} catch {
		// Cleanup errors are acceptable in tests
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
			} catch {
				/* ignore */
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
			} catch {
				/* ignore */
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
				} catch {
					// Ignore
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

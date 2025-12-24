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
	Mutation_updateFund,
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

// Helper function to create a fund
interface CreateFundOptions {
	isDefault?: boolean;
	isArchived?: boolean;
	referenceNumber?: string | null;
}

async function createFund(
	adminAuthToken: string,
	orgId: string,
	options: CreateFundOptions = {},
): Promise<string> {
	const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Fund ${faker.string.uuid()}`,
				organizationId: orgId,
				isTaxDeductible: false,
				isDefault: options.isDefault,
				isArchived: options.isArchived,
				referenceNumber: options.referenceNumber,
			},
		},
	});

	assertToBeNonNullish(createFundResult.data?.createFund?.id);
	return createFundResult.data.createFund.id;
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

suite("Mutation field updateFund - New Fields", () => {
	suite("isDefault field updates", () => {
		test("updates isDefault from false to true", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isDefault: false,
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isDefault: true,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.isDefault).toBe(true);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});

		test("updates isDefault from true to false", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isDefault: true,
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isDefault: false,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.isDefault).toBe(false);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});
	});

	suite("isArchived field updates", () => {
		test("updates isArchived to archive fund", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isArchived: false,
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isArchived: true,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.isArchived).toBe(true);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});

		test("updates isArchived to unarchive fund", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isArchived: true,
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isArchived: false,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.isArchived).toBe(false);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});
	});

	suite("referenceNumber field updates", () => {
		test("updates referenceNumber", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				referenceNumber: "OLD-REF-123",
			});
			const newReferenceNumber = `NEW-REF-${faker.string.alphanumeric(10)}`;

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							referenceNumber: newReferenceNumber,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.referenceNumber).toBe(
				newReferenceNumber,
			);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});

		test("sets referenceNumber to null", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				referenceNumber: "INITIAL-REF-123",
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							referenceNumber: null,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund?.referenceNumber).toBeNull();

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});
	});

	suite("Combined updates", () => {
		test("updates multiple new fields together", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isDefault: false,
				isArchived: false,
				referenceNumber: "OLD-REF",
			});
			const newReferenceNumber = `UPDATED-${faker.string.alphanumeric(8)}`;

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isDefault: true,
							isArchived: true,
							referenceNumber: newReferenceNumber,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isDefault: true,
					isArchived: true,
					referenceNumber: newReferenceNumber,
				}),
			);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});

		test("preserves other fields when updating new fields", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const initialReferenceNumber = "PRESERVED-REF";
			const fundId = await createFund(adminAuthToken, orgId, {
				isDefault: true,
				isArchived: false,
				referenceNumber: initialReferenceNumber,
			});

			// Only update isArchived
			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isArchived: true,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isDefault: true, // Should be preserved
					isArchived: true, // Updated
					referenceNumber: initialReferenceNumber, // Should be preserved
				}),
			);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});
	});

	suite("Update with existing fields", () => {
		test("updates name alongside new fields", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isDefault: false,
			});
			const newName = `Updated Fund ${faker.string.uuid()}`;

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							name: newName,
							isDefault: true,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					name: newName,
					isDefault: true,
				}),
			);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});

		test("updates isTaxDeductible alongside new fields", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const orgId = await createOrganization(adminAuthToken);
			const fundId = await createFund(adminAuthToken, orgId, {
				isArchived: false,
			});

			const updateFundResult = await mercuriusClient.mutate(
				Mutation_updateFund,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: fundId,
							isTaxDeductible: true,
							isArchived: true,
						},
					},
				},
			);

			expect(updateFundResult.errors).toBeUndefined();
			expect(updateFundResult.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isTaxDeductible: true,
					isArchived: true,
				}),
			);

			// Cleanup
			await cleanupFundAndOrg(adminAuthToken, fundId, orgId);
		});
	});
});

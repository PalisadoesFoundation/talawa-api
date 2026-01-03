import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFund,
	Mutation_deleteFundCampaign,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Helper function to get admin auth token
async function getAdminToken() {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	const authToken = signInResult.data?.signIn?.authenticationToken;
	assertToBeNonNullish(authToken);
	return authToken;
}

// Helper function to create a test user
async function createTestUser(
	adminAuthToken: string,
	role: "regular" | "administrator" = "regular",
) {
	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: "password123",
				role: role,
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(userResult.data?.createUser);
	return {
		userId: userResult.data.createUser.user?.id as string,
		authToken: userResult.data.createUser.authenticationToken as string,
	};
}

// Helper function to create a test organization
async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Organization ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id;
}

// Helper function to create organization membership
async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					memberId,
					organizationId,
					role,
				},
			},
		},
	);

	assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);
	return membershipResult.data.createOrganizationMembership.id;
}

// Helper function to create a test fund
async function createTestFund(authToken: string, organizationId: string) {
	const fundResult = await mercuriusClient.mutate(Mutation_createFund, {
		headers: {
			authorization: `bearer ${authToken}`,
		},
		variables: {
			input: {
				organizationId,
				name: `Test Fund ${faker.string.uuid()}`,
				isTaxDeductible: true,
			},
		},
	});

	assertToBeNonNullish(fundResult.data?.createFund);
	return fundResult.data.createFund.id;
}

suite("Mutation field createFundCampaign", () => {
	// Lines 170-182 of src/graphql/types/Mutation/createFundCampaign.ts
	// contain a defensive branch handling unexpected empty DB insert results.
	// This branch cannot be reliably tested without DB layer mocking
	let adminAuthToken: string;
	let orgAdminUserAuthToken: string;
	let orgAdminUserId: string;
	let adminUserId: string;
	let organizationId: string;
	let fundId: string;
	const createdFundCampaignIds: string[] = [];
	const createdFundIds: string[] = [];
	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];

	beforeAll(async () => {
		adminAuthToken = await getAdminToken();

		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminSignInResult.data?.signIn?.user?.id);
		adminUserId = adminSignInResult.data.signIn.user.id;

		const orgAdminUser = await createTestUser(adminAuthToken, "regular");
		orgAdminUserId = orgAdminUser.userId;
		orgAdminUserAuthToken = orgAdminUser.authToken;
		createdUserIds.push(orgAdminUserId);

		organizationId = await createTestOrganization(adminAuthToken);
		createdOrganizationIds.push(organizationId);

		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);

		await createOrganizationMembership(
			adminAuthToken,
			orgAdminUserId,
			organizationId,
			"administrator",
		);

		fundId = await createTestFund(adminAuthToken, organizationId);
		createdFundIds.push(fundId);
	});

	afterAll(async () => {
		for (const campaignId of createdFundCampaignIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: campaignId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		for (const fundIdToDelete of createdFundIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFund, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: fundIdToDelete } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (_error) {
				// Ignore cleanup errors
			}
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createFundCampaign" field if client triggering the graphql operation is not authenticated', async () => {
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			variables: {
				input: {
					fundId: fundId,
					name: "Test Campaign",
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "unauthenticated" extensions code if currentUser query returns undefined after authentication check', async () => {
		const tempUser = await createTestUser(adminAuthToken, "regular");
		const tempUserToken = tempUser.authToken;
		const tempUserId = tempUser.userId;
		createdUserIds.push(tempUserId);

		await createOrganizationMembership(
			adminAuthToken,
			tempUserId,
			organizationId,
			"administrator",
		);

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: tempUserId } },
		});

		const index = createdUserIds.indexOf(tempUserId);
		if (index > -1) {
			createdUserIds.splice(index, 1);
		}

		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${tempUserToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: `Deleted User Campaign ${faker.string.uuid()}`,
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createFundCampaign" field if provided fund id is not a valid uuid', async () => {
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: "invalid-uuid",
					name: "Test Campaign",
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "fundId"],
								message: "Invalid uuid",
							},
						],
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code when campaign name is empty', async () => {
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: "",
					currencyCode: "USD",
					goalAmount: 10000,
					startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "name"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code when endAt is before startAt', async () => {
		const startDate = new Date("2025-06-01");
		const endDate = new Date("2025-05-01");

		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: `Test Campaign ${faker.string.uuid()}`,
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: startDate.toISOString(),
					endAt: endDate.toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "endAt"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code when endAt equals startAt', async () => {
		const sameDate = new Date("2025-06-01");

		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: `Test Campaign ${faker.string.uuid()}`,
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: sameDate.toISOString(),
					endAt: sameDate.toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "endAt"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.createFundCampaign" field if no fund exists with the provided id', async () => {
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: faker.string.uuid(),
					name: "Test Campaign",
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "fundId"],
							},
						],
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createFundCampaign" field if campaign name already exists in the fund', async () => {
		const campaignName = `Duplicate Campaign ${faker.string.uuid()}`;

		const firstResult = await mercuriusClient.mutate(
			Mutation_createFundCampaign,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						fundId: fundId,
						name: campaignName,
						currencyCode: "USD",
						goalAmount: 1000,
						startAt: new Date("2025-01-01").toISOString(),
						endAt: new Date("2025-12-31").toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(firstResult.data?.createFundCampaign?.id);
		createdFundCampaignIds.push(firstResult.data.createFundCampaign.id);

		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: campaignName,
					currencyCode: "USD",
					goalAmount: 2000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "name"],
								message: "This name is not available.",
							},
						],
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test('results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createFundCampaign" field if user is not a member of the organization', async () => {
		const nonMemberUser = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(nonMemberUser.userId);

		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${nonMemberUser.authToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: `Unauthorized Campaign ${faker.string.uuid()}`,
					currencyCode: "USD",
					goalAmount: 1000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.data?.createFundCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					}),
					message: expect.any(String),
					path: ["createFundCampaign"],
				}),
			]),
		);
	});

	test("global administrator can successfully create a fund campaign", async () => {
		const campaignName = `Admin Campaign ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: campaignName,
					currencyCode: "USD",
					goalAmount: 5000,
					startAt: new Date("2025-01-01").toISOString(),
					endAt: new Date("2025-12-31").toISOString(),
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createFundCampaign).not.toBeNull();
		expect(result.data?.createFundCampaign?.name).toBe(campaignName);
		expect(result.data?.createFundCampaign?.goalAmount).toBe(5000);
		expect(result.data?.createFundCampaign?.id).toBeDefined();

		assertToBeNonNullish(result.data?.createFundCampaign?.id);
		createdFundCampaignIds.push(result.data.createFundCampaign.id);
	});

	test("organization administrator can successfully create a fund campaign", async () => {
		const campaignName = `Org Admin Campaign ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: {
				authorization: `bearer ${orgAdminUserAuthToken}`,
			},
			variables: {
				input: {
					fundId: fundId,
					name: campaignName,
					currencyCode: "EUR",
					goalAmount: 10000,
					startAt: new Date("2025-02-01").toISOString(),
					endAt: new Date("2025-11-30").toISOString(),
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createFundCampaign).not.toBeNull();
		expect(result.data?.createFundCampaign?.name).toBe(campaignName);
		expect(result.data?.createFundCampaign?.goalAmount).toBe(10000);
		expect(result.data?.createFundCampaign?.id).toBeDefined();

		assertToBeNonNullish(result.data?.createFundCampaign?.id);
		createdFundCampaignIds.push(result.data.createFundCampaign.id);
	});
});

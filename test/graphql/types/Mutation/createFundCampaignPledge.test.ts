import { faker } from "@faker-js/faker";
import {
	afterAll,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFund,
	Mutation_deleteFundCampaign,
	Mutation_deleteFundCampaignPledge,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_currentUser,
} from "../documentNodes";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;

async function getAdminToken() {
	const { accessToken } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(accessToken);
	return accessToken;
}

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
	assertToBeNonNullish(userResult.data.createUser.user?.id);
	assertToBeNonNullish(userResult.data.createUser.authenticationToken);

	return {
		userId: userResult.data.createUser.user.id,
		authToken: userResult.data.createUser.authenticationToken,
	};
}

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

async function createFund(authToken: string, organizationId: string) {
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

async function createFundCampaign(
	authToken: string,
	fundId: string,
	startDate: Date,
	endDate: Date,
) {
	const campaignResult = await mercuriusClient.mutate(
		Mutation_createFundCampaign,
		{
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					fundId,
					name: `Test Campaign ${faker.string.uuid()}`,
					startAt: startDate.toISOString(),
					endAt: endDate.toISOString(),
					goalAmount: 10000,
					currencyCode: "USD",
				},
			},
		},
	);

	assertToBeNonNullish(campaignResult.data?.createFundCampaign);
	return campaignResult.data.createFundCampaign.id;
}

suite("Mutation field createFundCampaignPledge", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let pledgerUserId: string;
	let organizationId: string;
	let fundId: string;
	let activeCampaignId: string;
	const createdPledgeIds: string[] = [];
	const createdCampaignIds: string[] = [];
	const createdFundIds: string[] = [];
	const createdUserIds: string[] = [];
	const createdOrganizationIds: string[] = [];

	beforeEach(async () => {
		const keys = await server.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await server.redis.del(...keys);
		}
	});

	beforeAll(async () => {
		adminAuthToken = await getAdminToken();
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
		});
		adminUserId = currentUserResult.data?.currentUser?.id ?? "";
		assertToBeNonNullish(adminUserId);

		organizationId = await createTestOrganization(adminAuthToken);
		createdOrganizationIds.push(organizationId);

		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);

		const pledgerUser = await createTestUser(adminAuthToken, "regular");
		pledgerUserId = pledgerUser.userId;
		createdUserIds.push(pledgerUserId);

		await createOrganizationMembership(
			adminAuthToken,
			pledgerUserId,
			organizationId,
			"regular",
		);

		fundId = await createFund(adminAuthToken, organizationId);
		createdFundIds.push(fundId);

		const startDate = new Date(Date.now() - ONE_DAY_MS);
		const endDate = new Date(Date.now() + ONE_DAY_MS);

		activeCampaignId = await createFundCampaign(
			adminAuthToken,
			fundId,
			startDate,
			endDate,
		);
		createdCampaignIds.push(activeCampaignId);
	});

	afterAll(async () => {
		for (const pledgeId of createdPledgeIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFundCampaignPledge, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: pledgeId } },
				});
			} catch (_error) {
				console.error(_error);
			}
		}

		for (const campaignId of createdCampaignIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: campaignId } },
				});
			} catch (_error) {
				console.error(_error);
			}
		}

		for (const fundIdToDelete of createdFundIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFund, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: fundIdToDelete } },
				});
			} catch (_error) {
				console.error(_error);
			}
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (_error) {
				console.error(_error);
			}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (_error) {
				console.error(_error);
			}
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createFundCampaignPledge" field if client triggering the graphql operation is not authenticated', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				variables: {
					input: {
						amount: 100,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createFundCampaignPledge" field if provided campaign id is not a valid uuid', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: "invalid-uuid",
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createFundCampaignPledge" field if provided pledger id is not a valid uuid', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: activeCampaignId,
						pledgerId: "invalid-uuid",
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "pledgerId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code if amount is negative', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: -100,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code if amount is zero', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 0,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code if no campaign exists with the provided id', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: faker.string.uuid(),
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code if no pledger exists with the provided id', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: activeCampaignId,
						pledgerId: faker.string.uuid(),
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "pledgerId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test("results in a graphql error when both campaign and pledger do not exist", async () => {
		const nonExistentCampaignId = faker.string.uuid();
		const nonExistentPledgerId = faker.string.uuid();

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: nonExistentCampaignId,
						pledgerId: nonExistentPledgerId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
							}),
							expect.objectContaining({
								argumentPath: ["input", "pledgerId"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code if user has already pledged to the campaign', async () => {
		const firstPledgeResult = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
						note: "First pledge",
					},
				},
			},
		);

		assertToBeNonNullish(firstPledgeResult.data?.createFundCampaignPledge?.id);
		createdPledgeIds.push(firstPledgeResult.data.createFundCampaignPledge.id);

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 200,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
						note: "Duplicate pledge attempt",
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
								message: expect.stringContaining("already been pledged"),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code if campaign has ended', async () => {
		const endedStartDate = new Date(Date.now() - TWO_DAYS_MS);
		const endedEndDate = new Date(Date.now() - ONE_DAY_MS);
		const endedCampaignId = await createFundCampaign(
			adminAuthToken,
			fundId,
			endedStartDate,
			endedEndDate,
		);
		createdCampaignIds.push(endedCampaignId);

		const anotherPledger = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(anotherPledger.userId);
		await createOrganizationMembership(
			adminAuthToken,
			anotherPledger.userId,
			organizationId,
			"regular",
		);

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: endedCampaignId,
						pledgerId: anotherPledger.userId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
								message: expect.stringContaining("has ended"),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code if campaign has not started yet', async () => {
		const futureStartDate = new Date(Date.now() + ONE_DAY_MS);
		const futureEndDate = new Date(Date.now() + TWO_DAYS_MS);
		const futureCampaignId = await createFundCampaign(
			adminAuthToken,
			fundId,
			futureStartDate,
			futureEndDate,
		);
		createdCampaignIds.push(futureCampaignId);

		const anotherPledger = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(anotherPledger.userId);
		await createOrganizationMembership(
			adminAuthToken,
			anotherPledger.userId,
			organizationId,
			"regular",
		);

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: futureCampaignId,
						pledgerId: anotherPledger.userId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "campaignId"],
								message: expect.stringContaining("has not started yet"),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test("admin can successfully create a fund campaign pledge with all fields", async () => {
		const newPledger = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(newPledger.userId);
		await createOrganizationMembership(
			adminAuthToken,
			newPledger.userId,
			organizationId,
			"regular",
		);

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 500,
						campaignId: activeCampaignId,
						pledgerId: newPledger.userId,
						note: "Test pledge from admin with detailed note",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.createFundCampaignPledge).not.toBeNull();
		expect(result.data?.createFundCampaignPledge?.amount).toBe(500);
		expect(result.data?.createFundCampaignPledge?.note).toBe(
			"Test pledge from admin with detailed note",
		);
		expect(result.data?.createFundCampaignPledge?.id).toBeDefined();

		if (result.data?.createFundCampaignPledge?.id) {
			createdPledgeIds.push(result.data.createFundCampaignPledge.id);
		}
	});

	test("can create a pledge with minimal required fields without note", async () => {
		const minimalPledger = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(minimalPledger.userId);
		await createOrganizationMembership(
			adminAuthToken,
			minimalPledger.userId,
			organizationId,
			"regular",
		);

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 250,
						campaignId: activeCampaignId,
						pledgerId: minimalPledger.userId,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.createFundCampaignPledge).not.toBeNull();
		expect(result.data?.createFundCampaignPledge?.amount).toBe(250);
		expect(result.data?.createFundCampaignPledge?.id).toBeDefined();

		if (result.data?.createFundCampaignPledge?.id) {
			createdPledgeIds.push(result.data.createFundCampaignPledge.id);
		}
	});

	test("creates multiple pledges for same campaign by different users", async () => {
		const pledger1 = await createTestUser(adminAuthToken, "regular");
		const pledger2 = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(pledger1.userId, pledger2.userId);

		await createOrganizationMembership(
			adminAuthToken,
			pledger1.userId,
			organizationId,
			"regular",
		);
		await createOrganizationMembership(
			adminAuthToken,
			pledger2.userId,
			organizationId,
			"regular",
		);

		const result1 = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 300,
						campaignId: activeCampaignId,
						pledgerId: pledger1.userId,
					},
				},
			},
		);

		expect(result1.errors).toBeUndefined();
		expect(result1.data?.createFundCampaignPledge?.amount).toBe(300);

		if (result1.data?.createFundCampaignPledge?.id) {
			createdPledgeIds.push(result1.data.createFundCampaignPledge.id);
		}

		// Small delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 500));

		const result2 = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: 400,
						campaignId: activeCampaignId,
						pledgerId: pledger2.userId,
					},
				},
			},
		);

		expect(result2.errors).toBeUndefined();
		expect(result2.data?.createFundCampaignPledge?.amount).toBe(400);

		if (result2.data?.createFundCampaignPledge?.id) {
			createdPledgeIds.push(result2.data.createFundCampaignPledge.id);
		}
	});

	test('results in a graphql error with "unauthenticated" extensions code if currentUser query returns undefined after authentication check', async () => {
		const tempUser = await createTestUser(adminAuthToken, "regular");
		const tempUserToken = tempUser.authToken;
		createdUserIds.push(tempUser.userId);

		await createOrganizationMembership(
			adminAuthToken,
			tempUser.userId,
			organizationId,
			"regular",
		);

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: tempUser.userId } },
		});

		createdUserIds.pop();

		const result = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${tempUserToken}`,
				},
				variables: {
					input: {
						amount: 100,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);

		expect(result.data?.createFundCampaignPledge).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createFundCampaignPledge"],
				}),
			]),
		);
	});

	test("validates amount field accepts various valid positive numbers", async () => {
		const amounts = [1, 5000];

		for (const amount of amounts) {
			const testPledger = await createTestUser(adminAuthToken, "regular");
			createdUserIds.push(testPledger.userId);
			await createOrganizationMembership(
				adminAuthToken,
				testPledger.userId,
				organizationId,
				"regular",
			);

			const result = await mercuriusClient.mutate(
				Mutation_createFundCampaignPledge,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							amount: amount,
							campaignId: activeCampaignId,
							pledgerId: testPledger.userId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createFundCampaignPledge?.amount).toBe(amount);

			if (result.data?.createFundCampaignPledge?.id) {
				createdPledgeIds.push(result.data.createFundCampaignPledge.id);
			}

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	});

	test('results in a graphql error with "unexpected" extensions code when database insert operation fails', async () => {
		const testPledger = await createTestUser(adminAuthToken, "regular");
		createdUserIds.push(testPledger.userId);
		await createOrganizationMembership(
			adminAuthToken,
			testPledger.userId,
			organizationId,
			"regular",
		);

		const transactionSpy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementation(async (callback) => {
				const mockTx = {
					insert: () => ({
						values: () => ({
							returning: async () => [],
						}),
					}),
					rollback: vi.fn(),
				} as unknown as Parameters<typeof callback>[0];

				return await callback(mockTx);
			});

		try {
			const result = await mercuriusClient.mutate(
				Mutation_createFundCampaignPledge,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							amount: 100,
							campaignId: activeCampaignId,
							pledgerId: testPledger.userId,
						},
					},
				},
			);

			expect(result.data?.createFundCampaignPledge ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						message: expect.any(String),
						path: ["createFundCampaignPledge"],
					}),
				]),
			);
		} finally {
			transactionSpy.mockRestore();
		}
	});
});

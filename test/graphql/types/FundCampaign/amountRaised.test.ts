import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
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
	Mutation_updateFundCampaignPledge,
	Query_fundCampaign,
	Query_signIn,
} from "../documentNodes";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

suite("FundCampaign amountRaised logic", () => {
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
	});

	afterAll(async () => {
		for (const pledgeId of createdPledgeIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFundCampaignPledge, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: pledgeId } },
				});
			} catch (_error) {}
		}

		for (const campaignId of createdCampaignIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: campaignId } },
				});
			} catch (_error) {}
		}

		for (const fundIdToDelete of createdFundIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteFund, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: fundIdToDelete } },
				});
			} catch (_error) {}
		}

		for (const userId of createdUserIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: userId } },
				});
			} catch (_error) {}
		}

		for (const orgId of createdOrganizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (_error) {}
		}
	});

	const sleep = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));

	test("amountRaised should be 0 initially", async () => {
		const startDate = new Date(Date.now() - ONE_DAY_MS);
		const endDate = new Date(Date.now() + ONE_DAY_MS);
		activeCampaignId = await createFundCampaign(
			adminAuthToken,
			fundId,
			startDate,
			endDate,
		);
		createdCampaignIds.push(activeCampaignId);

		await sleep(2000);

		const campaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: activeCampaignId,
				},
			},
		});

		if (campaignResult.errors) {
			console.log(
				"Query_fundCampaign errors:",
				JSON.stringify(campaignResult.errors, null, 2),
			);
		}
		assertToBeNonNullish(campaignResult.data?.fundCampaign);
		expect(campaignResult.data.fundCampaign.amountRaised).toBe(0);
	});

	test("amountRaised should increment when a pledge is created", async () => {
		await sleep(500);
		const pledgeAmount = 500;
		const pledgeResult = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: pledgeAmount,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);
		assertToBeNonNullish(pledgeResult.data?.createFundCampaignPledge?.id);
		createdPledgeIds.push(pledgeResult.data.createFundCampaignPledge.id);

		await sleep(2000);

		const campaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: activeCampaignId,
				},
			},
		});

		assertToBeNonNullish(campaignResult.data?.fundCampaign);
		expect(campaignResult.data.fundCampaign.amountRaised).toBe(pledgeAmount);
	});

	test("amountRaised should update when a pledge is updated", async () => {
		await sleep(2000);

		const pledgeId = createdPledgeIds[createdPledgeIds.length - 1];
		const newAmount = 1000;

		await sleep(2000);

		await mercuriusClient.mutate(Mutation_updateFundCampaignPledge, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: pledgeId || "",
					amount: newAmount,
				},
			},
		});

		await sleep(2000);

		const campaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: activeCampaignId,
				},
			},
		});

		assertToBeNonNullish(campaignResult.data?.fundCampaign);
		// Previous amount was 500, updated to 1000. Increase should be 500.
		// Wait, existing amountRaised was 500.
		// New pledge amount is 1000.
		// Diff is 1000 - 500 = 500.
		// New amountRaised = 500 + 500 = 1000.
		expect(campaignResult.data.fundCampaign.amountRaised).toBe(1000);
	});

	test("amountRaised should decrement when a pledge is deleted", async () => {
		await sleep(2000);
		const pledgeId = createdPledgeIds.pop();
		assertToBeNonNullish(pledgeId);

		await mercuriusClient.mutate(Mutation_deleteFundCampaignPledge, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: pledgeId,
				},
			},
		});

		await sleep(500);

		const campaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: activeCampaignId,
				},
			},
		});

		assertToBeNonNullish(campaignResult.data?.fundCampaign);
		expect(campaignResult.data.fundCampaign.amountRaised).toBe(0);
	});

	test('deleteFundCampaignPledge results in "unexpected" error when database delete operation fails', async () => {
		await sleep(500);

		// Create a new pledge for this test
		const pledgeAmount = 300;
		const pledgeResult = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						amount: pledgeAmount,
						campaignId: activeCampaignId,
						pledgerId: pledgerUserId,
					},
				},
			},
		);
		assertToBeNonNullish(pledgeResult.data?.createFundCampaignPledge?.id);
		const pledgeId = pledgeResult.data.createFundCampaignPledge.id;
		createdPledgeIds.push(pledgeId);

		await sleep(500);

		// Mock the transaction to simulate delete returning empty array
		const transactionSpy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementation(async (callback) => {
				const mockTx = {
					delete: () => ({
						where: () => ({
							returning: async () => [],
						}),
					}),
					rollback: vi.fn(),
				} as unknown as Parameters<typeof callback>[0];

				return await callback(mockTx);
			});

		try {
			const result = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: pledgeId,
						},
					},
				},
			);

			expect(result.data?.deleteFundCampaignPledge ?? null).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						path: ["deleteFundCampaignPledge"],
					}),
				]),
			);
		} finally {
			transactionSpy.mockRestore();
		}
	});
});

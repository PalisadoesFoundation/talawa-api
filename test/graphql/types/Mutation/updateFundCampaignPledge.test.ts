import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test, vi } from "vitest";

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
	Query_fundCampaign,
	Query_signIn,
} from "../documentNodes";

/* ---------- mutation ---------- */
const UpdateFundCampaignPledgeMutation = `
  mutation UpdateFundCampaignPledge($input: MutationUpdateFundCampaignPledgeInput!) {
    updateFundCampaignPledge(input: $input) {
      id
      amount
      note
    }
  }
`;

/* ---------- sign in once (administrator) ---------- */
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
assertToBeNonNullish(signInResult.data.signIn.user);
const adminToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user.id;

/* -------------------------------------------------- */

suite("Mutation updateFundCampaignPledge", () => {
	let organizationId: string;
	let fundId: string;
	let campaignId: string;
	let pledgeId: string;

	/* ---------- base setup ---------- */
	beforeEach(async () => {
		const keys = await server.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await server.redis.del(...keys);
		}
	});

	beforeAll(async () => {
		/* organization */
		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: faker.company.name(),
					countryCode: "in",
				},
			},
		});
		assertToBeNonNullish(org.data?.createOrganization);
		organizationId = org.data.createOrganization.id;

		/* fund */
		const fund = await mercuriusClient.mutate(Mutation_createFund, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId,
					name: faker.company.name(),
					isTaxDeductible: true,
				},
			},
		});
		assertToBeNonNullish(fund.data?.createFund);
		fundId = fund.data.createFund.id;

		/* campaign */
		const campaign = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					fundId,
					name: faker.lorem.words(3),
					goalAmount: 10_000,
					currencyCode: "INR",
					startAt: new Date().toISOString(),
					endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				},
			},
		});
		assertToBeNonNullish(campaign.data?.createFundCampaign);
		campaignId = campaign.data.createFundCampaign.id;

		/* pledge */
		const pledge = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						pledgerId: adminUserId,
						campaignId,
						amount: 100,
						note: "initial",
					},
				},
			},
		);
		assertToBeNonNullish(pledge.data?.createFundCampaignPledge);
		pledgeId = pledge.data.createFundCampaignPledge.id;
	});

	//// 1. Unauthenticated
	suite("when the user is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							amount: 100,
							note: "test",
						},
					},
				},
			);

			expect(result.data?.updateFundCampaignPledge).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["updateFundCampaignPledge"],
					}),
				]),
			);
		});
	});

	//// 2. Invalid arguments
	suite("when invalid arguments are provided", () => {
		test("should return invalid_arguments error", async () => {
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: "not-a-valid-uuid",
							amount: -10,
							note: "invalid",
						},
					},
				},
			);

			expect(result.data?.updateFundCampaignPledge).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["updateFundCampaignPledge"],
					}),
				]),
			);
		});
	});

	//// 3. Pledge not found
	suite("when the fund campaign pledge does not exist", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							amount: 500,
							note: "updated",
						},
					},
				},
			);

			expect(result.data?.updateFundCampaignPledge).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updateFundCampaignPledge"],
					}),
				]),
			);
		});
	});

	//// 4. Unauthorized user
	suite("when the user is not admin, org admin, or pledger", () => {
		test("should return unauthorized_action_on_arguments_associated_resources", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(user.data?.createUser);
			const userToken = user.data.createUser.authenticationToken;

			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							id: pledgeId,
							amount: 200,
							note: "updated",
						},
					},
				},
			);

			expect(result.data?.updateFundCampaignPledge).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["updateFundCampaignPledge"],
					}),
				]),
			);
		});
	});

	//// 5. Success
	suite("when the pledger updates their own pledge", () => {
		test("should successfully update the pledge", async () => {
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: pledgeId,
							amount: 300,
							note: "updated pledge",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.updateFundCampaignPledge);
			expect(result.data.updateFundCampaignPledge.amount).toBe(300);
			expect(result.data.updateFundCampaignPledge.note).toBe("updated pledge");
		});
	});

	//// 6. Database update failure
	suite("when the database update operation fails", () => {
		test("should return unexpected error", async () => {
			const transactionSpy = vi
				.spyOn(server.drizzleClient, "transaction")
				.mockImplementation(async (callback) => {
					const mockTx = {
						update: () => ({
							set: () => ({
								where: () => ({
									returning: async () => [],
								}),
							}),
						}),
						rollback: vi.fn(),
					} as unknown as Parameters<typeof callback>[0];

					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					UpdateFundCampaignPledgeMutation,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: pledgeId,
								amount: 999,
								note: "fail",
							},
						},
					},
				);

				expect(result.data?.updateFundCampaignPledge ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateFundCampaignPledge"],
						}),
					]),
				);
			} finally {
				transactionSpy.mockRestore();
			}
		});
	});

	//// Test 7: Organization administrator updates pledge
	suite("when an organization administrator updates a pledge", () => {
		test("should successfully update the pledge", async () => {
			// Create a regular user and make them org admin (not system admin, not pledger)
			const orgAdmin = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(orgAdmin.data?.createUser);
			const orgAdminToken = orgAdmin.data.createUser.authenticationToken;
			const orgAdminUserId = orgAdmin.data.createUser.user?.id;
			assertToBeNonNullish(orgAdminToken);
			assertToBeNonNullish(orgAdminUserId);

			// Add them as org admin
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: orgAdminUserId,
						organizationId,
						role: "administrator",
					},
				},
			});

			// Org admin (who is NOT the pledger) updates the pledge
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							id: pledgeId,
							amount: 400,
							note: "updated by org admin",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.updateFundCampaignPledge);
			expect(result.data.updateFundCampaignPledge.amount).toBe(400);
			expect(result.data.updateFundCampaignPledge.note).toBe(
				"updated by org admin",
			);
		});
	});

	//// Test 8: Regular user pledger updates own pledge
	suite("when a regular user (pledger) updates their own pledge", () => {
		test("should successfully update the pledge", async () => {
			/* ---------- create regular user ---------- */
			const regularUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});

			assertToBeNonNullish(regularUser.data?.createUser);
			const regularUserToken = regularUser.data.createUser.authenticationToken;
			const regularUserId = regularUser.data.createUser.user?.id;

			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: regularUserId,
						role: "regular",
					},
				},
			});

			const pledge = await mercuriusClient.mutate(
				Mutation_createFundCampaignPledge,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							pledgerId: regularUserId,
							campaignId,
							amount: 150,
							note: "regular user pledge",
						},
					},
				},
			);

			assertToBeNonNullish(pledge.data?.createFundCampaignPledge);
			const pledgeId = pledge.data.createFundCampaignPledge.id;

			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: pledgeId,
							amount: 250,
							note: "updated by pledger",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.updateFundCampaignPledge);
			expect(result.data.updateFundCampaignPledge.amount).toBe(250);
			expect(result.data.updateFundCampaignPledge.note).toBe(
				"updated by pledger",
			);
		});
	});

	//// Test 9: Update pledge note only (without amount)
	suite("when updating only the note without amount", () => {
		test("should successfully update the note and keep the same amount", async () => {
			// First, update to a known amount
			await mercuriusClient.mutate(UpdateFundCampaignPledgeMutation, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: pledgeId,
						amount: 500,
						note: "before note-only update",
					},
				},
			});

			// Fetch amountRaised before update
			const campaignBefore = await mercuriusClient.query(Query_fundCampaign, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: campaignId } },
			});
			assertToBeNonNullish(campaignBefore.data?.fundCampaign);
			const amountRaisedBefore = campaignBefore.data.fundCampaign.amountRaised;

			// Now update only the note (no amount provided)
			const result = await mercuriusClient.mutate(
				UpdateFundCampaignPledgeMutation,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: pledgeId,
							note: "updated note only",
							// amount is intentionally omitted
						},
					},
				},
			);

			// Fetch amountRaised after update
			const campaignAfter = await mercuriusClient.query(Query_fundCampaign, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: campaignId } },
			});
			assertToBeNonNullish(campaignAfter.data?.fundCampaign);
			const amountRaisedAfter = campaignAfter.data.fundCampaign.amountRaised;

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.updateFundCampaignPledge);
			expect(result.data.updateFundCampaignPledge.amount).toBe(500); // Amount should remain unchanged
			expect(result.data.updateFundCampaignPledge.note).toBe(
				"updated note only",
			);
			expect(amountRaisedAfter).toBe(amountRaisedBefore);
		});
	});
});

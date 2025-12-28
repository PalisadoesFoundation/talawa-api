import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteFundCampaignPledge,
	Query_signIn,
} from "../documentNodes";

/* -------------------- SIGN IN AS ADMIN -------------------- */

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);
assertToBeNonNullish(signInResult.data.signIn.user);
const adminUserId = signInResult.data.signIn.user.id;
assertToBeNonNullish(adminUserId);

/* ---------------------------------------------------------- */

suite("Mutation deleteFundCampaignPledge", () => {
	/* ---------- 1. UNAUTHENTICATED ---------- */
	suite("when user is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const res = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					variables: {
						input: { id: faker.string.uuid() },
					},
				},
			);

			expect(res.data?.deleteFundCampaignPledge).toBeNull();
			assertToBeNonNullish(res.errors);
			expect(res.errors.length).toBeGreaterThan(0);

			const error = res.errors[0];
			assertToBeNonNullish(error);
			assertToBeNonNullish(error.extensions);
			expect(error.extensions?.code).toBe("unauthenticated");
		});
	});

	/* ---------- 2. INVALID ARGUMENTS ---------- */
	suite("when invalid arguments are provided", () => {
		test("should return invalid_arguments error", async () => {
			const res = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { id: "not-a-uuid" },
					},
				},
			);

			expect(res.data?.deleteFundCampaignPledge).toBeNull();
			assertToBeNonNullish(res.errors);
			const error = res.errors[0];
			assertToBeNonNullish(error);
			assertToBeNonNullish(error.extensions);
			expect(error.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});
	});

	/* ---------- 3. PLEDGE NOT FOUND ---------- */
	suite("when fund campaign pledge does not exist", () => {
		test("should return arguments_associated_resources_not_found", async () => {
			const res = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { id: faker.string.uuid() },
					},
				},
			);

			expect(res.data?.deleteFundCampaignPledge).toBeNull();
			assertToBeNonNullish(res.errors);
			const error = res.errors[0];
			assertToBeNonNullish(error);
			assertToBeNonNullish(error.extensions);
			expect(error.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});

	/* ---------- 4. UNAUTHORIZED USER ---------- */
	suite("when user is neither admin nor pledger", () => {
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
			assertToBeNonNullish(userToken);

			const pledgeId = await createPledgeAsAdmin(adminToken, adminUserId);

			const res = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: { id: pledgeId },
					},
				},
			);

			expect(res.data?.deleteFundCampaignPledge).toBeNull();
			assertToBeNonNullish(res.errors);
			const error = res.errors[0];
			assertToBeNonNullish(error);
			assertToBeNonNullish(error.extensions);
			expect(error.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});
	});

	/* ---------- 5. ADMIN SUCCESS ---------- */
	suite("when admin deletes pledge", () => {
		test("should delete successfully", async () => {
			const pledgeId = await createPledgeAsAdmin(adminToken, adminUserId);

			const res = await mercuriusClient.mutate(
				Mutation_deleteFundCampaignPledge,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { id: pledgeId },
					},
				},
			);

			expect(res.errors).toBeUndefined();
			assertToBeNonNullish(res.data?.deleteFundCampaignPledge);
			expect(res.data.deleteFundCampaignPledge.id).toBe(pledgeId);
		});
	});

	/* ---------- 6. UNEXPECTED DELETE FAILURE ---------- */
	suite("when delete returns empty result", () => {
		test("should return unexpected error", async () => {
			const pledgeId = await createPledgeAsAdmin(adminToken, adminUserId);

			type DeleteReturn = ReturnType<typeof server.drizzleClient.delete>;

			const spy = vi.spyOn(server.drizzleClient, "delete").mockReturnValueOnce({
				where: () => ({
					returning: async () => [],
				}),
			} as unknown as DeleteReturn);

			try {
				const res = await mercuriusClient.mutate(
					Mutation_deleteFundCampaignPledge,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { id: pledgeId },
						},
					},
				);

				expect(res.data?.deleteFundCampaignPledge).toBeNull();
				assertToBeNonNullish(res.errors);
				const error = res.errors[0];
				assertToBeNonNullish(error);
				assertToBeNonNullish(error.extensions);
				expect(error.extensions?.code).toBe("unexpected");
			} finally {
				spy.mockRestore();
			}
		});
	});
});

/* ---------------- HELPER ---------------- */

async function createPledgeAsAdmin(
	token: string,
	userId: string,
): Promise<string> {
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: faker.company.name(),
				countryCode: "id",
				isUserRegistrationRequired: false,
			},
		},
	});
	assertToBeNonNullish(org.data?.createOrganization);

	const fund = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: "Fund",
				organizationId: org.data.createOrganization.id,
				isTaxDeductible: false,
			},
		},
	});
	assertToBeNonNullish(fund.data?.createFund);

	const campaign = await mercuriusClient.mutate(Mutation_createFundCampaign, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: "Campaign",
				fundId: fund.data.createFund.id,
				goalAmount: 1000,
				currencyCode: "USD",
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 86400000).toISOString(),
			},
		},
	});
	assertToBeNonNullish(campaign.data?.createFundCampaign);

	const pledge = await mercuriusClient.mutate(
		Mutation_createFundCampaignPledge,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					pledgerId: userId,
					campaignId: campaign.data.createFundCampaign.id,
					amount: 100,
				},
			},
		},
	);
	assertToBeNonNullish(pledge.data?.createFundCampaignPledge);

	return pledge.data.createFundCampaignPledge.id;
}

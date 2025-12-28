import { faker } from "@faker-js/faker";
import {
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createOrganization,
	Query_signIn,
} from "../documentNodes";

/* ---------- local mutation (hardcoded) ---------- */
const UpdateFundCampaignMutation = `
  mutation UpdateFundCampaign($input: MutationUpdateFundCampaignInput!) {
    updateFundCampaign(input: $input) {
      id
      name
      goalAmount
      startAt
      endAt
    }
  }
`;

/* ---------- sign in once (admin) ---------- */
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

/* ------------------------------------------------ */

suite("Mutation updateFundCampaign", () => {
	let organizationId: string;
	let fundId: string;
	let campaignId: string;

	/* ---------- base setup ---------- */
	beforeAll(async () => {
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
	});

	/* ---------- 1. unauthenticated ---------- */
	test("unauthenticated user", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "test",
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					path: ["updateFundCampaign"],
				}),
			]),
		);
	});

	/* ---------- 2. invalid arguments ---------- */
	test("invalid arguments", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					startAt: new Date(
						Date.now() + 365 * 24 * 60 * 60 * 1000,
					).toISOString(), // 🚨 after existing endAt
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();

		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["updateFundCampaign"],
				}),
			]),
		);
	});

	/* ---------- 3. campaign not found ---------- */
	test("campaign not found", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "missing",
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					path: ["updateFundCampaign"],
				}),
			]),
		);
	});

	/* ---------- 4. invalid startAt ---------- */
	test("startAt greater than existing endAt", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					startAt: new Date(
						Date.now() + 10 * 24 * 60 * 60 * 1000,
					).toISOString(),
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["updateFundCampaign"],
				}),
			]),
		);
	});

	/* ---------- 5. duplicate name ---------- */
	test("duplicate campaign name", async () => {
		const duplicate = await mercuriusClient.mutate(
			Mutation_createFundCampaign,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						fundId,
						name: "DUPLICATE_NAME",
						goalAmount: 500,
						currencyCode: "INR",
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
					},
				},
			},
		);

		assertToBeNonNullish(duplicate.data?.createFundCampaign);

		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					name: "DUPLICATE_NAME",
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
					}),
					path: ["updateFundCampaign"],
				}),
			]),
		);
	});

	/* ---------- 6. db update failure ---------- */
	suite("database update failure", () => {
		let originalUpdate: typeof server.drizzleClient.update;

		beforeEach(() => {
			originalUpdate = server.drizzleClient.update;

			const mockReturning = vi.fn().mockResolvedValue([]);

			const mockWhere = vi.fn().mockReturnValue({
				returning: mockReturning,
			});

			const mockSet = vi.fn().mockReturnValue({
				where: mockWhere,
			});

			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: mockSet,
			});
		});

		afterEach(() => {
			server.drizzleClient.update = originalUpdate;
		});

		test("unexpected error", async () => {
			const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: campaignId,
						name: "fail",
					},
				},
			});

			expect(res.data?.updateFundCampaign).toBeNull();
			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						path: ["updateFundCampaign"],
					}),
				]),
			);
		});
	});

	/* ---------- 7. success ---------- */
	test("successful update", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					name: "Updated Campaign",
					goalAmount: 99_999,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		assertToBeNonNullish(res.data?.updateFundCampaign);
		expect(res.data.updateFundCampaign.name).toBe("Updated Campaign");
		expect(res.data.updateFundCampaign.goalAmount).toBe(99_999);
	});
});

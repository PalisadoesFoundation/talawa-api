import { faker } from "@faker-js/faker";
import type { GraphQLError } from "graphql";
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
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

/* ---------- helper ---------- */
function expectGraphQLErrorCode(
	errors: readonly GraphQLError[] | null | undefined,
	code: string,
) {
	expect(errors).toBeDefined();
	assertToBeNonNullish(errors);
	expect(errors.length).toBeGreaterThan(0);
	assertToBeNonNullish(errors[0]);
	assertToBeNonNullish(errors[0].extensions);
	expect(errors[0].extensions?.code).toBe(code);
}

/* ---------- local mutation ---------- */
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

/* ---------- admin sign-in ---------- */
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
	let fundId: string;
	let campaignId: string;
	let startAt: string;
	let endAt: string;
	let campaignName: string;

	beforeAll(async () => {
		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { name: faker.company.name(), countryCode: "in" } },
		});
		assertToBeNonNullish(org.data?.createOrganization);

		const fund = await mercuriusClient.mutate(Mutation_createFund, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: org.data.createOrganization.id,
					name: faker.company.name(),
					isTaxDeductible: true,
				},
			},
		});
		assertToBeNonNullish(fund.data?.createFund);
		fundId = fund.data.createFund.id;

		startAt = new Date().toISOString();
		endAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
		campaignName = faker.lorem.words(3);

		const campaign = await mercuriusClient.mutate(Mutation_createFundCampaign, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					fundId,
					name: campaignName,
					goalAmount: 1000,
					currencyCode: "INR",
					startAt,
					endAt,
				},
			},
		});
		assertToBeNonNullish(campaign.data?.createFundCampaign);
		campaignId = campaign.data.createFundCampaign.id;
	});

	test("unauthenticated user", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			variables: { input: { id: campaignId, name: "x" } },
		});
		expect(res.data?.updateFundCampaign).toBeNull();
		expectGraphQLErrorCode(res.errors, "unauthenticated");
	});

	test("unauthorized user cannot update campaign", async () => {
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

		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: {
				authorization: `bearer ${user.data.createUser.authenticationToken}`,
			},
			variables: { input: { id: campaignId, name: "fail" } },
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expectGraphQLErrorCode(
			res.errors,
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("campaign not found (valid UUID)", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: "00000000-0000-0000-0000-000000000000",
					name: "x",
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expectGraphQLErrorCode(
			res.errors,
			"arguments_associated_resources_not_found",
		);
	});

	test("invalid campaign ID format", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: "not-a-uuid", name: "x" } },
		});

		expect(
			res.errors?.some(
				(e) =>
					e.extensions?.code === "invalid_arguments" ||
					e.message.includes("got invalid value") ||
					e.message.includes("ID cannot represent") ||
					e.message.includes("Expected ID"),
			),
		).toBe(true);
	});

	test("startAt after existing endAt", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					startAt: new Date(
						Date.now() + 30 * 24 * 60 * 60 * 1000,
					).toISOString(),
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expectGraphQLErrorCode(res.errors, "invalid_arguments");
	});

	test("endAt before existing startAt", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					endAt: new Date(new Date(startAt).getTime() - 1000).toISOString(),
				},
			},
		});

		expect(res.data?.updateFundCampaign).toBeNull();
		expectGraphQLErrorCode(res.errors, "invalid_arguments");
	});

	test("self-name update succeeds", async () => {
		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: campaignId,
					name: campaignName,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateFundCampaign?.name).toBe(campaignName);
	});

	test("successful update of startAt and endAt", async () => {
		const newStartAt = new Date(
			Date.now() + 2 * 24 * 60 * 60 * 1000,
		).toISOString();
		const newEndAt = new Date(
			Date.now() + 9 * 24 * 60 * 60 * 1000,
		).toISOString();

		const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { id: campaignId, startAt: newStartAt, endAt: newEndAt },
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateFundCampaign?.startAt).toBe(newStartAt);
		expect(res.data?.updateFundCampaign?.endAt).toBe(newEndAt);
	});

	suite("database update failure", () => {
		let originalUpdate: typeof server.drizzleClient.update;

		beforeEach(() => {
			originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([]),
			});
		});

		afterEach(() => {
			server.drizzleClient.update = originalUpdate;
		});

		test("returns unexpected error", async () => {
			const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: campaignId, name: "updated" } },
			});

			expect(res.data?.updateFundCampaign).toBeNull();
			expectGraphQLErrorCode(res.errors, "unexpected");
		});
	});

	suite("current user not found", () => {
		let originalQuery: typeof server.drizzleClient.query.usersTable.findFirst;

		beforeEach(() => {
			originalQuery = server.drizzleClient.query.usersTable.findFirst;
			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue(undefined);
		});

		afterEach(() => {
			server.drizzleClient.query.usersTable.findFirst = originalQuery;
		});

		test("returns unauthenticated", async () => {
			const res = await mercuriusClient.mutate(UpdateFundCampaignMutation, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: campaignId, name: "x" } },
			});

			expect(res.data?.updateFundCampaign).toBeNull();
			expectGraphQLErrorCode(res.errors, "unauthenticated");
		});
	});
});

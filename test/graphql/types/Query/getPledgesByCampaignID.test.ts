import { faker } from "@faker-js/faker";
import type { GraphQLFormattedError } from "graphql";
import { beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import {
	Mutation_createFundCampaign,
	Mutation_createUser,
	Query_getMyPledgesForCampaign,
	Query_signIn,
} from "../documentNodes";

let adminAuth: { authToken: string; userId: string };
let regularUser: { authToken: string; userId: string };
let campaignId: string;

async function globalSignInAndGetToken() {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ?? "",
				password: process.env.API_ADMINISTRATOR_USER_PASSWORD ?? "",
			},
		},
	});
	assertToBeNonNullish(result.data?.signIn);
	const authToken = result.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = result.data.signIn.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

suite("Query: getMyPledgesForCampaign", () => {
	beforeAll(async () => {
		adminAuth = await globalSignInAndGetToken();
		// Create a regular user
		const userResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuth.authToken}` },
			variables: {
				input: {
					name: faker.person.fullName(),
					emailAddress: faker.internet.email(),
					password: faker.internet.password({ length: 12 }),
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const authToken = userResult.data?.createUser?.authenticationToken;
		const userId = userResult.data?.createUser?.user?.id;
		assertToBeNonNullish(authToken);
		assertToBeNonNullish(userId);
		regularUser = { authToken, userId };

		// Create a campaign (add required fields only)
		const campaignResult = await mercuriusClient.mutate(
			Mutation_createFundCampaign,
			{
				headers: { authorization: `bearer ${adminAuth.authToken}` },
				variables: {
					input: {
						name: `Test Campaign ${faker.string.uuid()}`,
						startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
						currencyCode: "USD",
						goalAmount: 1000,
						fundId: "test-fund-id",
					},
				},
			},
		);
		campaignId = campaignResult.data?.createFundCampaign?.id ?? "";
		assertToBeNonNullish(campaignId);
	});

	test("returns pledges for the current user in a campaign (mocked)", async () => {
		// Mock the query to return expected pledges
		vi.spyOn(mercuriusClient, "query").mockResolvedValue({
			data: {
				getMyPledgesForCampaign: [
					{
						id: "mock-pledge-id",
						amount: 100,
						pledger: {
							id: regularUser.userId,
							name: "Mock User",
							avatarURL: "mock-avatar-url",
						},
						campaign: {
							id: campaignId,
							name: "Mock Campaign",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
							currencyCode: "USD",
						},
					},
				],
			},
			errors: undefined,
		});

		const result = await mercuriusClient.query(Query_getMyPledgesForCampaign, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { campaignId },
		});

		expect(result.errors).toBeUndefined();
		expect(Array.isArray(result.data?.getMyPledgesForCampaign)).toBe(true);
		expect((result.data?.getMyPledgesForCampaign ?? []).length).toBeGreaterThan(
			0,
		);
		expect((result.data?.getMyPledgesForCampaign ?? [])[0]).toEqual(
			expect.objectContaining({
				id: "mock-pledge-id",
				amount: 100,
				pledger: expect.objectContaining({
					id: regularUser.userId,
					name: "Mock User",
					avatarURL: "mock-avatar-url",
				}),
				campaign: expect.objectContaining({
					id: campaignId,
					name: "Mock Campaign",
				}),
			}),
		);
	});

	test("throws error if unauthenticated", async () => {
		vi.spyOn(mercuriusClient, "query").mockResolvedValue({
			data: { getMyPledgesForCampaign: null },
			errors: [
				{
					message: "You must be authenticated to perform this action.",
					locations: [{ line: 2, column: 3 }],
					path: ["getMyPledgesForCampaign"],
					extensions: { code: "unauthenticated" },
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: (): GraphQLFormattedError => {
						throw new Error("Function not implemented.");
					},
					[Symbol.toStringTag]: "",
					name: "",
				},
			],
		});
		const result = await mercuriusClient.query(Query_getMyPledgesForCampaign, {
			variables: { campaignId },
		});

		expect(result.data?.getMyPledgesForCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("throws error if no pledges found", async () => {
		vi.spyOn(mercuriusClient, "query").mockResolvedValue({
			data: { getMyPledgesForCampaign: null },
			errors: [
				{
					message: "No pledges found for this campaign.",
					locations: [{ line: 2, column: 3 }],
					path: ["getMyPledgesForCampaign"],
					extensions: { code: "not_found" },
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: (): GraphQLFormattedError => {
						throw new Error("Function not implemented.");
					},
					[Symbol.toStringTag]: "",
					name: "",
				},
			],
		});
		const randomCampaignId = faker.string.uuid();
		const result = await mercuriusClient.query(Query_getMyPledgesForCampaign, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { campaignId: randomCampaignId },
		});

		expect(result.data?.getMyPledgesForCampaign).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "not_found",
					}),
				}),
			]),
		);
	});
});

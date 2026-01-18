import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { usersTable } from "~/src/drizzle/tables/users";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
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
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_fund,
	Query_fundCampaign,
	Query_fundCampaignPledge,
	Query_getPledgesByUserId,
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

suite("Query field fund", () => {
	suite("results in a graphql error", () => {
		test("with 'unauthenticated' extensions code if client is not authenticated", async () => {
			const fundResult = await mercuriusClient.query(Query_fund, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});

		test("with 'unauthenticated' extensions code if authenticated user doesn't exist in database", async () => {
			const regularUserResult = await createRegularUser();
			const { fundId } = await createFund();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUserResult.userId));

			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: fundId,
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});

		test("with 'arguments_associated_resources_not_found' extensions code if fund not found", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: [
										{
											argumentPath: ["input", "id"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});

		test("with 'unauthorized_action_on_arguments_associated_resources' if non-admin user is not a member of fund's organization", async () => {
			const regularUserResult = await createRegularUser();
			const { fundId } = await createFund();

			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: fundId,
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
								{
									code: "unauthorized_action_on_arguments_associated_resources",
									issues: [
										{
											argumentPath: ["input", "id"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});
	});

	test("with 'unauthenticated' extensions code if authorization token is malformed", async () => {
		const fundId = faker.string.uuid();
		// Generate a random invalid token instead of using a hard-coded value
		const invalidToken = Buffer.from(faker.string.alphanumeric(32)).toString(
			"base64",
		);

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: {
				authorization: `bearer ${invalidToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(fundResult.data.fund).toEqual(null);
		expect(fundResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["fund"],
				}),
			]),
		);
	});

	test("with 'unauthenticated' extensions code if authorization token is expired", async () => {
		const fundId = faker.string.uuid();

		// Generate an expired token with current time - 1 hour
		const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
		const payload = {
			exp: expiredTimestamp,
			iat: expiredTimestamp - 3600,
			sub: faker.string.uuid(),
		};
		const expiredToken = Buffer.from(JSON.stringify(payload)).toString(
			"base64",
		);

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: {
				authorization: `bearer ${expiredToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(fundResult.data.fund).toEqual(null);
		expect(fundResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["fund"],
				}),
			]),
		);
	});

	test("with 'arguments_associated_resources_not_found' extensions code when rate limit is exceeded", async () => {
		const fundId = faker.string.uuid();
		const adminAuthToken = await getAdminAuthToken();

		const results = await Promise.all(
			Array.from({ length: 10 }, () =>
				mercuriusClient.query(Query_fund, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: fundId,
						},
					},
				}),
			),
		);

		const lastResult = results.at(-1);
		expect(lastResult?.errors).toBeDefined();
		expect(lastResult?.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("returns fund data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();
		const { fundId, orgId } = await createFund();

		await addUserToOrg(regularUserResult.userId, orgId);

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(fundResult.errors).toBeUndefined();
		const fund = fundResult.data.fund;
		expect(fund).toBeDefined();
		expect(fund?.id).toBe(fundId);
		expect(typeof fund?.isTaxDeductible).toBe("boolean");
		expect(typeof fund?.name).toBe("string");
		expect(typeof fund?.isDefault).toBe("boolean");
		expect(typeof fund?.isArchived).toBe("boolean");
		expect(
			fund?.referenceNumber === null ||
				typeof fund?.referenceNumber === "string",
		).toBe(true);
	});

	test("returns fund data if user is an admin", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const { fundId } = await createFund();

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(fundResult.errors).toBeUndefined();
		const fund = fundResult.data.fund;
		expect(fund).toBeDefined();
		expect(fund?.id).toBe(fundId);
		expect(typeof fund?.isTaxDeductible).toBe("boolean");
		expect(typeof fund?.name).toBe("string");
		expect(typeof fund?.isDefault).toBe("boolean");
		expect(typeof fund?.isArchived).toBe("boolean");
		expect(
			fund?.referenceNumber === null ||
				typeof fund?.referenceNumber === "string",
		).toBe(true);
	});

	test("returns fund with expected fields", async () => {
		const adminAuthToken = await getAdminAuthToken();
		const { fundId } = await createFund();

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: fundId } },
		});

		expect(fundResult.errors).toBeUndefined();
		expect(fundResult.data?.fund).toMatchObject({
			id: fundId,
			isTaxDeductible: false,
			name: expect.any(String),
			isDefault: false,
			isArchived: false,
			referenceNumber: null,
		});
	});

	test("returns fund with maximum length name", async () => {
		const adminAuthToken = await getAdminAuthToken();
		const maxLengthName = "a".repeat(256);

		// Create organization
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

		// Create fund with max length name
		const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: maxLengthName,
					organizationId: createOrgResult.data.createOrganization.id,
					isTaxDeductible: false,
				},
			},
		});

		assertToBeNonNullish(createFundResult.data?.createFund?.id);

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: createFundResult.data.createFund.id } },
		});

		expect(fundResult.errors).toBeUndefined();
		expect(fundResult.data?.fund?.name).toHaveLength(256);
	});
});

suite("Query field fund Campaign", () => {
	test("returns fund Campaign data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();
		const { fundId, orgId } = await createFund();
		const { fundCampaignId } = await createFundCampaign(fundId);

		await addUserToOrg(regularUserResult.userId, orgId);

		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId,
				},
			},
		});

		expect(fundCampaignResult.errors).toBeUndefined();
		expect(fundCampaignResult.data.fundCampaign).toEqual(
			expect.objectContaining({
				id: fundCampaignId,
				goalAmount: expect.any(Number),
				name: expect.any(String),
			}),
		);
	});

	test("returns fund Campaign data if user is an admin", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const { fundId } = await createFund();
		const { fundCampaignId } = await createFundCampaign(fundId);

		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId,
				},
			},
		});

		expect(fundCampaignResult.errors).toBeUndefined();
		expect(fundCampaignResult.data.fundCampaign).toEqual(
			expect.objectContaining({
				id: fundCampaignId,
				goalAmount: expect.any(Number),
				name: expect.any(String),
			}),
		);
	});
});

suite("Query field fund Campaign Pledge", () => {
	test("returns fund Campaign Pledge data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId, orgId } = await createFund();
		const { fundCampaignId } = await createFundCampaign(fundId);
		await addUserToOrg(regularUserResult.userId, orgId);
		const { fundCampaignPledgeId } = await createFundCampaignPledge(
			fundCampaignId,
			regularUserResult.userId,
		);

		const fundCampaignPledgeResult = await mercuriusClient.query(
			Query_fundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: fundCampaignPledgeId,
					},
				},
			},
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult.data.fundCampaignPledge).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);
	});

	test("returns fund Campaign Pledge data if user is an admin", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const regularUserResult = await createRegularUser();

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const { fundId, orgId } = await createFund();
		const { fundCampaignId } = await createFundCampaign(fundId);
		await addUserToOrg(regularUserResult.userId, orgId);
		const { fundCampaignPledgeId } = await createFundCampaignPledge(
			fundCampaignId,
			regularUserResult.userId,
		);

		const fundCampaignPledgeResult = await mercuriusClient.query(
			Query_fundCampaignPledge,
			{
				headers: {
					authorization: `bearer ${adminSignInResult.data.signIn?.authenticationToken}`,
				},
				variables: {
					input: {
						id: fundCampaignPledgeId,
					},
				},
			},
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult.data.fundCampaignPledge).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);
	});
});

suite("Query field get fund Campaign Pledges by id", () => {
	suite("results in a graphql error", () => {
		test("with 'unauthenticated' extensions code if client is not authenticated", async () => {
			const fundCampaignPledgeResult = await mercuriusClient.query(
				Query_getPledgesByUserId,
				{
					variables: {
						input: {
							userId: faker.string.uuid(),
						},
					},
				},
			);

			expect(fundCampaignPledgeResult.data?.getPledgesByUserId).toEqual(null);
			expect(fundCampaignPledgeResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getPledgesByUserId"],
					}),
				]),
			);
		});

		test("with 'unauthenticated' extensions code if authenticated user doesn't exist in database", async () => {
			const regularUserResult = await createRegularUser();
			const { fundId, orgId } = await createFund();
			const { fundCampaignId } = await createFundCampaign(fundId);
			await addUserToOrg(regularUserResult.userId, orgId);
			const { fundCampaignPledgeId } = await createFundCampaignPledge(
				fundCampaignId,
				regularUserResult.userId,
			);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUserResult.userId));

			const fundResultCampaign = await mercuriusClient.query(
				Query_getPledgesByUserId,
				{
					headers: {
						authorization: `bearer ${regularUserResult.authToken}`,
					},
					variables: {
						input: {
							userId: fundCampaignPledgeId,
						},
					},
				},
			);

			expect(fundResultCampaign.data.getPledgesByUserId).toEqual(null);
			expect(fundResultCampaign.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getPledgesByUserId"],
					}),
				]),
			);
		});

		test("with 'arguments_associated_resources_not_found' extensions code if fund Campaign pledge is not found", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

			const fundCampaignPledgeResult = await mercuriusClient.query(
				Query_getPledgesByUserId,
				{
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							userId: faker.string.uuid(),
						},
					},
				},
			);

			expect(fundCampaignPledgeResult.data.getPledgesByUserId).toEqual(null);
			expect(fundCampaignPledgeResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: [
										{
											argumentPath: ["input", "userId"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["getPledgesByUserId"],
					}),
				]),
			);
		});

		test("with 'unauthenticated' extensions code if authorization token is malformed", async () => {
			// Generate a random invalid token instead of using a hard-coded value
			const invalidToken = Buffer.from(faker.string.alphanumeric(32)).toString(
				"base64",
			);

			const fundCampaignPledgeResult = await mercuriusClient.query(
				Query_getPledgesByUserId,
				{
					headers: {
						authorization: `bearer ${invalidToken}`,
					},
					variables: {
						input: {
							userId: faker.string.uuid(),
						},
					},
				},
			);

			expect(fundCampaignPledgeResult.data.getPledgesByUserId).toEqual(null);
			expect(fundCampaignPledgeResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getPledgesByUserId"],
					}),
				]),
			);
		});

		test("with 'unauthenticated' extensions code if authorization token is expired", async () => {
			// Generate an expired token with current time - 1 hour
			const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
			const payload = {
				exp: expiredTimestamp,
				iat: expiredTimestamp - 3600,
				sub: faker.string.uuid(),
			};
			const expiredToken = Buffer.from(JSON.stringify(payload)).toString(
				"base64",
			);

			const fundCampaignPledgeResult = await mercuriusClient.query(
				Query_getPledgesByUserId,
				{
					headers: {
						authorization: `bearer ${expiredToken}`,
					},
					variables: {
						input: {
							userId: faker.string.uuid(),
						},
					},
				},
			);

			expect(fundCampaignPledgeResult.data.getPledgesByUserId).toEqual(null);
			expect(fundCampaignPledgeResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["getPledgesByUserId"],
					}),
				]),
			);
		});
	});

	test("returns one fund Campaign Pledge data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId, orgId } = await createFund();
		const { fundCampaignId } = await createFundCampaign(fundId);
		await addUserToOrg(regularUserResult.userId, orgId);
		const { fundCampaignPledgeId } = await createFundCampaignPledge(
			fundCampaignId,
			regularUserResult.userId,
		);

		const fundCampaignPledgeResult = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
				},
			},
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult?.data?.getPledgesByUserId?.[0]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);
	});

	test("returns two fund Campaign Pledge data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId: fundId1, orgId: orgId1 } = await createFund();
		const { fundId: fundId2, orgId: orgId2 } = await createFund();

		const { fundCampaignId: fundCampaignId1 } =
			await createFundCampaign(fundId1);
		const { fundCampaignId: fundCampaignId2 } =
			await createFundCampaign(fundId2);

		await addUserToOrg(regularUserResult.userId, orgId1);
		await addUserToOrg(regularUserResult.userId, orgId2);

		const { fundCampaignPledgeId: fundCampaignPledgeId1 } =
			await createFundCampaignPledge(fundCampaignId1, regularUserResult.userId);
		const { fundCampaignPledgeId: fundCampaignPledgeId2 } =
			await createFundCampaignPledge(fundCampaignId2, regularUserResult.userId);

		const fundCampaignPledgeResult = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
				},
			},
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult?.data?.getPledgesByUserId?.[0]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId1,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult?.data?.getPledgesByUserId?.[1]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId2,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);
	});

	test("filters and returns only matching fund campaign pledge by user ID and campaign name", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId: fundId1, orgId: orgId1 } = await createFund();
		const { fundId: fundId2, orgId: orgId2 } = await createFund();

		const { fundCampaignId: fundCampaignId1 } =
			await createFundCampaign(fundId1);
		const { fundCampaignId: fundCampaignId2 } =
			await createFundCampaign(fundId2);

		await addUserToOrg(regularUserResult.userId, orgId1);
		await addUserToOrg(regularUserResult.userId, orgId2);

		const { fundCampaignPledgeId: fundCampaignPledgeId1 } =
			await createFundCampaignPledge(fundCampaignId1, regularUserResult.userId);
		await createFundCampaignPledge(fundCampaignId2, regularUserResult.userId);

		// Get first campaign data
		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId1,
				},
			},
		});
		expect(fundCampaignResult.errors).toBeUndefined();

		const fundCampaignPledgeResult = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					where: {
						name_contains: fundCampaignResult?.data?.fundCampaign?.name,
					},
				},
			},
		);

		// should return only first pledge that contain first campaign name
		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(fundCampaignPledgeResult?.data?.getPledgesByUserId?.[0]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId1,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);

		expect(fundCampaignPledgeResult.errors).toBeUndefined();
		expect(
			fundCampaignPledgeResult?.data?.getPledgesByUserId?.[1],
		).toBeUndefined();
	});

	test("returns user fund campaign pledges ordered by amount descending and ascending", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId: fundId1, orgId: orgId1 } = await createFund();
		const { fundId: fundId2, orgId: orgId2 } = await createFund();

		const { fundCampaignId: fundCampaignId1 } =
			await createFundCampaign(fundId1);
		const { fundCampaignId: fundCampaignId2 } =
			await createFundCampaign(fundId2);

		await addUserToOrg(regularUserResult.userId, orgId1);
		await addUserToOrg(regularUserResult.userId, orgId2);

		await createFundCampaignPledge(fundCampaignId1, regularUserResult.userId);
		await createFundCampaignPledge(fundCampaignId2, regularUserResult.userId);

		// Get first campaign data
		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId1,
				},
			},
		});
		expect(fundCampaignResult.errors).toBeUndefined();

		// Descending order
		const fundCampaignPledgeResult1 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					orderBy: "amount_DESC",
				},
			},
		);
		expect(fundCampaignPledgeResult1.errors).toBeUndefined();
		// first result should be the one with the highest amount
		expect(
			fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[0]?.amount ?? 0,
		).toBeGreaterThanOrEqual(
			fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[1]?.amount ?? 0,
		);

		// Ascending order
		const fundCampaignPledgeResult2 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					orderBy: "amount_ASC",
				},
			},
		);
		expect(fundCampaignPledgeResult2.errors).toBeUndefined();
		// first result should be the one with the lowest amount
		expect(
			fundCampaignPledgeResult2?.data?.getPledgesByUserId?.[1]?.amount ?? 0,
		).toBeGreaterThanOrEqual(
			fundCampaignPledgeResult2?.data?.getPledgesByUserId?.[0]?.amount ?? 0,
		);
	});

	test("returns user fund campaign pledges ordered by campaign endDate descending and ascending", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId: fundId1, orgId: orgId1 } = await createFund();
		const { fundId: fundId2, orgId: orgId2 } = await createFund();

		const { fundCampaignId: fundCampaignId1 } =
			await createFundCampaign(fundId1);
		const { fundCampaignId: fundCampaignId2 } =
			await createFundCampaign(fundId2);

		await addUserToOrg(regularUserResult.userId, orgId1);
		await addUserToOrg(regularUserResult.userId, orgId2);

		await createFundCampaignPledge(fundCampaignId1, regularUserResult.userId);
		await createFundCampaignPledge(fundCampaignId2, regularUserResult.userId);

		// Get first campaign data
		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId1,
				},
			},
		});
		expect(fundCampaignResult.errors).toBeUndefined();

		// Descending order
		const fundCampaignPledgeResult1 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					orderBy: "endDate_DESC",
				},
			},
		);
		expect(fundCampaignPledgeResult1.errors).toBeUndefined();
		// first result should be the one with the most recent end date
		const endAt1 = new Date(
			fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[0]?.campaign
				?.endAt ?? 0,
		).getTime();
		const endAt2 = new Date(
			fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[1]?.campaign
				?.endAt ?? 0,
		).getTime();

		expect(endAt1).toBeGreaterThanOrEqual(endAt2);

		// Ascending order
		const fundCampaignPledgeResult2 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					orderBy: "endDate_ASC",
				},
			},
		);
		expect(fundCampaignPledgeResult2.errors).toBeUndefined();
		// second result should be the one with the most recent end date
		const endAt3 = new Date(
			fundCampaignPledgeResult2?.data?.getPledgesByUserId?.[0]?.campaign
				?.endAt ?? 0,
		).getTime();
		const endAt4 = new Date(
			fundCampaignPledgeResult2?.data?.getPledgesByUserId?.[1]?.campaign
				?.endAt ?? 0,
		).getTime();

		expect(endAt4).toBeGreaterThanOrEqual(endAt3);
	});

	test("filters and returns only matching fund campaign pledge by user ID and pledger name", async () => {
		const regularUserResult = await createRegularUser();

		const { fundId: fundId1, orgId: orgId1 } = await createFund();
		const { fundId: fundId2, orgId: orgId2 } = await createFund();

		const { fundCampaignId: fundCampaignId1 } =
			await createFundCampaign(fundId1);
		const { fundCampaignId: fundCampaignId2 } =
			await createFundCampaign(fundId2);

		await addUserToOrg(regularUserResult.userId, orgId1);
		await addUserToOrg(regularUserResult.userId, orgId2);

		const { fundCampaignPledgeId: fundCampaignPledgeId1 } =
			await createFundCampaignPledge(fundCampaignId1, regularUserResult.userId);
		const { fundCampaignPledgeId: fundCampaignPledgeId2 } =
			await createFundCampaignPledge(fundCampaignId2, regularUserResult.userId);

		// Get first campaign data
		const fundCampaignResult = await mercuriusClient.query(Query_fundCampaign, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundCampaignId1,
				},
			},
		});
		expect(fundCampaignResult.errors).toBeUndefined();

		const fundCampaignPledgeResult1 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					where: {
						firstName_contains: regularUserResult.name,
					},
				},
			},
		);

		// should return two pledges that contain pledger name
		expect(fundCampaignPledgeResult1.errors).toBeUndefined();
		expect(fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[0]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId1,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);

		expect(fundCampaignPledgeResult1.errors).toBeUndefined();
		expect(fundCampaignPledgeResult1?.data?.getPledgesByUserId?.[1]).toEqual(
			expect.objectContaining({
				id: fundCampaignPledgeId2,
				amount: expect.any(Number),
				note: expect.any(String),
			}),
		);

		const fundCampaignPledgeResult2 = await mercuriusClient.query(
			Query_getPledgesByUserId,
			{
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						userId: regularUserResult.userId,
					},
					where: {
						firstName_contains: faker.string.uuid(),
					},
				},
			},
		);

		// should not return any pledges
		expect(fundCampaignPledgeResult2.data.getPledgesByUserId).toEqual(null);
		expect(fundCampaignPledgeResult2.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions:
						expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
							{
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: ["input", "userId"],
									},
								],
							},
						),
					message: expect.any(String),
					path: ["getPledgesByUserId"],
				}),
			]),
		);
	});
});

suite("Funds schema validation and field behavior", () => {
	test("validates fund name constraints", () => {
		// Test length constraints
		const tooShortName = "";
		const tooLongName = "a".repeat(257);
		const validName = "Test Fund";

		// Test special cases
		const specialCharsName = "Fund #1 @Special!";
		const whitespaceOnlyName = "   ";
		const unicodeName = "Fund 🚀 测试";
		const spacePaddedName = "  Test Fund  ";

		// Test length constraints
		const tooShortResult = fundsTableInsertSchema.safeParse({
			name: tooShortName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(tooShortResult.success).toBe(false);

		const tooLongResult = fundsTableInsertSchema.safeParse({
			name: tooLongName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(tooLongResult.success).toBe(false);

		const validResult = fundsTableInsertSchema.safeParse({
			name: validName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(validResult.success).toBe(true);

		// Test special characters
		const specialCharsResult = fundsTableInsertSchema.safeParse({
			name: specialCharsName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(specialCharsResult.success).toBe(true);

		// Test whitespace-only name
		const whitespaceOnlyResult = fundsTableInsertSchema.safeParse({
			name: whitespaceOnlyName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(whitespaceOnlyResult.success).toBe(true);

		// Test unicode characters
		const unicodeResult = fundsTableInsertSchema.safeParse({
			name: unicodeName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(unicodeResult.success).toBe(true);

		// Test space-padded name
		const spacePaddedResult = fundsTableInsertSchema.safeParse({
			name: spacePaddedName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(spacePaddedResult.success).toBe(true);

		// Also verify trimming behavior with valid name
		if (validResult.success) {
			const trimmedResult = validResult.data;
			expect(trimmedResult.name).toBe(validName.trim());
		}
	});

	test("verifies unique constraint on fund name within organization", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
		const orgId = createOrgResult.data.createOrganization.id;
		const fundName = `Test Fund ${faker.string.uuid()}`;

		const fund1Result = await mercuriusClient.mutate(Mutation_createFund, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					name: fundName,
					organizationId: orgId,
					isTaxDeductible: false,
				},
			},
		});

		assertToBeNonNullish(fund1Result.data?.createFund?.id);

		const fund2Result = await mercuriusClient.mutate(Mutation_createFund, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					name: fundName,
					organizationId: orgId,
					isTaxDeductible: true,
				},
			},
		});

		expect(fund2Result.errors).toBeDefined();
		expect(fund2Result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});
});

suite("UUID Validation", () => {
	test("verifies UUID validation", async () => {
		// Test valid UUID generation
		const { fundId } = await createFund();

		// Verify format matches UUID v7 format
		expect(fundId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		// Get admin token for subsequent requests
		const adminAuthToken = await getAdminAuthToken();

		// Test invalid UUID formats
		const invalidFormats = [
			"not-a-uuid", // Not a UUID at all
			"123e4567-e89b-12d3-a456-426614174000", // Invalid version (v1)
			"123e4567-e89b-7-a456-426614174000", // Missing digits
		];

		for (const invalidId of invalidFormats) {
			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: invalidId },
				},
			});

			expect(fundResult.errors).toBeDefined();
		}

		// Test case sensitivity
		const upperCaseId = fundId.toUpperCase();
		const lowerCaseId = fundId.toLowerCase();

		// Both upper and lower case should be valid
		for (const testId of [upperCaseId, lowerCaseId]) {
			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: testId },
				},
			});

			// Should fail because fund doesn't exist, not because of UUID format
			expect(fundResult.errors?.[0]?.extensions?.code).toBe(undefined);
		}

		// Test UUID version validation
		const invalidVersions = Array.from({ length: 9 }, (_, i) => {
			if (i === 7) return null;
			const hexVersion = i.toString(16);
			return fundId.replace(
				/^([0-9a-f]{8}-[0-9a-f]{4}-)7/i,
				`$1${hexVersion}`,
			) as string;
		}).filter((id): id is string => id !== null);

		for (const invalidVersionId of invalidVersions) {
			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: invalidVersionId },
				},
			});

			expect(fundResult.errors).toBeDefined();
			expect(fundResult.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		}
	});
});

suite("Required Field Validation", () => {
	test("validates that all required fund fields (name, isTaxDeductible, organizationId) are present", () => {
		const validInput = {
			name: "Test Fund",
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		};

		// Test missing name
		const missingName = { ...validInput, name: undefined };
		expect(fundsTableInsertSchema.safeParse(missingName).success).toBe(false);

		// Test missing isTaxDeductible
		const missingTaxStatus = { ...validInput, isTaxDeductible: undefined };
		expect(fundsTableInsertSchema.safeParse(missingTaxStatus).success).toBe(
			false,
		);

		// Test missing organizationId
		const missingOrgId = { ...validInput, organizationId: undefined };
		expect(fundsTableInsertSchema.safeParse(missingOrgId).success).toBe(false);

		// Valid data should pass
		expect(fundsTableInsertSchema.safeParse(validInput).success).toBe(true);
	});

	test("validates field constraints: name length, isTaxDeductible type, and organizationId format", () => {
		const validInput = {
			name: "Test Fund",
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		};

		// Test name constraints
		expect(
			fundsTableInsertSchema.safeParse({
				...validInput,
				name: "",
			}).success,
		).toBe(false);

		expect(
			fundsTableInsertSchema.safeParse({
				...validInput,
				name: "a".repeat(257),
			}).success,
		).toBe(false);

		// Test isTaxDeductible must be boolean
		expect(
			fundsTableInsertSchema.safeParse({
				...validInput,
				isTaxDeductible: "true",
			}).success,
		).toBe(false);

		// Test organizationId must be UUID
		expect(
			fundsTableInsertSchema.safeParse({
				...validInput,
				organizationId: "invalid-uuid",
			}).success,
		).toBe(false);
	});
});

// Helper function types
interface TestUser {
	authToken: string;
	userId: string;
	name: string | null;
	cleanup: () => Promise<void>;
}

interface TestFund {
	fundId: string;
	orgId: string;
	cleanup: () => Promise<void>;
}

interface TestFundCampaign {
	fundCampaignId: string;
	cleanup: () => Promise<void>;
}

interface TestFundCampaignPledge {
	fundCampaignPledgeId: string;
	cleanup: () => Promise<void>;
}

interface RetryOptions {
	maxRetries: number;
	initialDelay: number;
	maxDelay: number;
	backoffFactor: number;
}

// Retry configuration
const RETRY_OPTIONS: RetryOptions = {
	maxRetries: 3,
	initialDelay: 100, // ms
	maxDelay: 1000, // ms
	backoffFactor: 2,
};

async function retry<T>(
	operation: () => Promise<T>,
	options: RetryOptions = RETRY_OPTIONS,
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			if (attempt < options.maxRetries) {
				// Calculate exponential backoff delay
				const backoffDelay =
					options.initialDelay * options.backoffFactor ** (attempt - 1);
				const delay = Math.min(backoffDelay, options.maxDelay);

				// Log retry attempt for debugging
				console.warn(
					`Retry attempt ${attempt}/${options.maxRetries} after error:`,
					error,
					`(waiting ${delay}ms)`,
				);

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}

// test helper functions

async function createRegularUser(): Promise<TestUser> {
	try {
		return await retry(async () => {
			const adminAuthToken = await getAdminAuthToken();

			const userResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						emailAddress: `email${faker.string.uuid()}@test.com`,
						password: "password123",
						role: "regular",
						name: "Test User",
						isEmailAddressVerified: false,
					},
				},
			});

			if (
				!userResult.data?.createUser?.authenticationToken ||
				!userResult.data?.createUser?.user?.id
			) {
				throw new Error("Failed to create user: Missing required data");
			}

			const userId = userResult.data.createUser.user.id;
			const authToken = userResult.data.createUser.authenticationToken;
			const name = userResult.data.createUser.user.name;

			return {
				authToken,
				userId,
				name,
				cleanup: async () => {
					try {
						await mercuriusClient.mutate(Mutation_deleteUser, {
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: { input: { id: userId } },
						});
						console.log(`Cleanup: User ${userId} would be deleted here`);
					} catch (error) {
						console.error("Failed to cleanup user:", error);
						throw error;
					}
				},
			};
		});
	} catch (error) {
		console.error("Failed to create regular user:", error);
		throw error;
	}
}

async function createFund(): Promise<TestFund> {
	try {
		return await retry(async () => {
			const adminAuthToken = await getAdminAuthToken();

			// Create organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);

			if (!createOrgResult.data?.createOrganization?.id) {
				throw new Error(
					"Failed to create organization: Missing organization ID",
				);
			}

			const orgId = createOrgResult.data.createOrganization.id;

			// Create fund
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);

			if (!createFundResult.data?.createFund?.id) {
				throw new Error(
					`Failed to create fund: ${JSON.stringify(createFundResult)}`,
				);
			}

			const fundId = createFundResult.data.createFund.id;

			return {
				fundId,
				orgId,
				cleanup: async () => {
					try {
						await mercuriusClient.mutate(Mutation_deleteFund, {
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: { input: { id: fundId } },
						});
						await mercuriusClient.mutate(Mutation_deleteOrganization, {
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: { input: { id: orgId } },
						});
						console.log(
							`Cleanup: Fund ${fundId} and Org ${orgId} would be deleted here`,
						);
					} catch (error) {
						console.error("Failed to cleanup fund and organization:", error);
						throw error;
					}
				},
			};
		});
	} catch (error) {
		console.error("Failed to create fund:", error);
		throw error;
	}
}

async function createFundCampaign(fundId: string): Promise<TestFundCampaign> {
	try {
		return await retry(async () => {
			const adminAuthToken = await getAdminAuthToken();

			// Create fund Campaign
			const createFundCampaignResult = await mercuriusClient.mutate(
				Mutation_createFundCampaign,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Fund Campaign ${faker.string.uuid()}`,
							fundId: fundId,
							goalAmount: faker.number.int({ min: 1000, max: 10000 }),
							startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
							currencyCode: "USD",
						},
					},
				},
			);

			if (!createFundCampaignResult.data?.createFundCampaign?.id) {
				throw new Error(
					"Failed to create fund Campaign: Missing fund Campaign ID",
				);
			}

			const fundCampaignId =
				createFundCampaignResult.data.createFundCampaign.id;

			return {
				fundCampaignId,
				cleanup: async () => {
					try {
						await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: { input: { id: fundCampaignId } },
						});
						console.log(
							`Cleanup: Fund Campaign ${fundCampaignId} would be deleted here`,
						);
					} catch (error) {
						console.error("Failed to cleanup fund campaign :", error);
						throw error;
					}
				},
			};
		});
	} catch (error) {
		console.error("Failed to create fund campaign:", error);
		throw error;
	}
}

async function createFundCampaignPledge(
	fundCampaignId: string,
	pledgerId: string,
): Promise<TestFundCampaignPledge> {
	try {
		return await retry(async () => {
			const adminAuthToken = await getAdminAuthToken();

			// Create fund Campaign Pledge
			const createFundCampaignPledgeResult = await mercuriusClient.mutate(
				Mutation_createFundCampaignPledge,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							note: "Fund Campaign Pledge",
							campaignId: fundCampaignId,
							pledgerId: pledgerId,
							amount: faker.number.int({ min: 1000, max: 10000 }),
						},
					},
				},
			);
			if (!createFundCampaignPledgeResult.data?.createFundCampaignPledge?.id) {
				throw new Error(
					"Failed to create fund Campaign: Missing fund Campaign Pledge ID",
				);
			}

			const fundCampaignPledgeId =
				createFundCampaignPledgeResult.data.createFundCampaignPledge.id;

			return {
				fundCampaignPledgeId,
				cleanup: async () => {
					try {
						await mercuriusClient.mutate(Mutation_deleteFundCampaignPledge, {
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: { input: { id: fundCampaignPledgeId } },
						});
						console.log(
							`Cleanup: Fund Campaign Pledge ${fundCampaignPledgeId} would be deleted here`,
						);
					} catch (error) {
						console.error("Failed to cleanup fund campaign Pledge :", error);
						throw error;
					}
				},
			};
		});
	} catch (error) {
		console.error("Failed to create fund campaign Pledge:", error);
		throw error;
	}
}

async function addUserToOrg(
	userId: string,
	orgId: string,
): Promise<{ cleanup: () => Promise<void> }> {
	try {
		return await retry(async () => {
			const adminAuthToken = await getAdminAuthToken();

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						memberId: userId,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			return {
				cleanup: async () => {
					try {
						// Add cleanup mutation here when available
						await mercuriusClient.mutate(
							Mutation_deleteOrganizationMembership,
							{
								headers: { authorization: `bearer ${adminAuthToken}` },
								variables: {
									input: { memberId: userId, organizationId: orgId },
								},
							},
						);
						console.log(
							`Cleanup: Membership for user ${userId} in org ${orgId} would be deleted here`,
						);
					} catch (error) {
						console.error("Failed to cleanup organization membership:", error);
						throw error;
					}
				},
			};
		});
	} catch (error) {
		console.error("Failed to add user to organization:", error);
		throw error;
	}
}

import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
	Query_signIn,
} from "../documentNodes";
suite("Query field actionCategoriesByOrganization", () => {
	test("returns graphql error 'unauthenticated' if client is not authenticated", async () => {
		const result = await mercuriusClient.query(
			QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
			{
				variables: {
					input: {
						organizationId: faker.string.uuid(), // random org id
					},
				},
			},
		);

		expect(result.data?.actionCategoriesByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("returns graphql error 'invalid_arguments' for malformed input", async () => {
		const adminLoginResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminLoginResult.data?.signIn?.authenticationToken);

		const token = adminLoginResult.data.signIn.authenticationToken;

		const result = await mercuriusClient.query(
			QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
			{
				headers: {
					authorization: `Bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: "not-a-uuid", // invalid uuid format
					},
				},
			},
		);

		expect(result.data?.actionCategoriesByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("returns paginated categories for valid admin and org", async () => {
		const adminLoginResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminLoginResult.data?.signIn?.authenticationToken);
		// Adjusted to check for a valid property on the user object
		assertToBeNonNullish(adminLoginResult.data?.signIn?.user);

		const token = adminLoginResult.data.signIn.authenticationToken;
		// Replace with a valid property or fetch organizationId separately
		const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba"; // Replace with actual logic to fetch organizationId

		const result = await mercuriusClient.query(
			QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
			{
				headers: {
					authorization: `Bearer ${token}`,
				},
				variables: {
					input: {
						organizationId,
					},
					first: 5,
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.actionCategoriesByOrganization?.edges).toBeInstanceOf(
			Array,
		);
	});
});

suite("Query field actionItemsByOrganization", () => {
	let adminAuthToken: string;
	let organizationId: string;

	suiteSetup(async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		adminAuthToken = adminSignInResult.data?.signIn?.authenticationToken ?? "";
		// Replace with actual logic to fetch organizationId
		organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba"; // Hardcoded for testing purposes

		assertToBeNonNullish(adminAuthToken);
		assertToBeNonNullish(organizationId);
	});

	suite("Authentication and Authorization", () => {
		test("returns error if user is not authenticated", async () => {
			const result = await mercuriusClient.query(
				QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
				{
					variables: {
						input: { organizationId },
						first: 5,
					},
				},
			);
			expect(result.data?.actionCategoriesByOrganization).toBeNull();
			expect(result.errors?.[0]?.extensions?.code ?? "").toBe(
				"unauthenticated",
			);
		});

		test("returns error if organizationId is malformed", async () => {
			const result = await mercuriusClient.query(
				QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: { organizationId: "bad-format" },
						first: 5,
					},
				},
			);
			expect(result.data?.actionCategoriesByOrganization).toBeNull();
			expect(result.errors?.[0]?.extensions.code).toBe("invalid_arguments");
		});

		test("returns error for unauthorized user", async () => {
			// Step 1: Sign in as admin
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
			assertToBeNonNullish(adminSignInResult.data?.signIn?.user); // Adjusted to check for the user object itself

			const adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
			const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba"; // Replace with actual logic to fetch organizationId

			// Step 2: Create a regular (unauthorized) user
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							emailAddress: `${faker.string.ulid()}@test.com`,
							name: "NotAdmin",
							password: "password123",
							role: "regular",
							isEmailAddressVerified: false,
						},
					},
				},
			);
			const token = createUserResult.data?.createUser?.authenticationToken;
			const userId = createUserResult.data?.createUser?.user?.id;

			assertToBeNonNullish(token);
			assertToBeNonNullish(userId);

			// Step 3: Make the unauthorized query
			const result = await mercuriusClient.query(
				QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
				{
					headers: { authorization: `bearer ${token}` },
					variables: {
						input: { organizationId },
						first: 5,
					},
				},
			);

			// Step 4: Expect an authorization error
			expect(result.data?.actionCategoriesByOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);

			// Step 5: Clean up
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: userId },
				},
			});
		});

		suite("Valid Requests", () => {
			test("returns paginated categories with valid input", async () => {
				const result = await mercuriusClient.query(
					QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: { organizationId },
							first: 5,
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(
					result.data?.actionCategoriesByOrganization?.edges,
				).toBeInstanceOf(Array);
				expect(result.data?.actionCategoriesByOrganization?.pageInfo).toEqual(
					expect.objectContaining({
						hasNextPage: expect.any(Boolean),
						hasPreviousPage: expect.any(Boolean),
					}),
				);
			});
		});

		suite("Pagination", () => {
			test("handles forward pagination using array slicing instead of cursor", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminAuthToken =
					adminSignInResult.data?.signIn?.authenticationToken;
				const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba"; // use a fixed org ID or set up via seeding

				assertToBeNonNullish(adminAuthToken);
				assertToBeNonNullish(organizationId);

				// Step 1: Fetch the first 3 items
				const firstResult = await mercuriusClient.query(
					QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: { organizationId },
							first: 3,
						},
					},
				);

				const firstEdges =
					firstResult.data?.actionCategoriesByOrganization?.edges;
				assertToBeNonNullish(firstEdges);
				expect(firstEdges.length).toBeLessThanOrEqual(3);

				// Step 2: Fetch more (not using cursor) — just verify pagination metadata
				const pageInfo =
					firstResult.data?.actionCategoriesByOrganization?.pageInfo;
				assertToBeNonNullish(pageInfo);
				expect(pageInfo).toEqual(
					expect.objectContaining({
						hasNextPage: expect.any(Boolean),
						hasPreviousPage: expect.any(Boolean),
						startCursor: null, // or undefined depending on schema implementation
						endCursor: null,
					}),
				);
			});
			test("returns error if cursor is invalid", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminAuthToken =
					adminSignInResult.data?.signIn?.authenticationToken;
				const organizationId = "01960b81-bfed-7369-ae96-689dbd4281ba";

				assertToBeNonNullish(adminAuthToken);
				assertToBeNonNullish(organizationId);

				const invalidCursor =
					Buffer.from("not-a-valid-json").toString("base64url");

				const result = await mercuriusClient.query(
					QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: { organizationId },
							first: 5,
							after: invalidCursor,
						},
					},
				);

				// ✅ Expect an error (since the cursor is intentionally bad)
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.message).toContain("Unexpected token");
			});

			test("returns error if curso?r is stale", async () => {
				const result = await mercuriusClient.query(
					QUERY_ACTION_ITEM_CATEGORIES_BY_ORG,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: { organizationId },
							first: 5,
							after:
								"eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoiLCJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCJ9",
						},
					},
				);

				expect(result.data?.actionCategoriesByOrganization).toBeNull();
				expect(result.errors?.[0]?.extensions.code).toBe(
					"arguments_associated_resources_not_found",
				);
			});
		});
	});
});

async function suiteSetup(setupFunction: () => Promise<void>): Promise<void> {
	try {
		await setupFunction();
	} catch (error) {
		console.error("Error during suite setup:", error);
		throw error;
	}
}

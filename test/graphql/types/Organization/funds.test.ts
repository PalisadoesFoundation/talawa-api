import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

let orgId: string | undefined;

// Sign in once
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

const OrganizationFundsQuery = `
  query OrganizationFunds(
    $input: QueryOrganizationInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    organization(input: $input) {
      id
      funds(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            name
            isTaxDeductible
            isDefault
            isArchived
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

suite("Organization field funds", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Unauth funds test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Test St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			expect(orgId).toBeDefined();

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(result.data?.organization?.funds ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "funds"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (cursor parse error)", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Funds invalid cursor test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Test St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
					after: "not-a-valid-base64",
				},
			});

			expect(result.data?.organization?.funds ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["after"],
								}),
							]),
						}),
						path: ["organization", "funds"],
					}),
				]),
			);
		});
	});

	suite("when the cursor references a non-existing resource", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Cursor not found test",
							countryCode: "us",
							state: "CA",
							city: "LA",
							postalCode: "90001",
							addressLine1: "456 Main St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const fakeCursor = Buffer.from(
				JSON.stringify({
					name: `ghost-fund-${faker.string.uuid()}`,
				}),
			).toString("base64url");

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
					after: fakeCursor,
				},
			});

			expect(result.data?.organization?.funds ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["organization", "funds"],
					}),
				]),
			);
		});
	});

	suite("when the client is authorized", () => {
		test("should return empty result when organization has no funds", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Empty funds test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "789 Market St",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { organizationId: orgId },
				},
			});

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.organization.funds.edges.length).toBe(0);
			expect(result.data.organization.funds.pageInfo.hasNextPage).toBe(false);
			expect(result.data.organization.funds.pageInfo.hasPreviousPage).toBe(
				false,
			);
		});

		test("should return funds successfully (forward pagination)", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Funds success test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "789 Market St",
						},
					},
				},
			);

			orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { organizationId: orgId },
				},
			});

			// Create funds ONCE (no duplicates)
			for (let i = 0; i < 5; i++) {
				await mercuriusClient.mutate(Mutation_createFund, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							name: `Fund ${String(i).padStart(2, "0")}`,
							isTaxDeductible: i % 2 === 0,
							isDefault: i === 0,
							isArchived: false,
						},
					},
				});
			}

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 3,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.organization.funds.edges.length).toBe(3);
			expect(result.data.organization.funds.pageInfo.hasNextPage).toBe(true);
			expect(result.data.organization.funds.pageInfo.hasPreviousPage).toBe(
				false,
			);
		});

		test("should support cursor-based pagination", async () => {
			assertToBeNonNullish(orgId);

			const initialResult = await mercuriusClient.query(
				OrganizationFundsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						first: 10,
					},
				},
			);

			expect(initialResult.errors).toBeUndefined();

			const edges = initialResult.data.organization.funds.edges;
			expect(edges.length).toBeGreaterThan(1);

			const cursor = edges[0].cursor;
			expect(cursor).toBeDefined();

			const paginatedResult = await mercuriusClient.query(
				OrganizationFundsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						first: 2,
						after: cursor,
					},
				},
			);

			expect(paginatedResult.errors).toBeUndefined();
			expect(
				paginatedResult.data.organization.funds.edges.length,
			).toBeGreaterThan(0);

			// Verify that pagination moved forward (different nodes)
			expect(paginatedResult.data.organization.funds.edges[0].node.id).not.toBe(
				edges[0].node.id,
			);
		});

		test("should support backward pagination with last/before", async () => {
			assertToBeNonNullish(orgId);

			// First fetch all funds to get a valid cursor
			const initialResult = await mercuriusClient.query(
				OrganizationFundsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						first: 10,
					},
				},
			);

			expect(initialResult.errors).toBeUndefined();

			const edges = initialResult.data.organization.funds.edges;
			expect(edges.length).toBeGreaterThan(2);

			// Use the LAST cursor to paginate backwards
			const lastCursor = edges[edges.length - 1].cursor;
			expect(lastCursor).toBeDefined();

			const backwardResult = await mercuriusClient.query(
				OrganizationFundsQuery,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
						last: 2,
						before: lastCursor,
					},
				},
			);

			expect(backwardResult.errors).toBeUndefined();

			const backwardEdges = backwardResult.data.organization.funds.edges;

			expect(backwardEdges.length).toBe(2);
			expect(backwardResult.data.organization.funds.pageInfo.hasNextPage).toBe(
				true,
			);
		});

		test("should handle single page of results correctly", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `${faker.company.name()} ${faker.string.ulid()}`,
							description: "Single page funds test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Single St",
						},
					},
				},
			);

			const singlePageOrgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(singlePageOrgId);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { organizationId: singlePageOrgId },
				},
			});

			// Create only 2 funds
			for (let i = 0; i < 2; i++) {
				await mercuriusClient.mutate(Mutation_createFund, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: singlePageOrgId,
							name: `Single Fund ${String(i).padStart(2, "0")}`,
							isTaxDeductible: true,
							isDefault: false,
							isArchived: false,
						},
					},
				});
			}

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: singlePageOrgId },
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.organization.funds.edges.length).toBe(2);
			expect(result.data.organization.funds.pageInfo.hasNextPage).toBe(false);
			expect(result.data.organization.funds.pageInfo.hasPreviousPage).toBe(
				false,
			);
		});

		test("should handle multi-page results with correct pageInfo", async () => {
			assertToBeNonNullish(orgId);

			// Fetch first page
			const firstPage = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(firstPage.errors).toBeUndefined();
			expect(firstPage.data.organization.funds.edges.length).toBe(2);
			expect(firstPage.data.organization.funds.pageInfo.hasNextPage).toBe(true);
			expect(firstPage.data.organization.funds.pageInfo.hasPreviousPage).toBe(
				false,
			);

			// Fetch second page
			const secondPage = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
					after: firstPage.data.organization.funds.edges[1].cursor,
				},
			});

			expect(secondPage.errors).toBeUndefined();
			expect(secondPage.data.organization.funds.edges.length).toBeGreaterThan(
				0,
			);
			expect(secondPage.data.organization.funds.pageInfo.hasPreviousPage).toBe(
				true,
			);
		});
	});

	suite("when a non-admin non-member accesses funds", () => {
		test("should return unauthorized_action error", async () => {
			// Create a second regular user
			const { authToken: secondUserToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			assertToBeNonNullish(secondUserToken);
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${secondUserToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(result.data?.organization?.funds ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["organization", "funds"],
					}),
				]),
			);
		});
	});

	suite("when the authenticated user no longer exists", () => {
		test("should return unauthenticated error", async () => {
			// Create a regular user
			const { authToken: userToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			assertToBeNonNullish(userToken);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.query(OrganizationFundsQuery, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: orgId },
					first: 2,
				},
			});

			expect(result.data?.organization?.funds ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["organization", "funds"],
					}),
				]),
			);
		});
	});
});

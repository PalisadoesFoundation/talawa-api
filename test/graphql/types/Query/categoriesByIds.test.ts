import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { beforeAll, describe, expect, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Inline GraphQL query to avoid CI coverage/patch issues
const Query_categoriesByIds = gql(`
  query Query_categoriesByIds($input: CategoriesByIdsInput!) {
    categoriesByIds(input: $input) {
      id
      name
      description
      isDisabled
    }
  }
`);

const SUITE_TIMEOUT = 60_000;

describe("Query field categoriesByIds", () => {
	test(
		'returns graphql error with "unauthenticated" if not authenticated',
		async () => {
			const randomIds = [faker.string.uuid(), faker.string.uuid()];
			const result = await mercuriusClient.query(Query_categoriesByIds, {
				variables: { input: { ids: randomIds } },
			});

			expect(result.data?.categoriesByIds).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	describe("Invalid argument tests", () => {
		let adminToken: string;

		// Setup admin authentication for invalid argument tests
		beforeAll(async () => {
			const signInRes = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			adminToken = signInRes.data?.signIn?.authenticationToken ?? "";
			if (!adminToken) {
				throw new Error("Admin authentication failed");
			}
		});

		test(
			'returns graphql error with "invalid_arguments" for empty ids array',
			async () => {
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: [] } },
				});

				expect(result.data?.categoriesByIds).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["ids"],
										message: expect.stringContaining("at least 1"),
									}),
								]),
							}),
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			'returns graphql error with "invalid_arguments" for invalid UUID formats',
			async () => {
				const invalidIds = ["not-a-uuid", "also-invalid", faker.string.uuid()]; // Mix of invalid and valid
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: invalidIds } },
				});

				expect(result.data?.categoriesByIds).toBeNull();

				// Use flexible error matching since GraphQL may reject at type-validation or resolver layer
				const hasInvalidArgumentsError = result.errors?.some((error) => {
					if (error.extensions?.code !== "invalid_arguments") return false;

					// Check for resolver-level validation with issues array
					if (
						error.extensions?.issues &&
						Array.isArray(error.extensions.issues)
					) {
						return error.extensions.issues.some(
							(issue: { argumentPath?: string[]; message?: string }) =>
								(issue.argumentPath?.includes("ids") ||
									issue.argumentPath?.includes("0") ||
									issue.argumentPath?.includes("1")) &&
								issue.message?.toLowerCase().includes("uuid"),
						);
					}

					// Check for type-validation level errors (alternative path structure)
					return (
						error.message?.toLowerCase().includes("uuid") ||
						error.message?.toLowerCase().includes("invalid")
					);
				});

				expect(hasInvalidArgumentsError).toBe(true);
			},
			SUITE_TIMEOUT,
		);

		test(
			'returns graphql error with "invalid_arguments" for non-array input',
			async () => {
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: "not-an-array" as unknown as string[] } },
				});

				expect(result.data?.categoriesByIds).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["ids", "0"],
										message: expect.stringContaining("Invalid uuid"),
									}),
								]),
							}),
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			'returns graphql error with "invalid_arguments" for null ids',
			async () => {
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: null as unknown as string[] } },
				});

				expect(result.data?.categoriesByIds).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["ids"],
										message: expect.stringContaining(
											"Expected array, received null",
										),
									}),
								]),
							}),
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			'returns graphql error with "invalid_arguments" for undefined ids',
			async () => {
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: {} as unknown as { ids: string[] } },
				});

				expect(result.data?.categoriesByIds).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["ids"],
										message: expect.stringContaining("Required"),
									}),
								]),
							}),
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	describe("Success tests", () => {
		test(
			"returns the categories for valid IDs",
			async () => {
				// Sign in as admin
				const signInRes = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = signInRes.data?.signIn?.authenticationToken;
				const adminId = signInRes.data?.signIn?.user?.id;
				if (!adminToken || !adminId) {
					throw new Error("Admin authentication failed");
				}

				// Create organization
				const orgRes = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { name: `Test Org ${faker.string.ulid()}` } },
					},
				);

				const orgId = orgRes.data?.createOrganization?.id;
				if (!orgId) {
					throw new Error("Organization creation failed");
				}

				// Add admin as organization member
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId: adminId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				});

				// Create multiple action item categories
				const category1Res = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Test Category 1",
								description: "First test category",
								organizationId: orgId,
								isDisabled: false,
							},
						},
					},
				);

				const category2Res = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Test Category 2",
								description: "Second test category",
								organizationId: orgId,
								isDisabled: true,
							},
						},
					},
				);

				const category1Id = category1Res.data?.createActionItemCategory?.id;
				const category2Id = category2Res.data?.createActionItemCategory?.id;

				if (!category1Id || !category2Id) {
					throw new Error("Category creation failed");
				}

				// Query both categories by IDs
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: [category1Id, category2Id] } },
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.categoriesByIds).toHaveLength(2);

				const categories = result.data?.categoriesByIds;
				expect(categories).toBeDefined();
				expect(categories).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: category1Id,
							name: "Test Category 1",
							description: "First test category",
							isDisabled: false,
						}),
						expect.objectContaining({
							id: category2Id,
							name: "Test Category 2",
							description: "Second test category",
							isDisabled: true,
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"returns empty array for non-existent IDs",
			async () => {
				// Sign in as admin
				const signInRes = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = signInRes.data?.signIn?.authenticationToken;
				if (!adminToken) {
					throw new Error("Admin authentication failed");
				}

				// Query with non-existent IDs
				const nonExistentIds = [faker.string.uuid(), faker.string.uuid()];
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: nonExistentIds } },
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.categoriesByIds).toEqual([]);
			},
			SUITE_TIMEOUT,
		);

		test(
			"returns partial results for mixed valid/invalid IDs",
			async () => {
				// Sign in as admin
				const signInRes = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const adminToken = signInRes.data?.signIn?.authenticationToken;
				const adminId = signInRes.data?.signIn?.user?.id;
				if (!adminToken || !adminId) {
					throw new Error("Admin authentication failed");
				}

				// Create organization
				const orgRes = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { name: `Test Org ${faker.string.ulid()}` } },
					},
				);

				const orgId = orgRes.data?.createOrganization?.id;
				if (!orgId) {
					throw new Error("Organization creation failed");
				}

				// Add admin as organization member
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId: adminId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				});

				// Create one category
				const categoryRes = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Existing Category",
								organizationId: orgId,
								isDisabled: false,
							},
						},
					},
				);

				const existingCategoryId =
					categoryRes.data?.createActionItemCategory?.id;
				if (!existingCategoryId) {
					throw new Error("Category creation failed");
				}

				// Query with mix of existing and non-existing IDs
				const mixedIds = [existingCategoryId, faker.string.uuid()];
				const result = await mercuriusClient.query(Query_categoriesByIds, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { ids: mixedIds } },
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.categoriesByIds).toHaveLength(1);
				const categories = result.data?.categoriesByIds;
				expect(categories).toBeDefined();
				expect(categories?.[0]).toEqual(
					expect.objectContaining({
						id: existingCategoryId,
						name: "Existing Category",
						isDisabled: false,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});
});

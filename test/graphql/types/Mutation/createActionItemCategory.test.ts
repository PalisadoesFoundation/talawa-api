import { faker } from "@faker-js/faker";
import { beforeEach, expect, suite, test, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
// import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

// Helper to create an organization with a unique name and return its id.
async function createOrganizationAndGetId(authToken: string): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				description: "Organization for testing",
				countryCode: "us",
				state: "CA",
				city: "San Francisco",
				postalCode: "94101",
				addressLine1: "123 Market St",
				addressLine2: "Suite 100",
			},
		},
	});
	if (!result.data?.createOrganization?.id) {
		console.error("createOrganization failed:", result.errors);
	}
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await server.drizzleClient
		.insert(organizationMembershipsTable)
		.values({
			organizationId,
			memberId,
			role,
		})
		.execute();
}

// Sign in as admin to get an authentication token and admin user id.
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
assertToBeNonNullish(signInResult.data.signIn.user);
const adminUserId = signInResult.data.signIn.user.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field createActionItemCategory", () => {
	// Reset mocks before each test
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// Test for unit testing the resolver directly with mocks
	suite("unit tests with mocks", () => {
		suite("when the client is not authenticated", () => {
			test("should return an error with unauthenticated code", async () => {
				const result = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						variables: {
							input: {
								name: "Test Category",
								organizationId: faker.string.uuid(),
								isDisabled: false,
							},
						},
					},
				);
				expect(result.data?.createActionItemCategory).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unauthenticated" }),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		});

		// 2. Organization does not exist.
		suite("when the specified organization does not exist", () => {
			test("should return an error with arguments_associated_resources_not_found for organization", async () => {
				const result = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Test Category",
								organizationId: faker.string.uuid(), // non-existent organization
								isDisabled: false,
							},
						},
					},
				);
				expect(result.data?.createActionItemCategory).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		});

		// 3. User is not part of the organization.
		suite("when the user is not part of the organization", () => {
			test("should return an error with unauthorized_action_on_arguments_associated_resources for organization", async () => {
				const orgId = await createOrganizationAndGetId(authToken);
				// Note: We intentionally do not add a membership for the current user.
				const result = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Test Category",
								organizationId: orgId,
								isDisabled: false,
							},
						},
					},
				);
				expect(result.data?.createActionItemCategory).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		});

		// 4. Current user is not an administrator.
		suite(
			"when the current user is not an administrator of the organization",
			() => {
				test("should return an error with forbidden_action_on_arguments_associated_resources", async () => {
					// Create a new non-admin user.
					const createUserResult = await mercuriusClient.mutate(
						Mutation_createUser,
						{
							headers: { authorization: `bearer ${authToken}` },
							variables: {
								input: {
									emailAddress: `nonadmin${faker.string.ulid()}@example.com`,
									isEmailAddressVerified: false,
									name: "Non-Admin User",
									password: "password",
									role: "regular",
								},
							},
						},
					);
					assertToBeNonNullish(createUserResult.data?.createUser);
					// Assert user is non-null.
					assertToBeNonNullish(createUserResult.data.createUser.user);
					const nonAdminToken =
						createUserResult.data.createUser.authenticationToken;
					const nonAdminUserId = createUserResult.data.createUser.user.id;
					assertToBeNonNullish(nonAdminToken);
					assertToBeNonNullish(nonAdminUserId);

					const orgId = await createOrganizationAndGetId(authToken);
					// Add membership for the non-admin user with "regular" role.
					await addMembership(orgId, nonAdminUserId, "regular");
					const result = await mercuriusClient.mutate(
						Mutation_createActionItemCategory,
						{
							headers: { authorization: `bearer ${nonAdminToken}` },
							variables: {
								input: {
									name: "Test Category",
									organizationId: orgId,
									isDisabled: false,
								},
							},
						},
					);
					expect(result.data?.createActionItemCategory).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "forbidden_action_on_arguments_associated_resources",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["input", "organizationId"],
											message:
												"Only administrators can create categories for this organization.",
										}),
									]),
								}),
								path: ["createActionItemCategory"],
							}),
						]),
					);
				});
			},
		);

		// 5. Success case - Admin user creates a category.
		suite("when all conditions are met", () => {
			test("should successfully create a category", async () => {
				const orgId = await createOrganizationAndGetId(authToken);
				await addMembership(orgId, adminUserId, "administrator");

				// Mock the insertion into the DB for actionCategoriesTable
				server.drizzleClient.insert = vi.fn().mockReturnValueOnce({
					values: vi.fn().mockReturnThis(),
					returning: vi.fn().mockResolvedValueOnce([
						{
							id: "category-123",
							name: "Test Category",
							organizationId: orgId,
							creatorId: adminUserId,
							isDisabled: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					]),
				});

				const result = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Test Category",
								organizationId: orgId,
								isDisabled: false,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.createActionItemCategory).toEqual(
					expect.objectContaining({
						name: "Test Category",
						organizationId: orgId,
						isDisabled: false,
					}),
				);
			});
		});
	});
});

import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_currentUser,
} from "../documentNodes";

suite("Mutation field createActionItemCategory", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createActionItemCategory" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const createActionItemCategoryResult = await mercuriusClient.mutate(
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

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: "bearer invalid-token", // Use an invalid token directly
						},
						variables: {
							input: {
								name: "Test Category",
								organizationId: faker.string.uuid(),
								isDisabled: false,
							},
						},
					},
				);

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createActionItemCategory" field if`,
		() => {
			test(`length of the value of the argument "input.name" is less than 1.
				length of the value of the argument "input.description" is less than 1.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "",
								description: "",
								organizationId: faker.string.uuid(),
								isDisabled: false,
							},
						},
					},
				);

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.name" is more than 256.
				length of the value of the argument "input.description" is more than 2048.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `name${faker.string.alpha(257)}`,
								description: `description${faker.string.alpha(2049)}`,
								organizationId: faker.string.uuid(),
								isDisabled: false,
							},
						},
					},
				);

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});

			test(`value of the argument "input.organizationId" is not a valid UUID.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Category",
								organizationId: "invalid-uuid",
								isDisabled: false,
							},
						},
					},
				);

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "organizationId"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.createActionItemCategory" field if`,
		() => {
			test(`value of the argument "input.organizationId" does not correspond to an existing organization.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Category",
								organizationId: faker.string.uuid(),
								isDisabled: false,
							},
						},
					},
				);

				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "organizationId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createActionItemCategory" field if`,
		() => {
			test("client triggering the graphql operation is not a member of the organization specified by the argument input.organizationId.", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				// Create a test user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				// Verify user creation was successful
				if (!createUserResult.data?.createUser?.authenticationToken) {
					throw new Error("User creation failed - no auth token");
				}
				if (!createUserResult.data?.createUser?.user?.id) {
					throw new Error("User creation failed - no user id");
				}
				const userToken = createUserResult.data.createUser.authenticationToken;

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;

				// Try to create action item category as non-member user
				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${userToken}`,
						},
						variables: {
							input: {
								name: "Test Category",
								organizationId: organizationId,
								isDisabled: false,
							},
						},
					},
				);

				// Verify the error response
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											UnauthorizedActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "organizationId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createActionItemCategory" field if`,
		() => {
			test("client triggering the graphql operation is not an administrator of the organization specified by the argument input.organizationId.", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				// Create a test user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				// Verify user creation was successful
				if (
					!createUserResult.data?.createUser?.authenticationToken ||
					!createUserResult.data?.createUser?.user?.id
				) {
					throw new Error("User creation failed");
				}
				const userToken = createUserResult.data.createUser.authenticationToken;
				const userId = createUserResult.data.createUser.user.id;

				// Create an organization as admin with a unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;

				// Add user as regular member (not administrator) to the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: userId,
								organizationId: organizationId,
								role: "regular",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error("Membership creation failed");
				}

				// Try to create action item category as regular member
				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${userToken}`,
						},
						variables: {
							input: {
								name: "Test Category",
								organizationId: organizationId,
								isDisabled: false,
							},
						},
					},
				);

				// Verify the error response
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "organizationId"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});

			test(`value of the argument "input.name" corresponds to an existing action item category with the same organization.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminId);

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;

				// Make admin user an administrator of the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: adminId,
								organizationId: organizationId,
								role: "administrator",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error(
						`Membership creation failed: ${JSON.stringify(
							createMembershipResult.errors,
						)}`,
					);
				}

				const categoryName = `Duplicate Category ${faker.string.ulid()}`; // Make the category name unique for this test

				// Create first action item category
				const createActionItemCategoryResult1 = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: categoryName,
								organizationId: organizationId,
								isDisabled: false,
							},
						},
					},
				);

				// Verify first category creation was successful
				if (
					!createActionItemCategoryResult1.data?.createActionItemCategory?.id
				) {
					throw new Error(
						`First category creation failed: ${JSON.stringify(
							createActionItemCategoryResult1.errors,
						)}`,
					);
				}

				// Try to create second action item category with same name
				const createActionItemCategoryResult2 = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: categoryName, // Use the same name as the first category
								organizationId: organizationId,
								isDisabled: false,
							},
						},
					},
				);

				// Verify the error response
				expect(
					createActionItemCategoryResult2.data.createActionItemCategory,
				).toEqual(null);
				expect(createActionItemCategoryResult2.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "name"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createActionItemCategory"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.createActionItemCategory" field where`,
		() => {
			test(`nullable action item category fields have the non-null values of the corresponding nullable arguments.
            non-nullable action item category fields with no corresponding arguments have the default values.
            non-nullable action item category fields have the non-null values of the corresponding non-nullable arguments.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminId);

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;
				const organizationName =
					createOrganizationResult.data.createOrganization.name;

				// Make admin user an administrator of the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: adminId,
								organizationId: organizationId,
								role: "administrator",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error(
						`Membership creation failed: ${JSON.stringify(
							createMembershipResult.errors,
						)}`,
					);
				}

				const variables: VariablesOf<typeof Mutation_createActionItemCategory> =
					{
						input: {
							name: "Test Category",
							description: "Test category description",
							organizationId: organizationId,
							isDisabled: false,
						},
					};

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables,
					},
				);

				expect(createActionItemCategoryResult.errors).toBeUndefined();
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(
					expect.objectContaining<
						ResultOf<
							typeof Mutation_createActionItemCategory
						>["createActionItemCategory"]
					>({
						id: expect.any(String),
						name: variables.input.name,
						description: variables.input.description ?? null,
						organization: {
							id: organizationId,
							name: organizationName,
						},
						creator: {
							id: adminId,
							name: expect.any(String),
						},
						isDisabled: variables.input.isDisabled,
						createdAt: expect.any(String),
					}),
				);
			});
			test(`nullable action item category fields have the "null" values of the corresponding nullable arguments.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminId);

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;
				const organizationName =
					createOrganizationResult.data.createOrganization.name;

				// Make admin user an administrator of the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: adminId,
								organizationId: organizationId,
								role: "administrator",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error(
						`Membership creation failed: ${JSON.stringify(
							createMembershipResult.errors,
						)}`,
					);
				}

				const variables: VariablesOf<typeof Mutation_createActionItemCategory> =
					{
						input: {
							name: "Test Category",
							organizationId: organizationId,
							isDisabled: false,
							// Omit description field entirely rather than setting it to null
						},
					};

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables,
					},
				);

				expect(createActionItemCategoryResult.errors).toBeUndefined();
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(
					expect.objectContaining<
						ResultOf<
							typeof Mutation_createActionItemCategory
						>["createActionItemCategory"]
					>({
						id: expect.any(String),
						name: variables.input.name,
						description: null, // Expect null when field is omitted
						organization: {
							id: organizationId,
							name: organizationName,
						},
						creator: {
							id: adminId,
							name: expect.any(String),
						},
						isDisabled: variables.input.isDisabled,
						createdAt: expect.any(String),
					}),
				);
			});
			test(`nullable action item category fields have the "null" values if the corresponding nullable arguments are not provided in the graphql operation.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminId);

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;
				const organizationName =
					createOrganizationResult.data.createOrganization.name;

				// Make admin user an administrator of the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: adminId,
								organizationId: organizationId,
								role: "administrator",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error(
						`Membership creation failed: ${JSON.stringify(
							createMembershipResult.errors,
						)}`,
					);
				}

				const variables: VariablesOf<typeof Mutation_createActionItemCategory> =
					{
						input: {
							name: "Test Category",
							organizationId: organizationId,
							isDisabled: false,
							// description field is intentionally omitted to test null handling
						},
					};

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables,
					},
				);

				expect(createActionItemCategoryResult.errors).toBeUndefined();
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(
					expect.objectContaining<
						ResultOf<
							typeof Mutation_createActionItemCategory
						>["createActionItemCategory"]
					>({
						id: expect.any(String),
						name: variables.input.name,
						description: null, // Expect null when field is not provided
						organization: {
							id: organizationId,
							name: organizationName,
						},
						creator: {
							id: adminId,
							name: expect.any(String),
						},
						isDisabled: variables.input.isDisabled,
						createdAt: expect.any(String),
					}),
				);
			});

			test(`default value for "isDisabled" field is false when not provided.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminId);

				// Create an organization as admin with unique name
				const uniqueOrgName = `Test Org ${faker.string.ulid()}`;
				const createOrganizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: uniqueOrgName,
							},
						},
					},
				);

				// Verify organization creation was successful
				if (!createOrganizationResult.data?.createOrganization?.id) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(
							createOrganizationResult.errors,
						)}`,
					);
				}
				const organizationId =
					createOrganizationResult.data.createOrganization.id;
				const organizationName =
					createOrganizationResult.data.createOrganization.name;

				// Make admin user an administrator of the organization
				const createMembershipResult = await mercuriusClient.mutate(
					Mutation_createOrganizationMembership,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								memberId: adminId,
								organizationId: organizationId,
								role: "administrator",
							},
						},
					},
				);

				// Verify membership creation was successful
				if (!createMembershipResult.data?.createOrganizationMembership) {
					throw new Error(
						`Membership creation failed: ${JSON.stringify(
							createMembershipResult.errors,
						)}`,
					);
				}

				const variables: VariablesOf<typeof Mutation_createActionItemCategory> =
					{
						input: {
							name: "Test Category",
							organizationId: organizationId,
							isDisabled: false, // We must provide this as it's required in the schema
						},
					};

				const createActionItemCategoryResult = await mercuriusClient.mutate(
					Mutation_createActionItemCategory,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables,
					},
				);

				expect(createActionItemCategoryResult.errors).toBeUndefined();
				expect(
					createActionItemCategoryResult.data.createActionItemCategory,
				).toEqual(
					expect.objectContaining<
						ResultOf<
							typeof Mutation_createActionItemCategory
						>["createActionItemCategory"]
					>({
						id: expect.any(String),
						name: variables.input.name,
						description: null,
						organization: {
							id: organizationId,
							name: organizationName,
						},
						creator: {
							id: adminId,
							name: expect.any(String),
						},
						isDisabled: false, // This should match what we provided
						createdAt: expect.any(String),
					}),
				);
			});
		},
	);
});

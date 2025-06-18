import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteActionItemCategory,
	Query_signIn,
} from "../documentNodes";

describe("Mutation field deleteActionItemCategory", () => {
	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteActionItemCategory" field if the client triggering the graphql operation is not authenticated.', async () => {
		const deleteActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			},
		);

		expect(
			deleteActionItemCategoryResult.data.deleteActionItemCategory,
		).toEqual(null);
		expect(deleteActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.deleteActionItemCategory" field if no action item category exists with ID equal to the value of argument "input.id".', async () => {
		// Sign in as administrator
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (!administratorUserSignInResult.data?.signIn?.authenticationToken) {
			throw new Error("Administrator sign in failed");
		}
		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		const deleteActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			},
		);

		expect(
			deleteActionItemCategoryResult.data.deleteActionItemCategory,
		).toEqual(null);
		expect(deleteActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			]),
		);
	});
	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.deleteActionItemCategory" field if the action item category has associated action items.', async () => {
		// Sign in as administrator
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			!administratorUserSignInResult.data?.signIn?.authenticationToken ||
			!administratorUserSignInResult.data?.signIn?.user?.id
		) {
			throw new Error("Administrator sign in failed");
		}
		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;
		const adminId = administratorUserSignInResult.data.signIn.user.id;

		// Create an organization
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

		if (!createOrganizationResult.data?.createOrganization?.id) {
			throw new Error(
				`Organization creation failed: ${JSON.stringify(
					createOrganizationResult.errors,
				)}`,
			);
		}
		const organizationId = createOrganizationResult.data.createOrganization.id;

		// Make admin an administrator of the organization
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

		if (!createMembershipResult.data?.createOrganizationMembership) {
			throw new Error(
				`Membership creation failed: ${JSON.stringify(
					createMembershipResult.errors,
				)}`,
			);
		}

		// Create an action item category
		const createCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
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

		if (!createCategoryResult.data?.createActionItemCategory?.id) {
			throw new Error(
				`Category creation failed: ${JSON.stringify(
					createCategoryResult.errors,
				)}`,
			);
		}
		const categoryId = createCategoryResult.data.createActionItemCategory.id;

		// Create an action item in the category
		const createActionResult = await mercuriusClient.mutate(
			Mutation_createActionItem,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						categoryId: categoryId,
						organizationId: organizationId,
						assigneeId: adminId,
					},
				},
			},
		);

		if (!createActionResult.data?.createActionItem) {
			throw new Error(
				`Action creation failed: ${JSON.stringify(createActionResult.errors)}`,
			);
		}

		// Try to delete the category
		const deleteActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
					},
				},
			},
		);

		expect(
			deleteActionItemCategoryResult.data.deleteActionItemCategory,
		).toEqual(null);
		expect(deleteActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
								message:
									"Cannot delete category that has associated action items.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.deleteActionItemCategory" field if the client triggering the graphql operation is not an administrator of the organization.', async () => {
		// Sign in as administrator
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			!administratorUserSignInResult.data?.signIn?.authenticationToken ||
			!administratorUserSignInResult.data?.signIn?.user?.id
		) {
			throw new Error("Administrator sign in failed");
		}
		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;
		const adminId = administratorUserSignInResult.data.signIn.user.id;

		// Create a test user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});

		// Verify user creation was successful
		if (!createUserResult.data?.createUser?.authenticationToken) {
			throw new Error("User creation failed - no auth token");
		}
		if (!createUserResult.data?.createUser?.user?.id) {
			throw new Error("User creation failed - no user id");
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
		const organizationId = createOrganizationResult.data.createOrganization.id;

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

		// Make admin an administrator of the organization
		const createAdminMembershipResult = await mercuriusClient.mutate(
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

		// Verify admin membership creation was successful
		if (!createAdminMembershipResult.data?.createOrganizationMembership) {
			throw new Error("Admin membership creation failed");
		}

		// Create action item category as admin
		const createCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`, // Use admin token here
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

		if (!createCategoryResult.data?.createActionItemCategory?.id) {
			throw new Error(
				`Category creation failed: ${JSON.stringify(
					createCategoryResult.errors,
				)}`,
			);
		}
		const categoryId = createCategoryResult.data.createActionItemCategory.id;

		// Try to delete the category as regular user
		const deleteActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: {
					authorization: `bearer ${userToken}`,
				},
				variables: {
					input: {
						id: categoryId,
					},
				},
			},
		);

		expect(
			deleteActionItemCategoryResult.data.deleteActionItemCategory,
		).toEqual(null);
		expect(deleteActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
								message:
									"Only administrators can delete action item categories.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	test('results in "undefined" as the value of "errors" field and the deleted action item category as the value of "data.deleteActionItemCategory" field if successful.', async () => {
		// Sign in as administrator
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			!administratorUserSignInResult.data?.signIn?.authenticationToken ||
			!administratorUserSignInResult.data?.signIn?.user?.id
		) {
			throw new Error("Administrator sign in failed");
		}
		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;
		const adminId = administratorUserSignInResult.data.signIn.user.id;

		// Create an organization
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

		if (!createOrganizationResult.data?.createOrganization?.id) {
			throw new Error("Organization creation failed");
		}
		const organizationId = createOrganizationResult.data.createOrganization.id;

		// Make admin an administrator of the organization
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

		if (!createMembershipResult.data?.createOrganizationMembership) {
			throw new Error("Membership creation failed");
		}

		// Create an action item category
		const createCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
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

		if (!createCategoryResult.data?.createActionItemCategory?.id) {
			throw new Error("Category creation failed");
		}
		const categoryId = createCategoryResult.data.createActionItemCategory.id;

		// Delete the category
		const deleteActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
					},
				},
			},
		);

		expect(deleteActionItemCategoryResult.errors).toBeUndefined();
		expect(
			deleteActionItemCategoryResult.data.deleteActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Test Category",
				organizationId: organizationId,
				isDisabled: false,
				createdAt: expect.any(String),
				updatedAt: null,
			}),
		);
	});
});

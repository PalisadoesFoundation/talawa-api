import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_updateActionItemCategory,
	Query_currentUser,
} from "../documentNodes";

describe("Mutation field updateActionItemCategory", () => {
	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateActionItemCategory" field if the client triggering the graphql operation is not authenticated.', async () => {
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Category",
					},
				},
			},
		);

		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(null);
		expect(updateActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.updateActionItemCategory" field if no action item category exists with ID equal to the value of argument "input.id".', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Category",
					},
				},
			},
		);

		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(null);
		expect(updateActionItemCategoryResult.errors).toEqual(
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

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.updateActionItemCategory" field if the client triggering the graphql operation is not an administrator of the organization.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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

		if (!createUserResult.data?.createUser?.authenticationToken) {
			throw new Error("User creation failed - no auth token");
		}
		if (!createUserResult.data?.createUser?.user?.id) {
			throw new Error("User creation failed - no user id");
		}
		const userToken = createUserResult.data.createUser.authenticationToken;
		const userId = createUserResult.data.createUser.user.id;

		// Create an organization as admin
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

		if (!createAdminMembershipResult.data?.createOrganizationMembership) {
			throw new Error("Admin membership creation failed");
		}

		// Create action item category as admin
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

		// Try to update the category as regular user
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${userToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						name: "Updated Category",
					},
				},
			},
		);

		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(null);
		expect(updateActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
								message:
									"Only administrators can update action item categories.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	test('results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.updateActionItemCategory" field if a category with the new name already exists in the same organization.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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

		// Create first action item category
		const createFirstCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: "First Category",
						organizationId: organizationId,
						isDisabled: false,
					},
				},
			},
		);

		if (!createFirstCategoryResult.data?.createActionItemCategory?.id) {
			throw new Error("First category creation failed");
		}

		// Create second action item category
		const createSecondCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: "Second Category",
						organizationId: organizationId,
						isDisabled: false,
					},
				},
			},
		);

		if (!createSecondCategoryResult.data?.createActionItemCategory?.id) {
			throw new Error("Second category creation failed");
		}
		const secondCategoryId =
			createSecondCategoryResult.data.createActionItemCategory.id;

		// Try to update second category to have the same name as first category
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: secondCategoryId,
						name: "First Category", // This name already exists
					},
				},
			},
		);

		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(null);
		expect(updateActionItemCategoryResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "name"],
								message:
									"A category with this name already exists in this organization.",
							}),
						]),
					}),
				}),
			]),
		);
	});

	test('results in "undefined" as the value of "errors" field and the updated action item category as the value of "data.updateActionItemCategory" field if successful when updating name only.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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
						name: "Original Category",
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

		// Update the category name
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						name: "Updated Category Name",
					},
				},
			},
		);

		expect(updateActionItemCategoryResult.errors).toBeUndefined();
		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Updated Category Name",
				description: null,
				isDisabled: false,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
				creator: expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			}),
		);
	});

	test('results in "undefined" as the value of "errors" field and the updated action item category as the value of "data.updateActionItemCategory" field if successful when updating description only.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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

		// Create an action item category with initial description
		const createCategoryResult = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: "Test Category",
						description: "Original description",
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

		// Update the category description
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						description: "Updated description for this category",
					},
				},
			},
		);

		expect(updateActionItemCategoryResult.errors).toBeUndefined();
		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Test Category",
				description: "Updated description for this category",
				isDisabled: false,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
				creator: expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			}),
		);
	});

	test('results in "undefined" as the value of "errors" field and the updated action item category as the value of "data.updateActionItemCategory" field if successful when updating isDisabled only.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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

		// Create an action item category (enabled by default)
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

		// Update the category to disable it
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						isDisabled: true,
					},
				},
			},
		);

		expect(updateActionItemCategoryResult.errors).toBeUndefined();
		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Test Category",
				description: null,
				isDisabled: true,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
				creator: expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			}),
		);
	});

	test('results in "undefined" as the value of "errors" field and the updated action item category as the value of "data.updateActionItemCategory" field if successful when updating all fields.', async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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
						name: "Original Category",
						description: "Original description",
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

		// Update all fields of the category
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						name: "Completely Updated Category",
						description: "This is the new updated description",
						isDisabled: true,
					},
				},
			},
		);

		expect(updateActionItemCategoryResult.errors).toBeUndefined();
		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Completely Updated Category",
				description: "This is the new updated description",
				isDisabled: true,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
				creator: expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			}),
		);
	});

	test("allows updating category to the same name it already has without triggering duplicate name error.", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

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
						name: "Same Name Category",
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

		// Update the category with the same name and a new description
		const updateActionItemCategoryResult = await mercuriusClient.mutate(
			Mutation_updateActionItemCategory,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: categoryId,
						name: "Same Name Category", // Same name as before
						description: "Updated description but same name",
					},
				},
			},
		);

		expect(updateActionItemCategoryResult.errors).toBeUndefined();
		expect(
			updateActionItemCategoryResult.data.updateActionItemCategory,
		).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Same Name Category",
				description: "Updated description but same name",
				isDisabled: false,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
				creator: expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			}),
		);
	});
});

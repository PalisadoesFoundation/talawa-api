import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteActionItemCategory,
	Query_currentUser,
} from "../documentNodes";

// Helper function to create event and volunteer
async function createEventAndVolunteer(
	organizationId: string,
	userId: string,
	adminToken: string,
): Promise<string> {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: "Test Event",
				description: "Test event for action items",
				organizationId: organizationId,
				startAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
				endAt: new Date(Date.now() + 90000000).toISOString(), // 1 day + 1 hour from now
				isPublic: true,
				isRegisterable: true,
				location: "Test Location",
			},
		},
	});
	assertToBeNonNullish(eventResult.data?.createEvent?.id);
	const eventId = eventResult.data.createEvent.id;

	// Create a volunteer for the event
	const volunteerResult = await mercuriusClient.mutate(
		Mutation_createEventVolunteer,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					eventId: eventId,
					userId: userId,
				},
			},
		},
	);
	assertToBeNonNullish(volunteerResult.data?.createEventVolunteer?.id);
	return volunteerResult.data.createEventVolunteer.id;
}

suite("Mutation field deleteActionItemCategory", () => {
	test('results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteActionItemCategory" field if the client triggering the graphql operation is not authenticated.', async () => {
		const result = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				variables: { input: { id: faker.string.uuid() } },
			},
		);

		expect(result.data.deleteActionItemCategory).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test('results in a graphql error with "arguments_associated_resources_not_found" extensions code if no category exists with the given id.', async () => {
		const { accessToken: token } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(token);

		const result = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: faker.string.uuid() } },
			},
		);

		expect(result.data.deleteActionItemCategory).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({ argumentPath: ["input", "id"] }),
						]),
					}),
				}),
			]),
		);
	});

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" if the category has associated action items.', async () => {
		// Setup: Admin, Org, Membership, Category, ActionItem
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

		// Create org
		const orgName = `Test Org ${faker.string.ulid()}`;
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { name: orgName } },
		});
		assertToBeNonNullish(orgRes.data.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;

		// Membership
		const memRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: adminId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(memRes.data.createOrganizationMembership);

		// Category
		const catRes = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Category",
						organizationId: orgId,
						isDisabled: false,
					},
				},
			},
		);
		assertToBeNonNullish(catRes.data.createActionItemCategory?.id);
		const categoryId = catRes.data.createActionItemCategory.id;

		// Create event and volunteer
		const volunteerId = await createEventAndVolunteer(
			orgId,
			adminId,
			adminToken,
		);

		// ActionItem (using a safe minimal mutation)
		const createActionItemResult = await mercuriusClient.mutate(
			/* GraphQL */ `
        mutation CreateActionItem($input: CreateActionItemInput!) {
          createActionItem(input: $input) {
            id
          }
        }
      `,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						categoryId,
						organizationId: orgId,
						volunteerId: volunteerId,
					},
				},
			},
		);
		assertToBeNonNullish(createActionItemResult.data.createActionItem?.id);

		// Try to delete category
		const result = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: categoryId } },
			},
		);

		expect(result.data.deleteActionItemCategory).toEqual(null);
		expect(result.errors).toEqual(
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

	test('results in a graphql error with "forbidden_action_on_arguments_associated_resources" if the user is not an administrator.', async () => {
		// Setup: Admin, Org, User, Reg Membership, Category
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

		// New user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
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
		assertToBeNonNullish(createUserResult.data.createUser?.authenticationToken);
		assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
		const userToken = createUserResult.data.createUser.authenticationToken;
		const userId = createUserResult.data.createUser.user.id;

		// Org
		const orgName = `Test Org ${faker.string.ulid()}`;
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { name: orgName } },
		});
		assertToBeNonNullish(orgRes.data.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;

		// Add user as regular member
		const memRes = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { memberId: userId, organizationId: orgId, role: "regular" },
				},
			},
		);
		assertToBeNonNullish(memRes.data.createOrganizationMembership);

		// Admin as admin
		const createAdminMem = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: adminId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(createAdminMem.data.createOrganizationMembership);

		// Category
		const catRes = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Category",
						organizationId: orgId,
						isDisabled: false,
					},
				},
			},
		);
		assertToBeNonNullish(catRes.data.createActionItemCategory?.id);
		const categoryId = catRes.data.createActionItemCategory.id;

		// Try to delete as regular user
		const result = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: categoryId } },
			},
		);

		expect(result.data.deleteActionItemCategory).toEqual(null);
		expect(result.errors).toEqual(
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
		// Setup as before...
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminId = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(adminId);

		// Org
		const orgName = `Test Org ${faker.string.ulid()}`;
		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { name: orgName } },
		});
		assertToBeNonNullish(orgRes.data.createOrganization?.id);
		const orgId = orgRes.data.createOrganization.id;
		const orgNameReturned = orgRes.data.createOrganization.name;

		// Admin as admin
		const createAdminMem = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: adminId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(createAdminMem.data.createOrganizationMembership);

		// Category
		const catRes = await mercuriusClient.mutate(
			Mutation_createActionItemCategory,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Category",
						organizationId: orgId,
						isDisabled: false,
					},
				},
			},
		);
		assertToBeNonNullish(catRes.data.createActionItemCategory?.id);
		const categoryId = catRes.data.createActionItemCategory.id;

		// Delete the category
		const result = await mercuriusClient.mutate(
			Mutation_deleteActionItemCategory,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: categoryId } },
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data.deleteActionItemCategory).toEqual(
			expect.objectContaining({
				id: categoryId,
				name: "Test Category",
				description: null,
				isDisabled: false,
				createdAt: expect.any(String),
				organization: expect.objectContaining({
					id: orgId,
					name: orgNameReturned,
				}),
				creator: expect.objectContaining({
					id: adminId,
					name: expect.any(String),
				}),
			}),
		);
	});
});

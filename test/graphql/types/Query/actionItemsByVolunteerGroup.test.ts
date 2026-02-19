import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteerGroup,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_actionItemsByVolunteerGroup,
	Query_currentUser,
} from "../documentNodes";

const SUITE_TIMEOUT = 30_000;

let globalAuth: { authToken: string; userId: string };

async function globalSignInAndGetToken() {
	const { accessToken: authToken } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(authToken);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${authToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createUserAndGetToken(userDetails = {}) {
	const defaultUser = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role: "regular" as const,
		isEmailAddressVerified: false,
	};
	const input = { ...defaultUser, ...userDetails };

	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
	const userId = createUserResult.data.createUser.user.id;

	const response = await server.inject({
		method: "POST",
		url: "/auth/signin",
		payload: { email: input.emailAddress, password: input.password },
	});
	const cookie = response.cookies.find(
		(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
	);
	assertToBeNonNullish(cookie?.value);
	const authToken = cookie.value;

	return { authToken, userId };
}

async function createOrganizationAndGetId(): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				name: uniqueName,
				countryCode: "us",
			},
		},
	});

	// Debug logging to understand what's happening
	if (result.errors) {
		console.error("Organization creation errors:", result.errors);
		throw new Error(
			`Failed to create organization: ${JSON.stringify(result.errors)}`,
		);
	}

	if (!result.data?.createOrganization) {
		console.error("No createOrganization data returned:", result.data);
		throw new Error("No createOrganization data returned");
	}

	const orgId = result.data.createOrganization.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function createActionItemCategory(
	organizationId: string,
): Promise<string> {
	// First ensure the admin user is a member of the organization
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				organizationId,
				memberId: globalAuth.userId,
				role: "administrator",
			},
		},
	});

	const result = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					name: `Test Category ${faker.string.uuid()}`,
					organizationId: organizationId,
					isDisabled: false,
				},
			},
		},
	);
	const categoryId = result.data?.createActionItemCategory?.id;
	assertToBeNonNullish(categoryId);
	return categoryId;
}

async function createEventAndVolunteerGroup(
	organizationId: string,
	leaderId: string,
	_authToken: string,
): Promise<{ eventId: string; volunteerGroupId: string }> {
	// Ensure admin user has organization membership for event creation (ignore errors if already exists)
	try {
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					memberId: globalAuth.userId,
					role: "administrator",
				},
			},
		});
	} catch (_error) {
		console.error(_error);
	}

	// Ensure leader has organization membership for volunteer group creation (ignore errors if already exists)
	try {
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					memberId: leaderId,
					role: "administrator", // Make leader an administrator
				},
			},
		});
	} catch (_error) {
		console.error(_error);
	}

	// Create an event first using admin token (events typically require admin permissions)
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				name: "Test Event",
				description: "Test event for volunteer groups",
				organizationId: organizationId,
				startAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
				endAt: new Date(Date.now() + 90000000).toISOString(), // 1 day + 1 hour from now
				isPublic: true,
				isRegisterable: true,
				location: "Test Location",
			},
		},
	});

	if (eventResult.errors) {
		console.error("Event creation errors:", eventResult.errors);
		throw new Error(
			`Failed to create event: ${JSON.stringify(eventResult.errors)}`,
		);
	}

	if (!eventResult.data?.createEvent) {
		console.error("No createEvent data returned:", eventResult.data);
		throw new Error("No createEvent data returned");
	}

	const eventId = eventResult.data.createEvent.id;
	assertToBeNonNullish(eventId);

	// Create a volunteer group for the event using admin token for consistency
	const volunteerGroupResult = await mercuriusClient.mutate(
		Mutation_createEventVolunteerGroup,
		{
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				data: {
					eventId: eventId,
					name: "Test Volunteer Group",
					leaderId: leaderId,
				},
			},
		},
	);

	if (volunteerGroupResult.errors) {
		console.error(
			"Volunteer group creation errors:",
			volunteerGroupResult.errors,
		);
		throw new Error(
			`Failed to create volunteer group: ${JSON.stringify(
				volunteerGroupResult.errors,
			)}`,
		);
	}

	if (!volunteerGroupResult.data?.createEventVolunteerGroup) {
		console.error(
			"No createEventVolunteerGroup data returned:",
			volunteerGroupResult.data,
		);
		throw new Error("No createEventVolunteerGroup data returned");
	}

	const volunteerGroupId =
		volunteerGroupResult.data.createEventVolunteerGroup.id;
	assertToBeNonNullish(volunteerGroupId);

	return { eventId, volunteerGroupId };
}

async function createActionItemForVolunteerGroup(
	organizationId: string,
	categoryId: string,
	volunteerGroupId: string,
	_authToken: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createActionItem, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				categoryId: categoryId,
				volunteerGroupId: volunteerGroupId,
				organizationId: organizationId,
				assignedAt: "2025-04-01T00:00:00Z",
			},
		},
	});

	if (result.errors) {
		console.error("Action item creation errors:", result.errors);
		throw new Error(
			`Failed to create action item: ${JSON.stringify(result.errors)}`,
		);
	}

	if (!result.data?.createActionItem) {
		console.error("No createActionItem data returned:", result.data);
		throw new Error("No createActionItem data returned");
	}

	const actionItemId = result.data.createActionItem.id;
	assertToBeNonNullish(actionItemId);
	return actionItemId;
}

beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
}, SUITE_TIMEOUT);

suite("Query field actionItemsByVolunteerGroup", () => {
	beforeAll(async () => {
		globalAuth = await globalSignInAndGetToken();
	}, SUITE_TIMEOUT);

	// 1. Unauthenticated: user not logged in.
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					variables: {
						input: {
							volunteerGroupId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.actionItemsByVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	// 2. Invalid arguments.
	suite("when the arguments are invalid", () => {
		test("should return an error with invalid_arguments code for invalid volunteerGroupId", async () => {
			const { authToken } = await createUserAndGetToken();

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							volunteerGroupId: "not-a-uuid",
						},
					},
				},
			);

			expect(result.data?.actionItemsByVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code for invalid organizationId", async () => {
			const { authToken } = await createUserAndGetToken();

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							volunteerGroupId: faker.string.uuid(),
							organizationId: "not-a-uuid",
						},
					},
				},
			);

			expect(result.data?.actionItemsByVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
					}),
				]),
			);
		});
	});

	// 3. Volunteer group does not exist.
	suite("when the specified volunteer group does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const { authToken } = await createUserAndGetToken();

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							volunteerGroupId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.actionItemsByVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "volunteerGroupId"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	// 4. Authorization: user is not the group leader or administrator.
	suite("when the user is not authorized to view group action items", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources code for non-leader regular user", async () => {
			// Create group leader and volunteer group
			const { authToken: leaderAuthToken, userId: leaderId } =
				await createUserAndGetToken();
			const orgId = await createOrganizationAndGetId();

			const { volunteerGroupId } = await createEventAndVolunteerGroup(
				orgId,
				leaderId,
				leaderAuthToken,
			);

			// Create a different user (not the leader)
			const { authToken: regularUserToken } = await createUserAndGetToken();

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							volunteerGroupId: volunteerGroupId,
						},
					},
				},
			);

			expect(result.data?.actionItemsByVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "volunteerGroupId"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	// 5. Successful query by group leader.
	suite("when the group leader queries action items", () => {
		test("should return action items assigned to the volunteer group", async () => {
			const { authToken: leaderAuthToken, userId: leaderId } =
				await createUserAndGetToken();
			const orgId = await createOrganizationAndGetId();

			const categoryId = await createActionItemCategory(orgId);
			const { volunteerGroupId } = await createEventAndVolunteerGroup(
				orgId,
				leaderId,
				leaderAuthToken,
			);

			// Create action items for the volunteer group
			const actionItem1Id = await createActionItemForVolunteerGroup(
				orgId,
				categoryId,
				volunteerGroupId,
				leaderAuthToken,
			);
			const actionItem2Id = await createActionItemForVolunteerGroup(
				orgId,
				categoryId,
				volunteerGroupId,
				leaderAuthToken,
			);

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${leaderAuthToken}` },
					variables: {
						input: {
							volunteerGroupId: volunteerGroupId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByVolunteerGroup).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: actionItem1Id,
						volunteerGroup: expect.objectContaining({
							id: volunteerGroupId,
						}),
					}),
					expect.objectContaining({
						id: actionItem2Id,
						volunteerGroup: expect.objectContaining({
							id: volunteerGroupId,
						}),
					}),
				]),
			);
			expect(result.data?.actionItemsByVolunteerGroup).toHaveLength(2);
		});

		test("should return action items filtered by organization when organizationId is provided", async () => {
			const { authToken: leaderAuthToken, userId: leaderId } =
				await createUserAndGetToken();
			const orgId1 = await createOrganizationAndGetId();
			const orgId2 = await createOrganizationAndGetId();

			// Create organization memberships
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${leaderAuthToken}` },
				variables: {
					input: {
						organizationId: orgId1,
						memberId: leaderId,
						role: "administrator",
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${leaderAuthToken}` },
				variables: {
					input: {
						organizationId: orgId2,
						memberId: leaderId,
						role: "administrator",
					},
				},
			});

			const categoryId1 = await createActionItemCategory(orgId1);
			const categoryId2 = await createActionItemCategory(orgId2);
			const { volunteerGroupId } = await createEventAndVolunteerGroup(
				orgId1,
				leaderId,
				leaderAuthToken,
			);

			// Create action items for different organizations
			const actionItem1Id = await createActionItemForVolunteerGroup(
				orgId1,
				categoryId1,
				volunteerGroupId,
				leaderAuthToken,
			);
			const actionItem2Id = await createActionItemForVolunteerGroup(
				orgId2,
				categoryId2,
				volunteerGroupId,
				leaderAuthToken,
			);

			// Query with organization filter
			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${leaderAuthToken}` },
					variables: {
						input: {
							volunteerGroupId: volunteerGroupId,
							organizationId: orgId1,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByVolunteerGroup).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: actionItem1Id,
						organization: expect.objectContaining({
							id: orgId1,
						}),
						volunteerGroup: expect.objectContaining({
							id: volunteerGroupId,
						}),
					}),
				]),
			);
			expect(result.data?.actionItemsByVolunteerGroup).toHaveLength(1);
			expect(
				result.data?.actionItemsByVolunteerGroup?.some(
					(
						item: NonNullable<
							typeof result.data.actionItemsByVolunteerGroup
						>[number],
					) => item?.id === actionItem2Id,
				),
			).toBe(false);
		});

		test("should return empty array when no action items exist for the volunteer group", async () => {
			const { authToken: leaderAuthToken, userId: leaderId } =
				await createUserAndGetToken();
			const orgId = await createOrganizationAndGetId();

			const { volunteerGroupId } = await createEventAndVolunteerGroup(
				orgId,
				leaderId,
				leaderAuthToken,
			);

			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${leaderAuthToken}` },
					variables: {
						input: {
							volunteerGroupId: volunteerGroupId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByVolunteerGroup).toEqual([]);
		});
	});

	// 6. Successful query by administrator.
	suite("when an administrator queries action items", () => {
		test("should return action items assigned to the volunteer group", async () => {
			// Create a regular user as group leader
			const { userId: leaderId } = await createUserAndGetToken();
			const { authToken: adminAuthToken } = await createUserAndGetToken({
				role: "administrator",
			});
			const orgId = await createOrganizationAndGetId();

			const categoryId = await createActionItemCategory(orgId);
			const { volunteerGroupId } = await createEventAndVolunteerGroup(
				orgId,
				leaderId,
				adminAuthToken,
			);

			// Create action items for the volunteer group
			const actionItemId = await createActionItemForVolunteerGroup(
				orgId,
				categoryId,
				volunteerGroupId,
				adminAuthToken,
			);

			// Administrator should be able to query any group's action items
			const result = await mercuriusClient.query(
				Query_actionItemsByVolunteerGroup,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							volunteerGroupId: volunteerGroupId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByVolunteerGroup).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: actionItemId,
						volunteerGroup: expect.objectContaining({
							id: volunteerGroupId,
						}),
					}),
				]),
			);
			expect(result.data?.actionItemsByVolunteerGroup).toHaveLength(1);
		});
	});
});

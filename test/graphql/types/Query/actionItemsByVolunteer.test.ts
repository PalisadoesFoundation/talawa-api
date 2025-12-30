import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_actionItemsByVolunteer,
	Query_signIn,
} from "../documentNodes";

const SUITE_TIMEOUT = 30_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_PLUS_ONE_HOUR_MS = 25 * 60 * 60 * 1000;

let globalAuth: { authToken: string; userId: string };

async function globalSignInAndGetToken() {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ?? "",
				password: process.env.API_ADMINISTRATOR_USER_PASSWORD ?? "",
			},
		},
	});
	assertToBeNonNullish(result.data?.signIn);
	const authToken = result.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = result.data.signIn.user?.id;
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
	const authToken = createUserResult.data?.createUser?.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createOrganizationAndGetId(authToken: string): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				description: "Organization for testing",
				countryCode: "us",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				organizationId,
				memberId,
				role,
			},
		},
	});
}

async function createActionItemCategory(
	organizationId: string,
): Promise<string> {
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

beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

suite("Query: actionItemsByVolunteer", () => {
	let regularUser: { authToken: string; userId: string };
	let organizationId: string;
	let nonMemberUser: { authToken: string; userId: string };
	let categoryId: string;
	let eventId: string;
	let regularUserVolunteerId: string;
	let nonMemberUserVolunteerId: string;

	beforeEach(async () => {
		regularUser = await createUserAndGetToken();
		nonMemberUser = await createUserAndGetToken();
		organizationId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(organizationId, regularUser.userId, "regular");
		await addMembership(organizationId, globalAuth.userId, "administrator");
		categoryId = await createActionItemCategory(organizationId);

		// Create an event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					name: "Test Event",
					description: "Test event for action items",
					startAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
					endAt: new Date(Date.now() + ONE_DAY_PLUS_ONE_HOUR_MS).toISOString(),
					location: "Test Location",
				},
			},
		});
		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		// Create volunteers
		const regularVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						eventId,
						userId: regularUser.userId,
					},
				},
			},
		);
		assertToBeNonNullish(regularVolunteerResult.data?.createEventVolunteer);
		assertToBeNonNullish(regularVolunteerResult.data.createEventVolunteer.id);
		regularUserVolunteerId =
			regularVolunteerResult.data.createEventVolunteer.id;
		const nonMemberVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						eventId,
						userId: nonMemberUser.userId,
					},
				},
			},
		);
		assertToBeNonNullish(nonMemberVolunteerResult.data?.createEventVolunteer);
		assertToBeNonNullish(nonMemberVolunteerResult.data.createEventVolunteer.id);
		nonMemberUserVolunteerId =
			nonMemberVolunteerResult.data.createEventVolunteer.id;
	});

	test("should return an unauthenticated error if not signed in", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
			variables: {
				input: {
					volunteerId: regularUserVolunteerId,
				},
			},
		});

		expect(result.data?.actionItemsByVolunteer).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test(
		"should return an empty array if no action items exist for the user",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						volunteerId: regularUserVolunteerId,
					},
				},
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByVolunteer).toEqual([]);
		},
		SUITE_TIMEOUT,
	);

	test("should return all action items assigned to the user", async () => {
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					volunteerId: regularUserVolunteerId,
					categoryId,
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					volunteerId: regularUserVolunteerId,
					categoryId,
				},
			},
		});

		const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					volunteerId: regularUserVolunteerId,
				},
			},
		});

		expect(result.data?.actionItemsByVolunteer).toBeInstanceOf(Array);
		expect(result.data?.actionItemsByVolunteer?.length).toBe(2);
	});

	test(
		"should throw unauthorized error if regular user tries to view another user's action items",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						volunteerId: nonMemberUserVolunteerId,
					},
				},
			});

			expect(result.data?.actionItemsByVolunteer).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	test("should throw invalid_arguments error when input validation fails", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					volunteerId: "invalid-uuid", // Invalid UUID format
				},
			},
		});
		expect(result.data?.actionItemsByVolunteer).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: expect.stringContaining("Invalid"),
				}),
			]),
		);
	});

	test("should throw unauthenticated error when currentUser is undefined", async () => {
		// Create a test user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${globalAuth.authToken}`,
			},
			variables: {
				input: {
					emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
					isEmailAddressVerified: false,
					name: "Test User",
					password: "password",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.authenticationToken);
		assertToBeNonNullish(createUserResult.data.createUser.user?.id);

		// Delete the user to simulate the scenario where currentUser lookup fails
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${globalAuth.authToken}`,
			},
			variables: {
				input: {
					id: createUserResult.data.createUser.user.id,
				},
			},
		});

		// Try to use the authentication token of the deleted user
		const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
			headers: {
				authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
			},
			variables: {
				input: {
					volunteerId: regularUserVolunteerId,
				},
			},
		});
		expect(result.data?.actionItemsByVolunteer).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["actionItemsByVolunteer"],
				}),
			]),
		);
	});

	test("should throw arguments_associated_resources_not_found error when target volunteer does not exist", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByVolunteer, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					volunteerId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID but non-existent volunteer
				},
			},
		});
		expect(result.data?.actionItemsByVolunteer).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: ["input", "volunteerId"],
				}),
			]),
		);
		expect(result.errors?.[0]?.message).toBe(
			"The specified volunteer does not exist.",
		);
	});

	test("should filter action items by organization when organizationId is provided", async () => {
		// Create another organization
		const otherOrgId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(otherOrgId, regularUser.userId, "regular");
		await addMembership(otherOrgId, globalAuth.userId, "administrator");

		// Create an event in the other organization (not needed for this test but keeping structure)
		const otherEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						organizationId: otherOrgId,
						name: "Other Test Event",
						description: "Test event for action items in other org",
						startAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						endAt: new Date(
							Date.now() + ONE_DAY_PLUS_ONE_HOUR_MS,
						).toISOString(),
						location: "Other Test Location",
					},
				},
			},
		);
		assertToBeNonNullish(otherEventResult.data?.createEvent);
		const otherEventId = otherEventResult.data.createEvent.id;

		// Create volunteer in other organization for the same user (not used in this test)
		const otherVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						eventId: otherEventId,
						userId: regularUser.userId, // Same user as regularUserVolunteerId is for
					},
				},
			},
		);
		assertToBeNonNullish(otherVolunteerResult.data?.createEventVolunteer);

		// Create action items in both organizations
		// First action item in the first organization
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					volunteerId: regularUserVolunteerId,
					categoryId,
				},
			},
		});

		// Second action item in the first organization (same volunteer)
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					volunteerId: regularUserVolunteerId,
					categoryId,
				},
			},
		});

		// Query without organization filter - should return all items for this volunteer
		const resultAll = await mercuriusClient.query(
			Query_actionItemsByVolunteer,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						volunteerId: regularUserVolunteerId,
					},
				},
			},
		);

		expect(resultAll.data?.actionItemsByVolunteer).toHaveLength(2);

		// Query with organization filter - should return items from that organization for this volunteer
		const resultFiltered = await mercuriusClient.query(
			Query_actionItemsByVolunteer,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						volunteerId: regularUserVolunteerId,
						organizationId,
					},
				},
			},
		);
		expect(resultFiltered.data?.actionItemsByVolunteer).toHaveLength(2);
		expect(
			resultFiltered.data?.actionItemsByVolunteer?.[0]?.organization?.id,
		).toBe(organizationId);
	});
});

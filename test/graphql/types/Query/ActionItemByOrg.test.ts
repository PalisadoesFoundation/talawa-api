import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
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
	Query_actionItemsByOrganization,
	Query_currentUser,
} from "../documentNodes";

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

async function createEventAndVolunteer(organizationId: string) {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				organizationId,
				name: "Test Event",
				description: "Test event for action items",
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
				location: "Test Location",
			},
		},
	});
	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	// Create a volunteer
	const volunteerResult = await mercuriusClient.mutate(
		Mutation_createEventVolunteer,
		{
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					eventId,
					userId: globalAuth.userId,
				},
			},
		},
	);
	assertToBeNonNullish(volunteerResult.data?.createEventVolunteer);
	return {
		eventId,
		volunteerId: volunteerResult.data.createEventVolunteer.id,
	};
}

beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

suite("Query: actionItemsByOrganization", () => {
	let regularUser: { authToken: string; userId: string };
	let organizationId: string;
	let nonMemberUser: { authToken: string; userId: string };
	let categoryId: string;
	let volunteerId: string;

	beforeEach(async () => {
		regularUser = await createUserAndGetToken();
		nonMemberUser = await createUserAndGetToken();
		organizationId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(organizationId, regularUser.userId, "regular");
		await addMembership(organizationId, globalAuth.userId, "administrator");
		categoryId = await createActionItemCategory(organizationId);

		// Create event and volunteer for action items
		const { volunteerId: createdVolunteerId } =
			await createEventAndVolunteer(organizationId);
		assertToBeNonNullish(createdVolunteerId);
		volunteerId = createdVolunteerId;
	});

	test("should return an unauthenticated error if not signed in", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("should return an empty array if no action items exist", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.actionItemsByOrganization).toEqual([]);
	});

	test("should return all action items for the organization", async () => {
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					categoryId,
					volunteerId,
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					categoryId,
					volunteerId,
				},
			},
		});

		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeInstanceOf(Array);
		expect(result.data?.actionItemsByOrganization?.length).toBe(2);
	});

	test("should throw unauthorized error if user is not a member of the organization", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${nonMemberUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("should throw invalid_arguments error when input validation fails", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId: "invalid-uuid", // Invalid UUID format
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
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

	test("should throw unauthenticated error when currentUser is undefined in resolver", async () => {
		const { authToken: tempAuthToken, userId: tempUserId } =
			await createUserAndGetToken();

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					id: tempUserId,
				},
			},
		});

		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${tempAuthToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw arguments_associated_resources_not_found error when organization does not exist", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID but non-existent org
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: ["input", "organizationId"],
				}),
			]),
		);
	});
});

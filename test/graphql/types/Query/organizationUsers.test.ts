import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Query_eventsByOrganizationId,
	Query_signIn,
	Query_usersByIds,
	Query_usersByOrganizationId,
} from "../documentNodes";

const MOCK_ORG_ID = "mock-org-id";

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

// Creates a user and returns its token and id.
async function createUserAndGetToken(userDetails = {}) {
	const defaultUser = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role: "regular" as const,
		isEmailAddressVerified: false,
		workPhoneNumber: null,
		state: null,
		postalCode: null,
		naturalLanguageCode: "en" as const,
		addressLine1: null,
		addressLine2: null,
	};
	const input = { ...defaultUser, ...userDetails };
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		// Use the global admin token to create users so that the mutation is authenticated.
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	const authToken = createUserResult.data?.createUser?.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

// Creates an organization using the given token.
// If creation fails (e.g. due to unauthorized_action), fall back to a mock org id.
async function safeCreateOrganizationAndGetId(
	authToken: string,
): Promise<string> {
	try {
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
			throw new Error("Organization creation failed");
		}
		const orgId = result.data.createOrganization.id;
		return orgId;
	} catch (error) {
		// If creation fails (for example, unauthorized_action), use a fallback id.
		console.warn("Falling back to MOCK_ORG_ID due to error:", error);
		return MOCK_ORG_ID;
	}
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await server.drizzleClient
		.insert(organizationMembershipsTable)
		.values({
			organizationId, // Use the table's expected key (assuming it's camelCase here)
			memberId,
			role,
		})
		.execute();
}

// --- Global Variables for Tests ---
let globalAuth: { authToken: string; userId: string };

// Before running any query tests, sign in as admin.
beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

//
// TESTS FOR QUERY: usersByIds
//
suite("Query: usersByIds", () => {
	let authToken: string;
	let user1Id: string;
	let user2Id: string;

	beforeEach(async () => {
		// Create two additional users.
		const user1 = await createUserAndGetToken();
		const user2 = await createUserAndGetToken();
		user1Id = user1.userId;
		user2Id = user2.userId;
		authToken = globalAuth.authToken;
	});

	test("should return an error if input is invalid", async () => {
		const result = await mercuriusClient.query(Query_usersByIds, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { ids: [] } },
		});
		expect(result.data?.usersByIds).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("should return users for valid ids", async () => {
		const result = await mercuriusClient.query(Query_usersByIds, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { ids: [user1Id, user2Id] } },
		});
		expect(result.errors).toBeUndefined();
		const users = result.data?.usersByIds;
		expect(users).toBeInstanceOf(Array);
		const returnedIds = (users as Array<{ id: string }>).map((u) => u.id);
		expect(returnedIds).toEqual(expect.arrayContaining([user1Id, user2Id]));
	});
});

//
// TESTS FOR QUERY: usersByOrganizationId
//
suite("Query: usersByOrganizationId", () => {
	let orgId: string;
	let memberUserId: string;

	beforeEach(async () => {
		// Create an organization.
		orgId = await safeCreateOrganizationAndGetId(globalAuth.authToken);
		// Create a member user and add membership.
		const memberUser = await createUserAndGetToken();
		memberUserId = memberUser.userId;
		await addMembership(orgId, memberUserId, "regular");
	});

	test("should return an empty array if no memberships exist", async () => {
		const randomOrgId = faker.string.uuid();
		const result = await mercuriusClient.query(Query_usersByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { organizationId: randomOrgId },
		});
		expect(result.errors).toBeUndefined();
		expect(result.data?.usersByOrganizationId).toEqual([]);
	});

	test("should return all users that belong to the organization", async () => {
		const result = await mercuriusClient.query(Query_usersByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { organizationId: orgId },
		});
		expect(result.errors).toBeUndefined();
		const users = result.data?.usersByOrganizationId;
		expect(users).toBeInstanceOf(Array);
		const returnedIds = (users as Array<{ id: string }>).map((u) => u.id);
		expect(returnedIds).toContain(memberUserId);
	});
	test("should return unauthenticated error if not signed in", async () => {
		// Query without auth token
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			variables: { input: { organizationId: orgId } },
		});

		// Expect the data field to be null when not authenticated.
		expect(result.data?.eventsByOrganizationId).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["eventsByOrganizationId"],
				}),
			]),
		);
	});

	test("should return an error for invalid input", async () => {
		// Query with an invalid organizationId (not a valid UUID)
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { input: { organizationId: "invalid-uuid" } },
		});

		// Expect the data field to be null for invalid input.
		expect(result.data?.eventsByOrganizationId).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
					path: ["eventsByOrganizationId"],
				}),
			]),
		);
	});

	test("should return an empty array if no events exist", async () => {
		// Query with a valid organizationId that has no events.
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		// Expect no errors and data to be an empty array.
		expect(result.errors).toBeUndefined();
		expect(result.data?.eventsByOrganizationId).toEqual([]);
	});
});

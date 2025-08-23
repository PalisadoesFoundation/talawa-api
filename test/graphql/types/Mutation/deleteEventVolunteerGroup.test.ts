import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createEventVolunteerGroup,
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteEventVolunteerGroup,
	Query_signIn,
} from "../documentNodes";

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
		.onConflictDoNothing()
		.execute();
}

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

// Helper to create an event and return its id
async function createEventAndGetId(
	authToken: string,
	organizationId: string,
): Promise<string> {
	const eventName = `Test Event ${faker.string.uuid()}`;
	const startDate = new Date();
	const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Next day

	const result = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: eventName,
				description: "Event for testing volunteer groups",
				startAt: startDate.toISOString(),
				endAt: endDate.toISOString(),
				organizationId: organizationId,
			},
		},
	});

	const eventId = result.data?.createEvent?.id;
	assertToBeNonNullish(eventId);
	return eventId;
}

// Helper to create a volunteer group and return its id
async function createVolunteerGroupAndGetId(
	authToken: string,
	eventId: string,
	leaderId: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(
		Mutation_createEventVolunteerGroup,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					eventId: eventId,
					name: `Test Volunteer Group ${faker.string.uuid()}`,
					leaderId: leaderId,
					maxVolunteerCount: 10,
				},
			},
		},
	);

	const groupId = result.data?.createEventVolunteerGroup?.id;
	assertToBeNonNullish(groupId);
	return groupId;
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

// Create common test resources
const orgId = await createOrganizationAndGetId(authToken);
// Add admin user as organization member to allow event creation
await addMembership(orgId, adminUserId, "administrator");
const eventId = await createEventAndGetId(authToken, orgId);
const groupId = await createVolunteerGroupAndGetId(
	authToken,
	eventId,
	adminUserId,
);

suite("Mutation field deleteEventVolunteerGroup", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroup,
				{
					variables: {
						input: {
							id: groupId,
						},
					},
				},
			);
			expect(result.data.deleteEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when the specified volunteer group does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "groupId"],
								}),
							]),
						}),
						path: ["deleteEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when the user is not authorized", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources code", async () => {
			// Create a regular user
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: `regular${faker.string.ulid()}@example.com`,
							isEmailAddressVerified: true,
							name: "Regular User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(createUserResult.data?.createUser);
			assertToBeNonNullish(createUserResult.data.createUser.user);
			const regularUserToken =
				createUserResult.data.createUser.authenticationToken;
			const regularUserId = createUserResult.data.createUser.user.id;
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);

			// Add regular user to organization
			await addMembership(orgId, regularUserId, "regular");

			// Attempt to update volunteer group as regular user
			const result = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: groupId,
						},
					},
				},
			);

			expect(result.data?.deleteEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						path: ["deleteEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when invalid input arguments are provided", () => {
		test("should return an error with invalid_arguments code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: "kdksj",
						},
					},
				},
			);

			expect(result.data?.deleteEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
									message: expect.stringContaining("Invalid uuid"),
								}),
							]),
						}),
						path: ["deleteEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when volunteer group is updated successfully by org admin", () => {
		test("should return the updated volunteer group", async () => {
			// Add admin to organization as administrator
			await addMembership(orgId, adminUserId, "administrator");
			// Update volunteer group
			const result = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: groupId,
						},
					},
				},
			);

			expect(result.data?.deleteEventVolunteerGroup).not.toBeNull();
			expect(result.data?.deleteEventVolunteerGroup).toEqual(
				expect.objectContaining({
					id: groupId,
					maxVolunteerCount: 10,
				}),
			);
		});
	});
});

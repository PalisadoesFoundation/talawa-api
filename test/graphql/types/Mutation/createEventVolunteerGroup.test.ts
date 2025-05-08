//createEventVolunteeerGroup.test.ts
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
	Mutation_deleteUser,
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
		.execute();
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

async function createEventAndGetId(
	authToken: string,
	organizationId: string,
	creatorId: string,
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
const orgIdn = await createOrganizationAndGetId(authToken);
const eventIdn = await createEventAndGetId(authToken, orgIdn, adminUserId);

suite("Mutation field createEventVolunteerGroup", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					variables: {
						input: {
							eventId: faker.string.uuid(),
							name: `Test Volunteer Group ${faker.string.uuid()}`,
							leaderId: adminUserId,
							maxVolunteerCount: 10,
						},
					},
				},
			);
			expect(result.data.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when the specified event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for event", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							eventId: faker.string.uuid(), // non-existent event
							name: `Test Volunteer Group  ${faker.string.uuid()}`,
							leaderId: adminUserId,
							maxVolunteerCount: 10,
						},
					},
				},
			);
			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "eventId"],
								}),
							]),
						}),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when the user is not found", () => {
		test("should return an error with unauthenticated code", async () => {
			const tempUserEmail = `${faker.string.ulid()}@test.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							emailAddress: tempUserEmail,
							isEmailAddressVerified: false,
							name: "Regular User",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			const userSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: tempUserEmail,
						password: "password123",
					},
				},
			});

			assertToBeNonNullish(userSignInResult.data?.signIn);
			const userAuthToken = userSignInResult.data.signIn.authenticationToken;

			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: createUserResult.data.createUser?.user?.id || "",
					},
				},
			});

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${userAuthToken}` },
					variables: {
						input: {
							eventId: eventIdn,
							name: "Test Volunteer Group",
							leaderId: adminUserId,
							maxVolunteerCount: 10,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when the user is not authorized", () => {
		test("should return an error with unauthorized_action code", async () => {
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

			await addMembership(orgIdn, regularUserId, "regular");
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							eventId: eventIdn,
							name: `Test Volunteer Group  ${faker.string.uuid()}`,
							leaderId: regularUserId,
							maxVolunteerCount: 10,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("when volunteer group is created successfully by org admin", () => {
		test("should return a valid volunteer group", async () => {
			const createLeaderResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: `leader${faker.string.ulid()}@example.com`,
							isEmailAddressVerified: true,
							name: "Leader User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(createLeaderResult.data?.createUser);
			assertToBeNonNullish(createLeaderResult.data.createUser.user);
			const leaderId = createLeaderResult.data.createUser.user.id;
			assertToBeNonNullish(leaderId);

			// Add admin to organization
			await addMembership(orgIdn, adminUserId, "administrator");

			// Create volunteer group
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							eventId: eventIdn,
							name: `Admin Created Group ${faker.string.uuid()}`,
							leaderId: leaderId,
							maxVolunteerCount: 15,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).not.toBeNull();
			expect(result.data?.createEventVolunteerGroup).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: expect.any(String),
				}),
			);
		});
	});

	suite("when invalid input arguments are provided", () => {
		test("should return an error with invalid_arguments code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							eventId: eventIdn,
							name: `Group ${faker.string.uuid()}`,
							leaderId: adminUserId,
							maxVolunteerCount: -1,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "maxVolunteerCount"],
									message: "Must be greater than the 0",
								}),
							]),
						}),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});
});

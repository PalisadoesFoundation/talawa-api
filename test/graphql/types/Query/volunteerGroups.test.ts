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
	Query_getEventVolunteerGroups,
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
	name = `Test Volunteer Group ${faker.string.uuid()}`,
): Promise<string> {
	const result = await mercuriusClient.mutate(
		Mutation_createEventVolunteerGroup,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					eventId: eventId,
					name: name,
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

// Create multiple volunteer groups for testing
const groupName1 = `Test Group 1 ${faker.string.uuid()}`;
const groupName2 = `Test Group 2 ${faker.string.uuid()}`;
const groupId1 = await createVolunteerGroupAndGetId(
	authToken,
	eventId,
	adminUserId,
	groupName1,
);
const groupId2 = await createVolunteerGroupAndGetId(
	authToken,
	eventId,
	adminUserId,
	groupName2,
);

suite("Query field getEventVolunteerGroups", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					variables: {
						input: {
							eventId: eventId,
						},
					},
				},
			);

			expect(result.data.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite("when eventId is not provided", () => {
		test("should return an error with invalid_arguments code", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							eventId: "",
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toMatchObject([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "eventId"],
								message: "Invalid uuid",
							}),
						]),
					}),
					path: ["getEventVolunteerGroups"],
				}),
			]);
		});
	});

	suite("when the specified event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							eventId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
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
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite("when the user is not found", () => {
		test("should return an error with unauthenticated code", async () => {
			// Create and sign in as temporary user
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
							name: "Temporary User",
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

			// Delete the user to simulate user not found
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

			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: { authorization: `bearer ${userAuthToken}` },
					variables: {
						input: {
							eventId: eventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite("when user is not a member of the organization", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources code", async () => {
			// Create a user who is not a member of the organization
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: `nonmember${faker.string.ulid()}@example.com`,
							isEmailAddressVerified: true,
							name: "Non-Member User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(createUserResult.data?.createUser);
			assertToBeNonNullish(createUserResult.data.createUser.user);
			const nonMemberToken =
				createUserResult.data.createUser.authenticationToken;
			assertToBeNonNullish(nonMemberToken);

			// Try to get volunteer groups as non-member
			const result = await mercuriusClient.query(
				Query_getEventVolunteerGroups,
				{
					headers: { authorization: `bearer ${nonMemberToken}` },
					variables: {
						input: {
							eventId: eventId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroups).toBeNull();
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
						path: ["getEventVolunteerGroups"],
					}),
				]),
			);
		});
	});

	suite(
		"when volunteer groups are successfully retrieved by system admin",
		() => {
			test("should return all volunteer groups for the event", async () => {
				const result = await mercuriusClient.query(
					Query_getEventVolunteerGroups,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								eventId: eventId,
							},
						},
					},
				);

				expect(result.data?.getEventVolunteerGroups).not.toBeNull();
				expect(result.data?.getEventVolunteerGroups).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: groupId1,
							name: groupName1,
						}),
						expect.objectContaining({
							id: groupId2,
							name: groupName2,
						}),
					]),
				);
				expect(
					result.data?.getEventVolunteerGroups?.length,
				).toBeGreaterThanOrEqual(2);
			});
		},
	);

	suite(
		"when volunteer groups are successfully retrieved by organization member",
		() => {
			test("should return all volunteer groups for the event", async () => {
				// Create regular user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								emailAddress: `member${faker.string.ulid()}@example.com`,
								isEmailAddressVerified: true,
								name: "Member User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				assertToBeNonNullish(createUserResult.data?.createUser);
				assertToBeNonNullish(createUserResult.data.createUser.user);
				const memberToken =
					createUserResult.data.createUser.authenticationToken;
				const memberId = createUserResult.data.createUser.user.id;
				assertToBeNonNullish(memberToken);
				assertToBeNonNullish(memberId);

				// Add user to organization
				await addMembership(orgId, memberId, "regular");

				// Query volunteer groups as organization member
				const result = await mercuriusClient.query(
					Query_getEventVolunteerGroups,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								eventId: eventId,
							},
						},
					},
				);

				expect(result.data?.getEventVolunteerGroups).not.toBeNull();
				expect(result.data?.getEventVolunteerGroups).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: groupId1,
							name: groupName1,
						}),
						expect.objectContaining({
							id: groupId2,
							name: groupName2,
						}),
					]),
				);
				expect(
					result.data?.getEventVolunteerGroups?.length,
				).toBeGreaterThanOrEqual(2);
			});
		},
	);

	suite(
		"when volunteer groups are successfully retrieved by organization admin",
		() => {
			test("should return all volunteer groups for the event", async () => {
				// Create user who will be an org admin
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								emailAddress: `orgadmin${faker.string.ulid()}@example.com`,
								isEmailAddressVerified: true,
								name: "Org Admin User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				assertToBeNonNullish(createUserResult.data?.createUser);
				assertToBeNonNullish(createUserResult.data.createUser.user);
				const orgAdminToken =
					createUserResult.data.createUser.authenticationToken;
				const orgAdminId = createUserResult.data.createUser.user.id;
				assertToBeNonNullish(orgAdminToken);
				assertToBeNonNullish(orgAdminId);

				// Add user to organization as admin
				await addMembership(orgId, orgAdminId, "administrator");

				// Query volunteer groups as organization admin
				const result = await mercuriusClient.query(
					Query_getEventVolunteerGroups,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								eventId: eventId,
							},
						},
					},
				);

				expect(result.data?.getEventVolunteerGroups).not.toBeNull();
				expect(result.data?.getEventVolunteerGroups).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: groupId1,
							name: groupName1,
						}),
						expect.objectContaining({
							id: groupId2,
							name: groupName2,
						}),
					]),
				);
				expect(
					result.data?.getEventVolunteerGroups?.length,
				).toBeGreaterThanOrEqual(2);
			});
		},
	);
});

import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createEventVolunteerGroup,
	Mutation_createEventVolunteerGroupAssignments,
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_getEventVolunteerGroupAssignments,
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
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function createEventAndGetId(
	authToken: string,
	organizationId: string,
	_creatorId: string,
	_sr: string,
): Promise<string> {
	const eventName = `Test Event ${faker.string.uuid()}`;
	const startDate = new Date();
	const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

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

async function createUserAndGetData(
	authToken: string,
	role: "administrator" | "regular" = "regular",
): Promise<{ userId: string; userToken: string }> {
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				emailAddress: `user${faker.string.ulid()}@example.com`,
				isEmailAddressVerified: true,
				name: `Test User ${faker.person.firstName()}`,
				password: "password",
				role: role,
			},
		},
	});

	assertToBeNonNullish(createUserResult.data?.createUser);
	assertToBeNonNullish(createUserResult.data.createUser.user);

	const userToken = createUserResult.data.createUser.authenticationToken;
	const userId = createUserResult.data.createUser.user.id;

	assertToBeNonNullish(userToken);
	assertToBeNonNullish(userId);

	return { userId, userToken };
}

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

const orgId = await createOrganizationAndGetId(authToken);
const eventId = await createEventAndGetId(authToken, orgId, adminUserId, "ad");
const groupId = await createVolunteerGroupAndGetId(
	authToken,
	eventId,
	adminUserId,
);
const { userId: assigneeUserId } = await createUserAndGetData(authToken);

suite("Mutation field getEventVolunteerGroupAssignments", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(
				Query_getEventVolunteerGroupAssignments,
				{
					variables: {
						input: {
							groupId: groupId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroupAssignments).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["getEventVolunteerGroupAssignments"],
					}),
				]),
			);
		});
	});

	suite("when the specified volunteer group does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(
				Query_getEventVolunteerGroupAssignments,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							groupId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroupAssignments).toBeNull();
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
						path: ["getEventVolunteerGroupAssignments"],
					}),
				]),
			);
		});
	});

	suite("when the user is not authorized", () => {
		test("should return an error with unauthorized_action code", async () => {
			const { userId: regularUserId, userToken: regularUserToken } =
				await createUserAndGetData(authToken);

			await addMembership(orgId, regularUserId, "regular");

			const result = await mercuriusClient.mutate(
				Query_getEventVolunteerGroupAssignments,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							groupId: groupId,
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroupAssignments).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["getEventVolunteerGroupAssignments"],
					}),
				]),
			);
		});
	});

	suite("when invalid input arguments are provided", () => {
		test("should return an error with invalid_arguments code", async () => {
			const result = await mercuriusClient.mutate(
				Query_getEventVolunteerGroupAssignments,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							groupId: "invalid-id",
						},
					},
				},
			);

			expect(result.data?.getEventVolunteerGroupAssignments).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input"]),
									message: expect.any(String),
								}),
							]),
						}),
						path: ["getEventVolunteerGroupAssignments"],
					}),
				]),
			);
		});
	});

	suite(
		"when assignment is created successfully by system administrator",
		() => {
			test("should return the created volunteer group assignment", async () => {
				await mercuriusClient.mutate(
					Mutation_createEventVolunteerGroupAssignments,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								groupId: groupId,
								assigneeId: assigneeUserId,
								inviteStatus: "no_response",
							},
						},
					},
				);

				const result = await mercuriusClient.mutate(
					Query_getEventVolunteerGroupAssignments,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								groupId: groupId,
							},
						},
					},
				);

				const assignments =
					result.data?.getEventVolunteerGroupAssignments || [];
				expect(assignments).not.toBeNull();
				expect(Array.isArray(assignments)).toBe(true);
				expect(assignments.length).toBeGreaterThan(0);
			});
		},
	);

	test("should return an error with unauthenticated code", async () => {
		const tempUserEmail = `${faker.string.ulid()}@test.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});

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
			Query_getEventVolunteerGroupAssignments,
			{
				headers: { authorization: `bearer ${userAuthToken}` },
				variables: {
					input: {
						groupId: groupId,
					},
				},
			},
		);
		expect(result.data?.getEventVolunteerGroupAssignments).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["getEventVolunteerGroupAssignments"],
				}),
			]),
		);
	});
});

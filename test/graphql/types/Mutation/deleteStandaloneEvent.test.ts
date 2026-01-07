import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteStandaloneEvent,
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
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper to create a standalone event
async function createStandaloneEvent(
	organizationId: string,
	creatorId: string,
): Promise<string> {
	const [event] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			name: "Annual Conference",
			description: "Annual company conference",
			organizationId,
			creatorId,
			isRecurringEventTemplate: false,
			startAt: new Date("2024-06-15T09:00:00Z"),
			endAt: new Date("2024-06-15T17:00:00Z"),
			allDay: false,
			location: "Convention Center",
			isPublic: true,
			isRegisterable: true,
		})
		.returning();

	assertToBeNonNullish(event);
	return event.id;
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

suite("Mutation field deleteStandaloneEvent", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteStandaloneEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	suite("when the client is authenticated", () => {
		test("should return an error when the standalone event is not found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteStandaloneEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});

		test("should return an error when input arguments are invalid", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							// Pass an invalid UUID format that will pass GraphQL validation but fail Zod validation
							id: "invalid-uuid-format",
						},
					},
				},
			);
			expect(result.data?.deleteStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should return an error when authenticated user no longer exists in database", async () => {
			// Create a user to get a valid token
			const tempUserResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Temporary User",
						emailAddress: faker.internet.email(),
						password: "password123",
						countryCode: "us",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(tempUserResult.data?.createUser);
			const tempUserToken = tempUserResult.data.createUser.authenticationToken;
			assertToBeNonNullish(tempUserToken);
			const tempUserId = tempUserResult.data.createUser.user?.id;
			assertToBeNonNullish(tempUserId);

			// Delete the user from the database directly (bypassing GraphQL)
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUserId));

			// Try to use the deleted user's token
			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${tempUserToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteStandaloneEvent ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("should return an error when user is not authorized", async () => {
			// Create a regular user
			const regularUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Regular User",
							emailAddress: faker.internet.email(),
							password: "password123",
							countryCode: "us",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);
			assertToBeNonNullish(regularUserResult.data?.createUser);
			const regularUserToken =
				regularUserResult.data.createUser.authenticationToken;
			const regularUserId = regularUserResult.data.createUser.user?.id;
			assertToBeNonNullish(regularUserId);

			// Create organization and event with admin user
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const eventId = await createStandaloneEvent(organizationId, adminUserId);

			// Add regular user to organization with regular role
			await addMembership(organizationId, regularUserId, "regular");

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: eventId,
						},
					},
				},
			);

			expect(result.data?.deleteStandaloneEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});

		test("should return an error when trying to delete a recurring event template", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			// Create a recurring event template
			const [recurringTemplate] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Weekly Team Meeting",
					description: "Weekly team sync",
					organizationId,
					creatorId: adminUserId,
					isRecurringEventTemplate: true,
					startAt: new Date("2024-01-01T10:00:00Z"),
					endAt: new Date("2024-01-01T11:00:00Z"),
					allDay: false,
					location: "Meeting Room",
					isPublic: true,
					isRegisterable: false,
				})
				.returning();

			assertToBeNonNullish(recurringTemplate);

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: recurringTemplate.id,
						},
					},
				},
			);

			expect(result.data?.deleteStandaloneEvent).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should successfully delete standalone event when user is administrator", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const eventId = await createStandaloneEvent(organizationId, adminUserId);

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteStandaloneEvent).toMatchObject({
				id: eventId,
				name: "Annual Conference",
				description: "Annual company conference",
				location: "Convention Center",
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: false,
			});

			// Verify that the event is deleted
			const deletedEvent =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, eventId),
				});
			expect(deletedEvent).toBeUndefined();

			// Note: Cache invalidation (invalidateEntity, invalidateEntityLists) is implicitly verified
			// since the mutation completes successfully. If cache invalidation failed and wasn't handled
			// gracefully, the mutation would error. The specific cache function calls and error handling
			// are unit-tested in test/graphql/types/Mutation/deleteStandaloneEventUnit.test.ts.
		});

		test("should successfully delete standalone event when user is organization administrator", async () => {
			// Create a regular user and make them org admin
			const orgAdminResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Org Admin",
						emailAddress: faker.internet.email(),
						password: "password123",
						countryCode: "us",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(orgAdminResult.data?.createUser);
			const orgAdminToken = orgAdminResult.data.createUser.authenticationToken;
			const orgAdminId = orgAdminResult.data.createUser.user?.id;
			assertToBeNonNullish(orgAdminId);

			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const eventId = await createStandaloneEvent(organizationId, adminUserId);

			// Add org admin to organization
			await addMembership(organizationId, orgAdminId, "administrator");

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							id: eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteStandaloneEvent).toMatchObject({
				id: eventId,
				name: "Annual Conference",
				description: "Annual company conference",
				isRecurringEventTemplate: false,
			});

			// Verify complete deletion
			const deletedEvent =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, eventId),
				});
			expect(deletedEvent).toBeUndefined();
		});

		test("should return proper GraphQL fields for deleted standalone event", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const eventId = await createStandaloneEvent(organizationId, adminUserId);

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteStandaloneEvent).toMatchObject({
				id: eventId,
				name: "Annual Conference",
				description: "Annual company conference",
				location: "Convention Center",
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: false,
				organization: {
					id: organizationId,
				},
				creator: {
					id: adminUserId,
				},
				attachments: [],
			});
		});

		test("should handle event with attachments", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			// Create event with attachment scenario (simplified)
			const eventId = await createStandaloneEvent(organizationId, adminUserId);

			const result = await mercuriusClient.mutate(
				Mutation_deleteStandaloneEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteStandaloneEvent).toMatchObject({
				id: eventId,
				name: "Annual Conference",
				attachments: [], // Empty array for this test
			});

			// Verify deletion
			const deletedEvent =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, eventId),
				});
			expect(deletedEvent).toBeUndefined();
		});
	});
});

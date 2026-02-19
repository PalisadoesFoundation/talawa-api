import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_addEventAttendee,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field addEventAttendee", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				variables: {
					data: {
						userId: faker.string.uuid(),
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when neither eventId nor recurringEventInstanceId is provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						// Missing both eventId and recurringEventInstanceId
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message:
										"Either eventId or recurringEventInstanceId must be provided, but not both",
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: faker.string.uuid(),
						recurringEventInstanceId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message:
										"Either eventId or recurringEventInstanceId must be provided, but not both",
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user to add does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: faker.string.uuid(), // Non-existent user ID
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: faker.string.uuid(), // Non-existent event ID
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "eventId"],
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
					},
				},
			});
			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "recurringEventInstanceId"],
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to add attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Add Attendee Unauthorized Test Org ${faker.string.ulid()}`,
							description: "Organization for unauthorized add attendee testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Unauthorized Add Attendee Test Event",
							description: "Event for unauthorized add attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a regular user (non-admin) and get their auth token
			const { userId: regularUserId, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserId);
			assertToBeNonNullish(regularUserToken);

			// Create another user to add
			const { userId: userToAddId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToAddId);

			// Try to add as regular user (should fail with unauthorized_action)
			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					data: {
						userId: userToAddId,
						eventId,
					},
				},
			});

			expect(result.data?.addEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user is already an attendee for the event", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Already Attendee Test Org ${faker.string.ulid()}`,
							description: "Organization for already attendee testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Already Attendee Test Event",
							description: "Event for already attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to add
			const { userId: userToAddId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToAddId);

			// First, add the user as an attendee
			const firstAddResult = await mercuriusClient.mutate(
				Mutation_addEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToAddId,
							eventId,
						},
					},
				},
			);
			expect(firstAddResult.data?.addEventAttendee).toBeDefined();
			expect(firstAddResult.errors).toBeUndefined();

			// Now try to add the same user again (should fail)
			const secondAddResult = await mercuriusClient.mutate(
				Mutation_addEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToAddId,
							eventId,
						},
					},
				},
			);

			expect(secondAddResult.data?.addEventAttendee).toBeNull();
			expect(secondAddResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
									message: "User is already an attendee for this event",
								}),
							]),
						}),
						path: ["addEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when adding a user to a standalone event successfully", () => {
		test("should create an attendee record with isInvited: false and isRegistered: true, and return the user", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Successful Add Test Org ${faker.string.ulid()}`,
							description: "Organization for successful add testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Successful Add Test Event",
							description: "Event for successful add testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to add
			const { userId: userToAddId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToAddId);

			// Add the user successfully
			const result = await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: userToAddId,
						eventId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			const user = result.data?.addEventAttendee;
			expect(user).toBeDefined();
			expect(user?.id).toBe(userToAddId);

			// Verify the attendee record was created in the database
			const dbAttendee =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, userToAddId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(dbAttendee).toBeDefined();
			expect(dbAttendee?.isInvited).toBe(false);
			expect(dbAttendee?.isRegistered).toBe(true);
			expect(dbAttendee?.isCheckedIn).toBe(false);
			expect(dbAttendee?.isCheckedOut).toBe(false);
		});
	});
});

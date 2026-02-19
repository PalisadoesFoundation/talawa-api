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
	Mutation_removeEventAttendee,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Mutation field removeEventAttendee", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					variables: {
						data: {
							userId: faker.string.uuid(),
							eventId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["removeEventAttendee"],
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

			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							// Missing both eventId and recurringEventInstanceId
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
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
						path: ["removeEventAttendee"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId: faker.string.uuid(),
							recurringEventInstanceId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
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
						path: ["removeEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user to remove does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: faker.string.uuid(), // Non-existent user ID
							eventId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
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
						path: ["removeEventAttendee"],
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

			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId: faker.string.uuid(), // Non-existent event ID
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
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
						path: ["removeEventAttendee"],
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

			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
						},
					},
				},
			);
			expect(result.data?.removeEventAttendee).toBeNull();
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
						path: ["removeEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to remove attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Remove Attendee Unauthorized Test Org ${faker.string.ulid()}`,
							description:
								"Organization for unauthorized remove attendee testing",
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
							name: "Unauthorized Remove Attendee Test Event",
							description: "Event for unauthorized remove attendee testing",
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

			// Create another user to remove
			const { userId: userToRemoveId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToRemoveId);

			// Try to remove as regular user (should fail with unauthorized_action)
			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						data: {
							userId: userToRemoveId,
							eventId,
						},
					},
				},
			);

			expect(result.data?.removeEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["removeEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user is not an attendee of the event", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Not Attendee Test Org ${faker.string.ulid()}`,
							description: "Organization for not attendee testing",
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
							name: "Not Attendee Test Event",
							description: "Event for not attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to try to remove (but they're not an attendee)
			const { userId: userToRemoveId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToRemoveId);

			// Try to remove the user who is not an attendee (should fail)
			const result = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToRemoveId,
							eventId,
						},
					},
				},
			);

			expect(result.data?.removeEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data"],
								}),
							]),
						}),
						path: ["removeEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when removing a user from a standalone event successfully", () => {
		test("should delete the attendee record and return the user", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Successful Remove Test Org ${faker.string.ulid()}`,
							description: "Organization for successful remove testing",
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
							name: "Successful Remove Test Event",
							description: "Event for successful remove testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to add and then remove
			const { userId: userToRemoveId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToRemoveId);

			// First add the user as an attendee
			const addResult = await mercuriusClient.mutate(
				Mutation_addEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToRemoveId,
							eventId,
						},
					},
				},
			);
			expect(addResult.errors).toBeUndefined();
			expect(addResult.data?.addEventAttendee).toBeDefined();

			// Verify the attendee record was created
			const attendeeBefore =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, userToRemoveId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(attendeeBefore).toBeDefined();

			// Now remove the user from the event
			const removeResult = await mercuriusClient.mutate(
				Mutation_removeEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToRemoveId,
							eventId,
						},
					},
				},
			);

			expect(removeResult.errors).toBeUndefined();
			const removedUser = removeResult.data?.removeEventAttendee;
			expect(removedUser).toBeDefined();
			expect(removedUser?.id).toBe(userToRemoveId);

			// Verify the attendee record was deleted
			const attendeeAfter =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, userToRemoveId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(attendeeAfter).toBeUndefined();
		});
	});
});

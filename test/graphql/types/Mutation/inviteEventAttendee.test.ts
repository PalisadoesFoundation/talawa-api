import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_inviteEventAttendee,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Mutation field inviteEventAttendee", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					variables: {
						data: {
							userId: faker.string.uuid(),
							eventId: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.inviteEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["inviteEventAttendee"],
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
				Mutation_inviteEventAttendee,
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
			expect(result.data?.inviteEventAttendee).toBeNull();
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
						path: ["inviteEventAttendee"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
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
			expect(result.data?.inviteEventAttendee).toBeNull();
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
						path: ["inviteEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user to invite does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
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
			expect(result.data?.inviteEventAttendee).toBeNull();
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
						path: ["inviteEventAttendee"],
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
				Mutation_inviteEventAttendee,
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
			expect(result.data?.inviteEventAttendee).toBeNull();
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
						path: ["inviteEventAttendee"],
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
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							recurringEventInstanceId: faker.string.uuid(), // Non-existent recurring event instance ID
						},
					},
				},
			);
			expect(result.data?.inviteEventAttendee).toBeNull();
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
						path: ["inviteEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to invite attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Invite Attendee Unauthorized Test Org ${faker.string.ulid()}`,
							description:
								"Organization for unauthorized invite attendee testing",
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
							name: "Unauthorized Invite Attendee Test Event",
							description: "Event for unauthorized invite attendee testing",
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

			// Create another user to invite
			const { userId: userToInviteId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToInviteId);

			// Try to invite as regular user (should fail with unauthorized_action)
			const result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						data: {
							userId: userToInviteId,
							eventId,
						},
					},
				},
			);

			expect(result.data?.inviteEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["inviteEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user is already invited to the event", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Already Invited Test Org ${faker.string.ulid()}`,
							description: "Organization for already invited testing",
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
							name: "Already Invited Test Event",
							description: "Event for already invited testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to invite
			const { userId: userToInviteId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToInviteId);

			// Invite the user successfully
			const firstInviteResult = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToInviteId,
							eventId,
						},
					},
				},
			);
			expect(firstInviteResult.data?.inviteEventAttendee).toBeDefined();
			expect(firstInviteResult.errors).toBeUndefined();

			// Try to invite the same user again (should fail)
			const secondInviteResult = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToInviteId,
							eventId,
						},
					},
				},
			);

			expect(secondInviteResult.data?.inviteEventAttendee).toBeNull();
			expect(secondInviteResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
									message: "User is already invited to this event",
								}),
							]),
						}),
						path: ["inviteEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when inviting a user to a standalone event successfully", () => {
		test("should create an attendee record with isInvited: true and isRegistered: false", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Successful Invite Test Org ${faker.string.ulid()}`,
							description: "Organization for successful invite testing",
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
							name: "Successful Invite Test Event",
							description: "Event for successful invite testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to invite
			const { userId: userToInviteId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToInviteId);

			// Invite the user successfully
			const result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: userToInviteId,
							eventId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const attendee = result.data?.inviteEventAttendee;
			expect(attendee).toBeDefined();
			expect(attendee?.isInvited).toBe(true);
			expect(attendee?.isRegistered).toBe(false);
			expect(attendee?.isCheckedIn).toBe(false);
			expect(attendee?.isCheckedOut).toBe(false);

			// Verify the record was created in the database
			const dbAttendee =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, userToInviteId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(dbAttendee).toBeDefined();
			expect(dbAttendee?.isInvited).toBe(true);
			expect(dbAttendee?.isRegistered).toBe(false);
		});
	});
});

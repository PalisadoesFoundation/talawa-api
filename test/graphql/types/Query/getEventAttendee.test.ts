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
	Query_getEventAttendee,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Query field getEventAttendee", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when neither eventId nor recurringEventInstanceId is provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				variables: {
					userId,
					// Missing both eventId and recurringEventInstanceId
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
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
						path: ["getEventAttendee"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				variables: {
					userId,
					eventId: faker.string.uuid(),
					recurringEventInstanceId: faker.string.uuid(),
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
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
						path: ["getEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_getEventAttendee, {
				variables: {
					userId: faker.string.uuid(), // Non-existent user ID
					eventId: faker.string.uuid(),
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
								}),
							]),
						}),
						path: ["getEventAttendee"],
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

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				variables: {
					userId,
					eventId: faker.string.uuid(), // Non-existent event ID
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["eventId"],
								}),
							]),
						}),
						path: ["getEventAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the user is not an attendee of the event", () => {
		test("should return null", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Get Attendee Test Org ${faker.string.ulid()}`,
							description: "Organization for get attendee testing",
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
							name: "Get Attendee Test Event",
							description: "Event for get attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a valid user, but don't make them an attendee
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				variables: {
					userId,
					eventId,
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when the user is an attendee of the event", () => {
		test("should return the attendee information", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Get Attendee Test Org ${faker.string.ulid()}`,
							description: "Organization for get attendee testing",
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
							name: "Get Attendee Test Event",
							description: "Event for get attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a valid user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Add the user as attendee
			const addAttendeeResult = await mercuriusClient.mutate(
				Mutation_addEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);
			if (addAttendeeResult.errors) {
				console.log("addEventAttendee errors:", addAttendeeResult.errors);
			}
			expect(addAttendeeResult.errors).toBeUndefined();
			expect(addAttendeeResult.data?.addEventAttendee).toBeDefined();

			// Verify the attendee record was created in the database
			const dbAttendee =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, userId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(dbAttendee).toBeDefined();

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId,
					eventId,
				},
			});
			if (result.errors) {
				console.log("getEventAttendee errors:", result.errors);
			}
			expect(result.data?.getEventAttendee).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					user: { id: userId },
					event: { id: eventId },
					isCheckedIn: false,
					isCheckedOut: false,
					checkinTime: null,
					checkoutTime: null,
					feedbackSubmitted: false,
					isInvited: false,
					isRegistered: true,
				}),
			);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when the recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_getEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId,
					recurringEventInstanceId: faker.string.uuid(), // Non-existent recurring event instance ID
				},
			});
			expect(result.data?.getEventAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["recurringEventInstanceId"],
								}),
							]),
						}),
						path: ["getEventAttendee"],
					}),
				]),
			);
		});
	});
});

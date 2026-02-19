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
	Query_getEventAttendeesByEventId,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Query field getEventAttendeesByEventId", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when neither eventId nor recurringEventInstanceId is provided", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						// Missing both eventId and recurringEventInstanceId
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
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
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						eventId: faker.string.uuid(),
						recurringEventInstanceId: faker.string.uuid(),
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
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
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when eventId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						eventId: "invalid-uuid",
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["eventId"],
									message: "Invalid UUID",
								}),
							]),
						}),
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when recurringEventInstanceId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						recurringEventInstanceId: "invalid-uuid",
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["recurringEventInstanceId"],
									message: "Invalid UUID",
								}),
							]),
						}),
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});
	});

	suite("when the event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						eventId: faker.string.uuid(), // Non-existent event ID
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
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
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});
	});

	suite("when the recurring event instance does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					variables: {
						recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
					},
				},
			);
			expect(result.data?.getEventAttendeesByEventId).toBeNull();
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
						path: ["getEventAttendeesByEventId"],
					}),
				]),
			);
		});
	});

	suite("when getting attendees for a standalone event", () => {
		test("should return empty array when event has no attendees", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Get Attendees Test Org ${faker.string.ulid()}`,
							description: "Organization for get attendees testing",
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
							name: "Get Attendees Test Event",
							description: "Event for get attendees testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						eventId,
					},
				},
			);
			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventAttendeesByEventId).toEqual([]);
		});

		test("should return attendees when event has attendees", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Get Attendees With Data Test Org ${faker.string.ulid()}`,
							description: "Organization for get attendees with data testing",
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
							name: "Get Attendees With Data Test Event",
							description: "Event for get attendees with data testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create and add attendees
			const { userId: user1Id } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(user1Id);

			const { userId: user2Id } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(user2Id);

			// Add attendees
			await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: user1Id,
						eventId,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: user2Id,
						eventId,
					},
				},
			});

			const result = await mercuriusClient.query(
				Query_getEventAttendeesByEventId,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						eventId,
					},
				},
			);
			expect(result.errors).toBeUndefined();
			const attendees = result.data?.getEventAttendeesByEventId;
			expect(attendees).toHaveLength(2);
			expect(attendees).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						user: expect.objectContaining({ id: user1Id }),
						event: expect.objectContaining({ id: eventId }),
						isRegistered: true,
						isInvited: false,
						isCheckedIn: false,
						isCheckedOut: false,
					}),
					expect.objectContaining({
						user: expect.objectContaining({ id: user2Id }),
						event: expect.objectContaining({ id: eventId }),
						isRegistered: true,
						isInvited: false,
						isCheckedIn: false,
						isCheckedOut: false,
					}),
				]),
			);
		});
	});
});

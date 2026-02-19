import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_addEventAttendee,
	Mutation_checkIn,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_currentUser,
	Query_hasSubmittedFeedback,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Query field hasSubmittedFeedback", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when neither eventId nor recurringEventInstanceId is provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId,
					// Missing both eventId and recurringEventInstanceId
				},
			});
			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code when both eventId and recurringEventInstanceId are provided", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId,
					eventId: faker.string.uuid(),
					recurringEventInstanceId: faker.string.uuid(),
				},
			});
			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
					}),
				]),
			);
		});
	});

	suite("when the user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId: faker.string.uuid(), // Non-existent user ID
					eventId: faker.string.uuid(),
				},
			});
			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
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

			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId,
					eventId: faker.string.uuid(), // Non-existent event ID
				},
			});
			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
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

			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId,
					recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
				},
			});
			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
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
							name: `Feedback Test Org ${faker.string.ulid()}`,
							description: "Organization for feedback testing",
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
							name: "Feedback Test Event",
							description: "Event for feedback testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user to check feedback for (but they're not an attendee)
			const { userId: userToCheckId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToCheckId);

			// Try to check feedback for user who is not an attendee (should fail)
			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId: userToCheckId,
					eventId,
				},
			});

			expect(result.data?.hasSubmittedFeedback).toBeNull();
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
						path: ["hasSubmittedFeedback"],
					}),
				]),
			);
		});
	});

	suite("when the user has not checked in to the event", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Check-in Test Org ${faker.string.ulid()}`,
							description: "Organization for check-in testing",
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
							name: "Check-in Test Event",
							description: "Event for check-in testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user and add them as attendee
			const { userId: userToCheckId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToCheckId);

			// Add the user as attendee
			await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: userToCheckId,
						eventId,
					},
				},
			});

			// Try to check feedback for user who has not checked in (should fail)
			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId: userToCheckId,
					eventId,
				},
			});

			expect(result.data?.hasSubmittedFeedback).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
									message: "User has not checked in to this event",
								}),
							]),
						}),
						path: ["hasSubmittedFeedback"],
					}),
				]),
			);
		});
	});

	suite("when checking feedback for a checked-in user", () => {
		test("should return false when feedback has not been submitted", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Feedback Success Test Org ${faker.string.ulid()}`,
							description: "Organization for successful feedback testing",
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
							name: "Feedback Success Test Event",
							description: "Event for successful feedback testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user and add them as attendee
			const { userId: userToCheckId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToCheckId);

			// Add the user as attendee
			await mercuriusClient.mutate(Mutation_addEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: userToCheckId,
						eventId,
					},
				},
			});

			// Check in the user
			await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: userToCheckId,
						eventId,
					},
				},
			});

			// Check feedback status (should be false since no feedback submitted)
			const result = await mercuriusClient.query(Query_hasSubmittedFeedback, {
				variables: {
					userId: userToCheckId,
					eventId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.hasSubmittedFeedback).toBe(false);
		});
	});
});

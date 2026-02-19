import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { eventAttendeesTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_checkIn,
	Mutation_checkOut,
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

suite("Mutation field checkOut", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_checkOut, {
				variables: {
					data: {
						userId: faker.string.uuid(),
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkOut).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["checkOut"],
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

			const result = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						// Missing both eventId and recurringEventInstanceId
					},
				},
			});
			expect(result.data?.checkOut).toBeNull();
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
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	suite("when the user to check out does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: faker.string.uuid(), // Non-existent user ID
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkOut).toBeNull();
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
						path: ["checkOut"],
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

			const result = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: faker.string.uuid(), // Non-existent event ID
					},
				},
			});
			expect(result.data?.checkOut).toBeNull();
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
						path: ["checkOut"],
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

			const result = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						recurringEventInstanceId: faker.string.uuid(), // Non-existent instance ID
					},
				},
			});
			expect(result.data?.checkOut).toBeNull();
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
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to check out attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckOut Unauthorized Test Org ${faker.string.ulid()}`,
							description: "Organization for unauthorized check-out testing",
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
							name: "Unauthorized CheckOut Test Event",
							description: "Event for unauthorized check-out testing",
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

			// Create another user to check out
			const { userId: userToCheckOutId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToCheckOutId);

			// Check in the user first as admin
			const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: userToCheckOutId,
						eventId,
					},
				},
			});
			expect(checkInResult.errors).toBeUndefined();

			// Try to check out as regular user (should fail with unauthorized_action)
			const checkOutResult = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					data: {
						userId: userToCheckOutId,
						eventId,
					},
				},
			});

			expect(checkOutResult.data?.checkOut).toBeNull();
			expect(checkOutResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	suite("when user has not checked in to the event", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckOut Not Checked In Test Org ${faker.string.ulid()}`,
							description: "Organization for not checked in check-out testing",
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
							name: "Not Checked In CheckOut Test Event",
							description: "Event for not checked in check-out testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Try to check out without checking in first
			const checkOutResult = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			});

			expect(checkOutResult.data?.checkOut).toBeNull();
			expect(checkOutResult.errors).toEqual(
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
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	suite("when user is already checked out from the event", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckOut Already Checked Out Test Org ${faker.string.ulid()}`,
							description:
								"Organization for already checked out check-out testing",
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
							name: "Already Checked Out CheckOut Test Event",
							description: "Event for already checked out check-out testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Check in the user
			const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			});
			expect(checkInResult.errors).toBeUndefined();

			// Check out the user
			const firstCheckOutResult = await mercuriusClient.mutate(
				Mutation_checkOut,
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
			expect(firstCheckOutResult.errors).toBeUndefined();

			// Try to check out again (should fail)
			const secondCheckOutResult = await mercuriusClient.mutate(
				Mutation_checkOut,
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

			expect(secondCheckOutResult.data?.checkOut).toBeNull();
			expect(secondCheckOutResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
									message: "User is already checked out from this event",
								}),
							]),
						}),
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	suite("when user is registered for the event but not checked in", () => {
		test("should return an error with invalid_arguments code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckOut Not Checked In Test Org ${faker.string.ulid()}`,
							description: "Organization for not checked in check-out testing",
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
							name: "Not Checked In CheckOut Test Event",
							description: "Event for not checked in check-out testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Insert an event attendee record with isCheckedIn = false
			await server.drizzleClient.insert(eventAttendeesTable).values({
				userId,
				eventId,
				isRegistered: true,
				isCheckedIn: false,
				isCheckedOut: false,
			});

			// Try to check out (should fail because user is not checked in)
			const checkOutResult = await mercuriusClient.mutate(Mutation_checkOut, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			});

			expect(checkOutResult.data?.checkOut).toBeNull();
			expect(checkOutResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "userId"],
									message: "User is not checked in to this event",
								}),
							]),
						}),
						path: ["checkOut"],
					}),
				]),
			);
		});
	});

	test("should successfully check out the user and return the check-out record", async () => {
		// Create organization and event as admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `CheckOut Test Org ${faker.string.ulid()}`,
						description: "Organization for check-out testing",
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
		if (createOrgResult.errors) {
			console.log("Create org errors:", createOrgResult.errors);
		}
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
						name: "CheckOut Test Event",
						description: "Event for check-out testing",
						organizationId: orgId,
						startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
						endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create a user
		const { userId } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(userId);

		// Check in the user first
		const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				data: {
					userId,
					eventId,
				},
			},
		});
		expect(checkInResult.errors).toBeUndefined();

		// Now check out the user
		const checkOutResult = await mercuriusClient.mutate(Mutation_checkOut, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				data: {
					userId,
					eventId,
				},
			},
		});

		expect(checkOutResult.data?.checkOut).toBeDefined();
		expect(checkOutResult.data?.checkOut?.id).toBeDefined();
		expect(checkOutResult.errors).toBeUndefined();
	});
});

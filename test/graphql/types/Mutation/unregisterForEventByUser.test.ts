import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_registerForEvent,
	Mutation_unregisterForEventByUser,
	Query_signIn,
} from "../documentNodes";

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
const adminUserId = signInResult.data.signIn.user?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Mutation field unregisterForEventByUser", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_unregisterForEventByUser,
				{
					variables: {
						id: faker.string.uuid(),
					},
				},
			);
			expect(result.data?.unregisterForEventByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["unregisterForEventByUser"],
					}),
				]),
			);
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when id is not a valid UUID", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_unregisterForEventByUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: "invalid-uuid",
					},
				},
			);
			expect(result.data?.unregisterForEventByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
									message: expect.stringContaining("Invalid UUID"),
								}),
							]),
						}),
						path: ["unregisterForEventByUser"],
					}),
				]),
			);
		});
	});

	suite("when the event does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_unregisterForEventByUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: faker.string.uuid(), // Non-existent event ID
					},
				},
			);
			expect(result.data?.unregisterForEventByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
								}),
							]),
						}),
						path: ["unregisterForEventByUser"],
					}),
				]),
			);
		});
	});

	suite("when the user is not registered for the event", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Unregister Test Org ${faker.string.ulid()}`,
							description: "Organization for unregister testing",
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
							name: "Unregister Test Event",
							description: "Event for unregister testing",
							organizationId: orgId,
							isRegisterable: true, // Make the event registerable
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Try to unregister without being registered first
			const result = await mercuriusClient.mutate(
				Mutation_unregisterForEventByUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: eventId,
					},
				},
			);
			expect(result.data?.unregisterForEventByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["id"],
								}),
							]),
						}),
						path: ["unregisterForEventByUser"],
					}),
				]),
			);
		});
	});

	suite("when unregistering from a standalone event successfully", () => {
		test("should remove the attendee record and return true", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Unregister Success Test Org ${faker.string.ulid()}`,
							description: "Organization for successful unregister testing",
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
							name: "Unregister Success Test Event",
							description: "Event for successful unregister testing",
							organizationId: orgId,
							isRegisterable: true, // Make the event registerable
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Register for the event first
			const registerResult = await mercuriusClient.mutate(
				Mutation_registerForEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: eventId,
					},
				},
			);
			expect(registerResult.errors).toBeUndefined();
			expect(registerResult.data?.registerForEvent).toBeDefined();

			// Verify the attendee record was created
			const dbAttendeeBefore =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, adminUserId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(dbAttendeeBefore).toBeDefined();

			// Now unregister from the event
			const result = await mercuriusClient.mutate(
				Mutation_unregisterForEventByUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: eventId,
					},
				},
			);
			expect(result.errors).toBeUndefined();
			expect(result.data?.unregisterForEventByUser).toBe(true);

			// Verify the attendee record was removed
			const dbAttendeeAfter =
				await server.drizzleClient.query.eventAttendeesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, adminUserId),
							operators.eq(fields.eventId, eventId),
						),
				});
			expect(dbAttendeeAfter).toBeUndefined();
		});
	});
});

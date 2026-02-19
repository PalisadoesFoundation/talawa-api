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
	Query_getEventInvitesByUserId,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Query field getEventInvitesByUserId", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when userId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(
				Query_getEventInvitesByUserId,
				{
					variables: {
						userId: "invalid-uuid",
					},
				},
			);
			expect(result.data?.getEventInvitesByUserId).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
									message: "Invalid UUID",
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	suite("when the user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(
				Query_getEventInvitesByUserId,
				{
					variables: {
						userId: faker.string.uuid(), // Non-existent user ID
					},
				},
			);
			expect(result.data?.getEventInvitesByUserId).toBeUndefined();
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
						path: ["getEventInvitesByUserId"],
					}),
				]),
			);
		});
	});

	suite("when getting event invites for a user", () => {
		test("should return empty array when user has no event invites", async () => {
			// Create a valid user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(
				Query_getEventInvitesByUserId,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						userId,
					},
				},
			);
			expect(result.errors).toBeUndefined();
			expect(result.data?.getEventInvitesByUserId).toEqual([]);
		});

		test("should return event invites when user has invites", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Event Invites Test Org ${faker.string.ulid()}`,
							description: "Organization for event invites testing",
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
							name: "Event Invites Test Event",
							description: "Event for invites testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create users to invite
			const { userId: user1Id } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(user1Id);

			const { userId: user2Id } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(user2Id);

			// Invite the users to the event
			const invite1Result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: user1Id,
							eventId,
						},
					},
				},
			);
			expect(invite1Result.errors).toBeUndefined();

			const invite2Result = await mercuriusClient.mutate(
				Mutation_inviteEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId: user2Id,
							eventId,
						},
					},
				},
			);
			expect(invite2Result.errors).toBeUndefined();

			// Get invites for user1
			const result = await mercuriusClient.query(
				Query_getEventInvitesByUserId,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						userId: user1Id,
					},
				},
			);
			expect(result.errors).toBeUndefined();
			const invites = result.data?.getEventInvitesByUserId;
			expect(invites).toHaveLength(1);
			expect(invites?.[0]).toEqual(
				expect.objectContaining({
					user: { id: user1Id },
					event: { id: eventId },
					isInvited: true,
					isRegistered: false,
					isCheckedIn: false,
					isCheckedOut: false,
				}),
			);

			// Get invites for user2
			const result2 = await mercuriusClient.query(
				Query_getEventInvitesByUserId,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						userId: user2Id,
					},
				},
			);
			expect(result2.errors).toBeUndefined();
			const invites2 = result2.data?.getEventInvitesByUserId;
			expect(invites2).toHaveLength(1);
			expect(invites2?.[0]).toEqual(
				expect.objectContaining({
					user: { id: user2Id },
					event: { id: eventId },
					isInvited: true,
					isRegistered: false,
					isCheckedIn: false,
					isCheckedOut: false,
				}),
			);
		});
	});
});

import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupExceptionsTable } from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";

import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createEventVolunteerGroup,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteEventVolunteerGroup,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_currentUser,
} from "../documentNodes";

suite("Mutation createEventVolunteerGroup", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	let organizationId: string;
	let eventId: string;
	let regularUserId: string;
	let leaderUserId: string;

	// Rate limiting protection - same pattern as other working tests
	beforeAll(async () => {
		// Initial delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 800));

		const { accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(accessToken);
		adminAuthToken = accessToken;
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
		});
		adminUserId = currentUserResult.data?.currentUser?.id ?? "";
		assertToBeNonNullish(adminUserId);

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test VG Org ${faker.string.alphanumeric(6)}`,
					},
				},
			},
		);

		assertToBeNonNullish(orgResult.data?.createOrganization);
		organizationId = orgResult.data.createOrganization.id;

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create organization membership for admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: adminUserId,
					role: "administrator",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create event
		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Test VG Event ${faker.string.alphanumeric(4)}`,
					description: "Test event for volunteer group creation",
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					organizationId,
				},
			},
		});

		assertToBeNonNullish(eventResult.data?.createEvent);
		eventId = eventResult.data.createEvent.id;

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.ulid()}@test.com`,
						isEmailAddressVerified: true,
						name: `Test VG User ${faker.person.firstName()}`,
						password: "password123",
						role: "regular",
					},
				},
			},
		);

		assertToBeNonNullish(regularUserResult.data?.createUser);
		regularUserId = regularUserResult.data.createUser.user?.id as string;

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create leader user
		const leaderUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: true,
					name: `Test VG Leader ${faker.person.firstName()}`,
					password: "password123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(leaderUserResult.data?.createUser);
		leaderUserId = leaderUserResult.data.createUser.user?.id as string;

		await new Promise((resolve) => setTimeout(resolve, 600));

		// Create organization memberships for users
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: regularUserId,
					role: "regular",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 400));

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId,
					memberId: leaderUserId,
					role: "regular",
				},
			},
		});

		// Final setup delay
		await new Promise((resolve) => setTimeout(resolve, 800));
	});

	// Comprehensive cleanup
	afterAll(async () => {
		try {
			// Delete organization memberships first
			const membersToDelete = [regularUserId, leaderUserId, adminUserId];
			for (const memberId of membersToDelete) {
				if (memberId && organizationId) {
					try {
						await mercuriusClient.mutate(
							Mutation_deleteOrganizationMembership,
							{
								headers: {
									authorization: `bearer ${adminAuthToken}`,
								},
								variables: {
									input: {
										organizationId,
										memberId,
									},
								},
							},
						);
					} catch (error) {
						console.warn(
							`Failed to delete membership for ${memberId}: ${error}`,
						);
					}
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			}

			// Delete users
			const usersToDelete = [regularUserId, leaderUserId];
			for (const userId of usersToDelete) {
				if (userId) {
					try {
						await mercuriusClient.mutate(Mutation_deleteUser, {
							headers: {
								authorization: `bearer ${adminAuthToken}`,
							},
							variables: { input: { id: userId } },
						});
					} catch (error) {
						console.warn(`Failed to delete user ${userId}: ${error}`);
					}
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			}

			// Delete organization last
			if (organizationId) {
				try {
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { input: { id: organizationId } },
					});
				} catch (error) {
					console.warn(`Failed to delete organization: ${error}`);
				}
			}

			// Final cleanup delay
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	});

	suite("Authentication", () => {
		test("should throw unauthenticated error when client is not authenticated", async () => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: "Test Group",
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("should throw error for invalid UUID format", async () => {
			await new Promise((resolve) => setTimeout(resolve, 400));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: "invalid-uuid-format",
							leaderId: leaderUserId,
							name: "Test Group",
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
									message: expect.any(String),
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});

		test("should throw error for missing required fields", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: "", // Empty string to trigger validation
							name: "", // Empty string to trigger validation
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			// GraphQL reaches resolver but returns null due to validation
			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
			// Validation error for empty/invalid fields
			expect(result.errors?.[0]?.message).toBeDefined();
		});
	});

	suite("Resource Validation", () => {
		test("should throw error for non-existent leader", async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));

			const fakeLeaderId = faker.string.uuid();

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: fakeLeaderId,
							name: "Test Group",
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["data", "leaderId"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});

		test("should throw error for non-existent event", async () => {
			await new Promise((resolve) => setTimeout(resolve, 700));

			const fakeEventId = faker.string.uuid();

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: fakeEventId,
							leaderId: leaderUserId,
							name: "Test Group",
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["data", "eventId"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});
	});

	suite("Authorization", () => {
		test("should throw unauthorized error when user is not organization admin or event creator", async () => {
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Create non-member user
			const nonMemberResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							emailAddress: `${faker.string.ulid()}@test.com`,
							isEmailAddressVerified: true,
							name: "Non Member User",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(nonMemberResult.data?.createUser);
			const nonMemberAuthToken = nonMemberResult.data.createUser
				.authenticationToken as string;
			const nonMemberUserId = nonMemberResult.data.createUser.user
				?.id as string;

			await new Promise((resolve) => setTimeout(resolve, 400));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${nonMemberAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: "Test Group",
							description: "Test description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
							code: "unauthorized_action",
						}),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);

			// Cleanup non-member user
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: { input: { id: nonMemberUserId } },
			});
		});
	});

	suite("ENTIRE_SERIES Scope", () => {
		test("should successfully create event volunteer group with default scope", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: `Test Group ${faker.string.alphanumeric(6)}`,
							description: "Test volunteer group description",
							volunteersRequired: 5,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();
			expect(group?.name).toContain("Test Group");
			expect(group?.description).toBe("Test volunteer group description");
			expect(group?.volunteersRequired).toBe(5);
			expect(group?.leader?.id).toBe(leaderUserId);
			expect(group?.event?.id).toBe(eventId);

			// Cleanup
			if (group?.id) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});

		test("should return existing group for duplicate group name in same event", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1200));

			const groupName = `Unique Group ${faker.string.alphanumeric(8)}`;

			// Create first group
			const firstResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: groupName,
							description: "First group",
							volunteersRequired: 3,
						},
					},
				},
			);

			expect(firstResult.errors).toBeUndefined();
			assertToBeNonNullish(firstResult.data?.createEventVolunteerGroup);
			const firstGroupId = firstResult.data.createEventVolunteerGroup
				.id as string;

			await new Promise((resolve) => setTimeout(resolve, 300));

			// Try to create duplicate group with same name
			const duplicateResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: groupName, // Same name
							description: "Duplicate group",
							volunteersRequired: 2,
						},
					},
				},
			);

			expect(duplicateResult.errors).toBeUndefined();
			expect(duplicateResult.data?.createEventVolunteerGroup).toBeDefined();
			assertToBeNonNullish(duplicateResult.data?.createEventVolunteerGroup);

			// Should return the same group
			expect(duplicateResult.data.createEventVolunteerGroup.id).toBe(
				firstGroupId,
			);
			expect(duplicateResult.data.createEventVolunteerGroup.name).toBe(
				groupName,
			);

			// Cleanup first group
			await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: { id: firstGroupId },
			});
		});

		test("should create group with volunteer assignments", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1400));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: `Volunteer Group ${faker.string.alphanumeric(6)}`,
							description: "Group with volunteers",
							volunteersRequired: 2,
							volunteerUserIds: [regularUserId],
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();

			// Verify volunteer membership was created
			if (group?.id) {
				const memberships = await server.drizzleClient
					.select()
					.from(eventVolunteerMembershipsTable)
					.where(eq(eventVolunteerMembershipsTable.groupId, group.id));

				expect(memberships.length).toBeGreaterThan(0);
				expect(memberships[0]?.status).toBe("invited");

				// Cleanup
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});
	});

	suite("THIS_INSTANCE_ONLY Scope", () => {
		test("should throw error for missing recurringEventInstanceId", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1600));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: "Instance Group",
							description: "Test instance-only group",
							volunteersRequired: 3,
							scope: "THIS_INSTANCE_ONLY",
							// Missing recurringEventInstanceId
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["data", "recurringEventInstanceId"],
									message:
										"recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});

		test("should throw error for non-existent recurringEventInstanceId", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1800));

			const fakeInstanceId = faker.string.uuid();

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: "Instance Group",
							description: "Test instance-only group",
							volunteersRequired: 3,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: fakeInstanceId,
						},
					},
				},
			);

			expect(result.data?.createEventVolunteerGroup).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["data", "recurringEventInstanceId"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["createEventVolunteerGroup"],
					}),
				]),
			);
		});

		test("should create group with THIS_INSTANCE_ONLY scope and exceptions", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Create recurring event template
			const [template] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Weekly Meeting",
					description: "Recurring weekly meeting",
					startAt: new Date("2024-12-01T10:00:00Z"),
					endAt: new Date("2024-12-01T12:00:00Z"),
					organizationId,
					creatorId: adminUserId,
					isPublic: true,
					isRegisterable: true,
					isRecurringEventTemplate: true,
				})
				.returning();

			assertToBeNonNullish(template);

			const [recurrenceRule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template.id,
					frequency: "WEEKLY",
					interval: 1,
					count: 3,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=3",
					recurrenceStartDate: new Date("2024-12-01T10:00:00Z"),
					latestInstanceDate: new Date("2024-12-01T10:00:00Z"),
				})
				.returning();

			assertToBeNonNullish(recurrenceRule);

			// Create multiple instances
			const instances = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-01T10:00:00Z"),
						actualStartTime: new Date("2024-12-01T10:00:00Z"),
						actualEndTime: new Date("2024-12-01T12:00:00Z"),
						organizationId,
						sequenceNumber: 1,
						totalCount: 3,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-08T10:00:00Z"),
						actualStartTime: new Date("2024-12-08T10:00:00Z"),
						actualEndTime: new Date("2024-12-08T12:00:00Z"),
						organizationId,
						sequenceNumber: 2,
						totalCount: 3,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-15T10:00:00Z"),
						actualStartTime: new Date("2024-12-15T10:00:00Z"),
						actualEndTime: new Date("2024-12-15T12:00:00Z"),
						organizationId,
						sequenceNumber: 3,
						totalCount: 3,
					},
				])
				.returning();

			expect(instances).toHaveLength(3);
			const targetInstanceId = instances[0]?.id;
			assertToBeNonNullish(targetInstanceId);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Create group with THIS_INSTANCE_ONLY scope
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: `Instance Group ${faker.string.alphanumeric(6)}`,
							description: "Group for specific instance",
							volunteersRequired: 4,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: targetInstanceId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();
			expect(group?.name).toContain("Instance Group");

			// Verify no exceptions were created since this creates an instance-specific group
			if (group?.id) {
				const exceptions = await server.drizzleClient
					.select()
					.from(eventVolunteerGroupExceptionsTable)
					.where(
						eq(eventVolunteerGroupExceptionsTable.volunteerGroupId, group.id),
					);

				expect(exceptions).toHaveLength(0); // No exceptions for instance-specific groups

				// Cleanup
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});

		test("should reuse existing group with THIS_INSTANCE_ONLY scope", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2200));

			// Create recurring event template
			const [template2] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Daily Standup",
					description: "Daily team standup",
					startAt: new Date("2024-12-01T09:00:00Z"),
					endAt: new Date("2024-12-01T09:30:00Z"),
					organizationId,
					creatorId: adminUserId,
					isPublic: true,
					isRegisterable: true,
					isRecurringEventTemplate: true,
				})
				.returning();

			assertToBeNonNullish(template2);

			const [rule2] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template2.id,
					frequency: "DAILY",
					interval: 1,
					count: 2,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1;COUNT=2",
					recurrenceStartDate: new Date("2024-12-01T09:00:00Z"),
					latestInstanceDate: new Date("2024-12-01T09:00:00Z"),
				})
				.returning();

			assertToBeNonNullish(rule2);

			const instances2 = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template2.id,
						recurrenceRuleId: rule2.id,
						originalSeriesId: template2.id,
						originalInstanceStartTime: new Date("2024-12-01T09:00:00Z"),
						actualStartTime: new Date("2024-12-01T09:00:00Z"),
						actualEndTime: new Date("2024-12-01T09:30:00Z"),
						organizationId,
						sequenceNumber: 1,
						totalCount: 2,
					},
					{
						baseRecurringEventId: template2.id,
						recurrenceRuleId: rule2.id,
						originalSeriesId: template2.id,
						originalInstanceStartTime: new Date("2024-12-02T09:00:00Z"),
						actualStartTime: new Date("2024-12-02T09:00:00Z"),
						actualEndTime: new Date("2024-12-02T09:30:00Z"),
						organizationId,
						sequenceNumber: 2,
						totalCount: 2,
					},
				])
				.returning();

			expect(instances2).toHaveLength(2);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// First create a template group with ENTIRE_SERIES
			const templateGroupResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template2.id,
							leaderId: leaderUserId,
							name: "Reusable Group",
							description: "Template group to be reused",
							volunteersRequired: 3,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);

			expect(templateGroupResult.errors).toBeUndefined();
			assertToBeNonNullish(templateGroupResult.data?.createEventVolunteerGroup);
			const templateGroupId =
				templateGroupResult.data.createEventVolunteerGroup.id;
			assertToBeNonNullish(templateGroupId);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Now test THIS_INSTANCE_ONLY with existing group (should reuse)
			const instanceGroupResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template2.id,
							leaderId: leaderUserId,
							name: "Reusable Group", // Same name - should reuse existing
							description: "Instance-specific group",
							volunteersRequired: 2,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances2[0]?.id,
						},
					},
				},
			);

			expect(instanceGroupResult.errors).toBeUndefined();
			expect(instanceGroupResult.data?.createEventVolunteerGroup).toBeDefined();

			// Should create a new instance-specific group (not reuse template)
			const instanceGroup = instanceGroupResult.data?.createEventVolunteerGroup;
			expect(instanceGroup?.id).not.toBe(templateGroupId);
			expect(instanceGroup?.id).toBeDefined();

			// Verify no exceptions were created since this creates an instance-specific group
			if (instanceGroup?.id) {
				const exceptions = await server.drizzleClient
					.select()
					.from(eventVolunteerGroupExceptionsTable)
					.where(
						eq(
							eventVolunteerGroupExceptionsTable.volunteerGroupId,
							instanceGroup.id,
						),
					);

				expect(exceptions).toHaveLength(0); // No exceptions for instance-specific groups

				// Cleanup both groups
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: templateGroupId },
				});
				if (instanceGroup?.id) {
					await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: { id: instanceGroup.id },
					});
				}
			}
		});

		test("should create group with volunteer assignments in THIS_INSTANCE_ONLY scope", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2400));

			// Create recurring event template for THIS_INSTANCE_ONLY volunteer assignment test
			const [template3] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Assignment Test Event",
					description: "Event for testing volunteer assignments",
					startAt: new Date("2024-12-01T14:00:00Z"),
					endAt: new Date("2024-12-01T16:00:00Z"),
					organizationId,
					creatorId: adminUserId,
					isPublic: true,
					isRegisterable: true,
					isRecurringEventTemplate: true,
				})
				.returning();

			assertToBeNonNullish(template3);

			const [rule3] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template3.id,
					frequency: "WEEKLY",
					interval: 1,
					count: 2,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=2",
					recurrenceStartDate: new Date("2024-12-01T14:00:00Z"),
					latestInstanceDate: new Date("2024-12-01T14:00:00Z"),
				})
				.returning();

			assertToBeNonNullish(rule3);

			const instances3 = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template3.id,
						recurrenceRuleId: rule3.id,
						originalSeriesId: template3.id,
						originalInstanceStartTime: new Date("2024-12-01T14:00:00Z"),
						actualStartTime: new Date("2024-12-01T14:00:00Z"),
						actualEndTime: new Date("2024-12-01T16:00:00Z"),
						organizationId,
						sequenceNumber: 1,
						totalCount: 2,
					},
					{
						baseRecurringEventId: template3.id,
						recurrenceRuleId: rule3.id,
						originalSeriesId: template3.id,
						originalInstanceStartTime: new Date("2024-12-08T14:00:00Z"),
						actualStartTime: new Date("2024-12-08T14:00:00Z"),
						actualEndTime: new Date("2024-12-08T16:00:00Z"),
						organizationId,
						sequenceNumber: 2,
						totalCount: 2,
					},
				])
				.returning();

			expect(instances3).toHaveLength(2);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Pre-create one existing volunteer for the template event
			const [existingVolunteer] = await server.drizzleClient
				.insert(eventVolunteersTable)
				.values({
					userId: regularUserId, // This will be existing
					eventId: template3.id,
					creatorId: adminUserId,
					hasAccepted: false,
					isPublic: true,
					hoursVolunteered: "0",
				})
				.returning();

			assertToBeNonNullish(existingVolunteer);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Test THIS_INSTANCE_ONLY with volunteer assignments (covers all uncovered lines)
			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template3.id,
							leaderId: leaderUserId,
							name: `Assignment Group ${faker.string.alphanumeric(6)}`,
							description:
								"Group with volunteer assignments for THIS_INSTANCE_ONLY",
							volunteersRequired: 3,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances3[0]?.id,
							volunteerUserIds: [regularUserId, leaderUserId], // Mix: existing + new
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();

			if (group?.id) {
				// Verify volunteer memberships were created
				const memberships = await server.drizzleClient
					.select()
					.from(eventVolunteerMembershipsTable)
					.where(eq(eventVolunteerMembershipsTable.groupId, group.id));

				expect(memberships.length).toBe(2); // Both regularUser and leader
				expect(memberships[0]?.status).toBe("invited");

				// Verify that existing volunteer was reused and new volunteer was created
				const allVolunteers = await server.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(eq(eventVolunteersTable.eventId, template3.id));

				const volunteerUserIds = allVolunteers.map((v) => v.userId);
				expect(volunteerUserIds).toContain(regularUserId); // Existing
				expect(volunteerUserIds).toContain(leaderUserId); // New

				// Verify no exceptions were created since this creates an instance-specific group
				const exceptions = await server.drizzleClient
					.select()
					.from(eventVolunteerGroupExceptionsTable)
					.where(
						eq(eventVolunteerGroupExceptionsTable.volunteerGroupId, group.id),
					);

				expect(exceptions).toHaveLength(0); // No exceptions for instance-specific groups

				// Cleanup
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});
	});

	suite("Data Integrity", () => {
		test("should return complete group data structure", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2400));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: `Complete Group ${faker.string.alphanumeric(6)}`,
							description: "Group for data integrity test",
							volunteersRequired: 10,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();
			expect(group?.name).toContain("Complete Group");
			expect(group?.description).toBe("Group for data integrity test");
			expect(group?.volunteersRequired).toBe(10);
			expect(group?.leader?.id).toBe(leaderUserId);
			expect(group?.leader?.name).toBeDefined();
			expect(group?.event?.id).toBe(eventId);
			// Note: creator and createdAt are not returned by the mutation response

			// Cleanup
			if (group?.id) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});

		test("should handle optional fields (description, volunteersRequired)", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2600));

			const result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId,
							leaderId: leaderUserId,
							name: `Minimal Group ${faker.string.alphanumeric(6)}`,
							// Omitting optional description and volunteersRequired
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createEventVolunteerGroup).toBeDefined();

			const group = result.data?.createEventVolunteerGroup;
			expect(group?.id).toBeDefined();
			expect(group?.name).toContain("Minimal Group");
			expect(group?.description).toBeNull(); // Should be null for omitted field
			expect(group?.volunteersRequired).toBeNull(); // Should be null for omitted field
			expect(group?.leader?.id).toBe(leaderUserId);
			expect(group?.event?.id).toBe(eventId);

			// Cleanup
			if (group?.id) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: group.id },
				});
			}
		});

		test("should delete existing instance-specific groups when creating ENTIRE_SERIES group", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2600));

			// Create recurring event template
			const [template] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Coverage Test Event",
					description: "Event for coverage testing",
					startAt: new Date("2024-12-01T10:00:00Z"),
					endAt: new Date("2024-12-01T11:00:00Z"),
					organizationId,
					creatorId: adminUserId,
					isPublic: true,
					isRegisterable: true,
					isRecurringEventTemplate: true,
				})
				.returning();

			assertToBeNonNullish(template);

			const [rule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template.id,
					frequency: "DAILY",
					interval: 1,
					count: 2,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1;COUNT=2",
					recurrenceStartDate: new Date("2024-12-01T10:00:00Z"),
					latestInstanceDate: new Date("2024-12-01T10:00:00Z"),
				})
				.returning();

			assertToBeNonNullish(rule);

			const instances = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: rule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-01T10:00:00Z"),
						actualStartTime: new Date("2024-12-01T10:00:00Z"),
						actualEndTime: new Date("2024-12-01T11:00:00Z"),
						organizationId,
						sequenceNumber: 1,
						totalCount: 2,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: rule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-02T10:00:00Z"),
						actualStartTime: new Date("2024-12-02T10:00:00Z"),
						actualEndTime: new Date("2024-12-02T11:00:00Z"),
						organizationId,
						sequenceNumber: 2,
						totalCount: 2,
					},
				])
				.returning();

			expect(instances).toHaveLength(2);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// First create instance-specific groups
			const instanceGroup1Result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Coverage Group",
							description: "Group for coverage testing",
							volunteersRequired: 2,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances[0]?.id,
						},
					},
				},
			);

			expect(instanceGroup1Result.errors).toBeUndefined();
			assertToBeNonNullish(
				instanceGroup1Result.data?.createEventVolunteerGroup,
			);

			await new Promise((resolve) => setTimeout(resolve, 400));

			const instanceGroup2Result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Coverage Group",
							description: "Another instance group",
							volunteersRequired: 3,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances[1]?.id,
						},
					},
				},
			);

			expect(instanceGroup2Result.errors).toBeUndefined();
			assertToBeNonNullish(
				instanceGroup2Result.data?.createEventVolunteerGroup,
			);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Verify both instance-specific groups exist
			let existingGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Coverage Group"),
						eq(eventVolunteerGroupsTable.isTemplate, false),
					),
				);

			expect(existingGroups).toHaveLength(2);

			// Now create ENTIRE_SERIES group with same name - should delete instance-specific groups
			const entireSeriesResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Coverage Group",
							description: "Template group that replaces instances",
							volunteersRequired: 4,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);

			expect(entireSeriesResult.errors).toBeUndefined();
			assertToBeNonNullish(entireSeriesResult.data?.createEventVolunteerGroup);
			const templateGroupId =
				entireSeriesResult.data.createEventVolunteerGroup.id;

			// Verify instance-specific groups were deleted
			existingGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Coverage Group"),
						eq(eventVolunteerGroupsTable.isTemplate, false),
					),
				);

			expect(existingGroups).toHaveLength(0);

			// Verify template group exists
			const templateGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Coverage Group"),
						eq(eventVolunteerGroupsTable.isTemplate, true),
					),
				);

			expect(templateGroups).toHaveLength(1);
			expect(templateGroups[0]?.id).toBe(templateGroupId);

			// Cleanup
			if (templateGroupId) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: templateGroupId },
				});
			}
		});

		test("should reuse existing template and delete instance-specific groups when creating ENTIRE_SERIES group with volunteer assignments", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2700));

			// Create recurring event template
			const [template] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Reuse Template Event",
					description: "Event for testing template reuse",
					startAt: new Date("2024-12-01T12:00:00Z"),
					endAt: new Date("2024-12-01T13:00:00Z"),
					organizationId,
					creatorId: adminUserId,
					isPublic: true,
					isRegisterable: true,
					isRecurringEventTemplate: true,
				})
				.returning();

			assertToBeNonNullish(template);

			const [rule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template.id,
					frequency: "DAILY",
					interval: 1,
					count: 2,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1;COUNT=2",
					recurrenceStartDate: new Date("2024-12-01T12:00:00Z"),
					latestInstanceDate: new Date("2024-12-01T12:00:00Z"),
				})
				.returning();

			assertToBeNonNullish(rule);

			const instances = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: rule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-01T12:00:00Z"),
						actualStartTime: new Date("2024-12-01T12:00:00Z"),
						actualEndTime: new Date("2024-12-01T13:00:00Z"),
						organizationId,
						sequenceNumber: 1,
						totalCount: 2,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: rule.id,
						originalSeriesId: template.id,
						originalInstanceStartTime: new Date("2024-12-02T12:00:00Z"),
						actualStartTime: new Date("2024-12-02T12:00:00Z"),
						actualEndTime: new Date("2024-12-02T13:00:00Z"),
						organizationId,
						sequenceNumber: 2,
						totalCount: 2,
					},
				])
				.returning();

			expect(instances).toHaveLength(2);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// First create ENTIRE_SERIES template group
			const templateResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Reuse Template Group",
							description: "Template group to be reused",
							volunteersRequired: 3,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);

			expect(templateResult.errors).toBeUndefined();
			assertToBeNonNullish(templateResult.data?.createEventVolunteerGroup);
			const originalTemplateId =
				templateResult.data.createEventVolunteerGroup.id;

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Create instance-specific groups with same name
			const instanceGroup1Result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Reuse Template Group",
							description: "Instance group 1",
							volunteersRequired: 2,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances[0]?.id,
						},
					},
				},
			);

			expect(instanceGroup1Result.errors).toBeUndefined();
			assertToBeNonNullish(
				instanceGroup1Result.data?.createEventVolunteerGroup,
			);

			await new Promise((resolve) => setTimeout(resolve, 400));

			const instanceGroup2Result = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Reuse Template Group",
							description: "Instance group 2",
							volunteersRequired: 1,
							scope: "THIS_INSTANCE_ONLY",
							recurringEventInstanceId: instances[1]?.id,
						},
					},
				},
			);

			expect(instanceGroup2Result.errors).toBeUndefined();
			assertToBeNonNullish(
				instanceGroup2Result.data?.createEventVolunteerGroup,
			);

			await new Promise((resolve) => setTimeout(resolve, 400));

			// Verify we have 1 template and 2 instance-specific groups
			let templateGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Reuse Template Group"),
						eq(eventVolunteerGroupsTable.isTemplate, true),
					),
				);

			expect(templateGroups).toHaveLength(1);

			let instanceGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Reuse Template Group"),
						eq(eventVolunteerGroupsTable.isTemplate, false),
					),
				);

			expect(instanceGroups).toHaveLength(2);

			// Now create another ENTIRE_SERIES group with same name and volunteer assignments
			// This should reuse the existing template and delete instance-specific groups
			const reuseResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteerGroup,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						data: {
							eventId: template.id,
							leaderId: leaderUserId,
							name: "Reuse Template Group",
							description: "Reused template with assignments",
							volunteersRequired: 4,
							scope: "ENTIRE_SERIES",
							volunteerUserIds: [regularUserId, leaderUserId],
						},
					},
				},
			);

			expect(reuseResult.errors).toBeUndefined();
			assertToBeNonNullish(reuseResult.data?.createEventVolunteerGroup);
			const reusedTemplateId = reuseResult.data.createEventVolunteerGroup.id;
			assertToBeNonNullish(reusedTemplateId);

			// Should return the same template ID
			expect(reusedTemplateId).toBe(originalTemplateId);

			// Verify instance-specific groups were deleted
			instanceGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Reuse Template Group"),
						eq(eventVolunteerGroupsTable.isTemplate, false),
					),
				);

			expect(instanceGroups).toHaveLength(0);

			// Verify template still exists
			templateGroups = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, template.id),
						eq(eventVolunteerGroupsTable.name, "Reuse Template Group"),
						eq(eventVolunteerGroupsTable.isTemplate, true),
					),
				);

			expect(templateGroups).toHaveLength(1);

			// Verify volunteer memberships were created
			const memberships = await server.drizzleClient
				.select()
				.from(eventVolunteerMembershipsTable)
				.where(eq(eventVolunteerMembershipsTable.groupId, reusedTemplateId));

			expect(memberships.length).toBe(2); // Both regularUser and leader
			expect(memberships[0]?.status).toBe("invited");

			// Cleanup
			if (reusedTemplateId) {
				await mercuriusClient.mutate(Mutation_deleteEventVolunteerGroup, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: { id: reusedTemplateId },
				});
			}
		});
	});
});

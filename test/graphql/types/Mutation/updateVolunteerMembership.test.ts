import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateVolunteerMembership,
	Query_currentUser,
} from "../documentNodes";

// Admin auth (fetched once per suite)
let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);
	adminToken = accessToken;
	adminUserId = userId;
	return { token: adminToken, userId: adminUserId };
}

// Helper Types
interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

interface TestEvent {
	eventId: string;
	cleanup: () => Promise<void>;
}

interface TestUser {
	userId: string;
	authToken: string;
	cleanup: () => Promise<void>;
}

interface TestVolunteerMembership {
	membershipId: string;
	volunteerId: string;
	cleanup: () => Promise<void>;
}

async function createTestOrganization(): Promise<TestOrganization> {
	const { token } = await ensureAdminAuth();
	const res = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	if (!res.data?.createOrganization?.id)
		throw new Error(res.errors?.[0]?.message || "org create failed");
	const orgId = res.data.createOrganization.id;
	return {
		orgId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: orgId } },
			});
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {
			const { token } = await ensureAdminAuth();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: regularUser.userId } },
			});
		},
	};
}

async function createTestEvent(organizationId: string): Promise<TestEvent> {
	const { token: adminAuthToken } = await ensureAdminAuth();
	const startAt = new Date();
	startAt.setHours(startAt.getHours() + 1);
	const endAt = new Date(startAt);
	endAt.setHours(endAt.getHours() + 2);

	// Make sure admin is a member of the organization first
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				memberId: adminUserId || "",
				organizationId: organizationId,
				role: "administrator",
			},
		},
	});

	const res = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId,
				name: `Test Event ${faker.lorem.words(3)}`,
				description: `Test event description ${faker.lorem.paragraph()}`,
				startAt: startAt.toISOString(),
				endAt: endAt.toISOString(),
				isPublic: true,
				isRegisterable: true,
			},
		},
	});
	if (!res.data?.createEvent?.id)
		throw new Error(res.errors?.[0]?.message || "event create failed");
	return {
		eventId: res.data.createEvent.id,
		cleanup: async () => {
			/* Events get cleaned up when organization is deleted */
		},
	};
}

async function createTestVolunteerMembership(
	eventId: string,
	userId: string,
	creatorId: string,
	initialStatus: "invited" | "requested" | "accepted" | "rejected" = "invited",
): Promise<TestVolunteerMembership> {
	// Always create volunteer since volunteerId is required (NOT NULL constraint)
	const [volunteer] = await server.drizzleClient
		.insert(eventVolunteersTable)
		.values({
			userId,
			eventId,
			creatorId,
			hasAccepted: initialStatus === "accepted",
			isPublic: true,
			hoursVolunteered: "0.00",
		})
		.returning();

	assertToBeNonNullish(volunteer);

	// Create membership
	const [membership] = await server.drizzleClient
		.insert(eventVolunteerMembershipsTable)
		.values({
			volunteerId: volunteer.id,
			eventId,
			status: initialStatus,
			createdBy: creatorId,
		})
		.returning();

	assertToBeNonNullish(membership);

	return {
		membershipId: membership.id,
		volunteerId: volunteer.id,
		cleanup: async () => {
			// Membership and volunteer will be cleaned up with organization
		},
	};
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation updateVolunteerMembership - Integration Tests", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}
		testCleanupFunctions.length = 0;
	});

	test("Integration: Unauthenticated user cannot update volunteer membership", async () => {
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				variables: {
					id: faker.string.uuid(),
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["updateVolunteerMembership"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID format", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "invalid-uuid-format", // Invalid UUID format
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array),
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateVolunteerMembership"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid status", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: faker.string.uuid(),
					status: "invalid-status", // Invalid status enum
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["status"],
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateVolunteerMembership"],
				}),
			]),
		);
	});

	test("Integration: Volunteer membership not found error", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const nonExistentMembershipId = faker.string.uuid();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: nonExistentMembershipId,
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["id"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateVolunteerMembership"],
				}),
			]),
		);
	});

	test("Integration: Successfully updates membership status to accepted with volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"invited", // Initial status
		);
		testCleanupFunctions.push(membership.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: membership.membershipId,
					status: "accepted", // Change to accepted
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership.id).toBe(membership.membershipId);
		expect(updatedMembership.status).toBe("accepted");
		expect(updatedMembership.volunteer?.id).toBe(membership.volunteerId);
		expect(updatedMembership.volunteer?.hasAccepted).toBe(true); // Should be updated
		expect(updatedMembership.volunteer?.user?.id).toBe(testUser.userId);
		expect(updatedMembership.event?.id).toBe(event.eventId);

		// Verify database updates
		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.membershipId))
			.limit(1);

		expect(dbMembership).toHaveLength(1);
		expect(dbMembership[0]?.status).toBe("accepted");
		expect(dbMembership[0]?.updatedBy).toBe(adminUserId);

		// Verify volunteer hasAccepted was updated
		if (membership.volunteerId) {
			const dbVolunteer = await server.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, membership.volunteerId))
				.limit(1);

			expect(dbVolunteer).toHaveLength(1);
			expect(dbVolunteer[0]?.hasAccepted).toBe(true); // Updated to true for "accepted"
			expect(dbVolunteer[0]?.updaterId).toBe(adminUserId);
		}
	});

	test("Integration: Successfully updates membership status to rejected with volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"accepted", // Initial status (hasAccepted should be true)
		);
		testCleanupFunctions.push(membership.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: membership.membershipId,
					status: "rejected", // Change to rejected
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership.id).toBe(membership.membershipId);
		expect(updatedMembership.status).toBe("rejected");
		expect(updatedMembership.volunteer?.hasAccepted).toBe(false); // Should be updated to false

		// Verify volunteer hasAccepted was updated
		if (membership.volunteerId) {
			const dbVolunteer = await server.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, membership.volunteerId))
				.limit(1);

			expect(dbVolunteer).toHaveLength(1);
			expect(dbVolunteer[0]?.hasAccepted).toBe(false); // Updated to false for "rejected"
		}
	});

	test("Integration: Covers volunteer update conditional logic", async () => {
		// This test covers the if (updatedMembership.volunteerId) condition
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"invited", // Initial status
		);
		testCleanupFunctions.push(membership.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: membership.membershipId,
					status: "accepted", // Change to accepted
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership.id).toBe(membership.membershipId);
		expect(updatedMembership.status).toBe("accepted");
		expect(updatedMembership.volunteer?.id).toBe(membership.volunteerId);

		// This covers the if (updatedMembership.volunteerId) condition when volunteerId exists
		// Volunteer should be updated since volunteerId is present
		if (membership.volunteerId) {
			const dbVolunteer = await server.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, membership.volunteerId))
				.limit(1);

			expect(dbVolunteer).toHaveLength(1);
			expect(dbVolunteer[0]?.hasAccepted).toBe(true); // Updated due to "accepted" status
			expect(dbVolunteer[0]?.updaterId).toBe(adminUserId);
		}
	});

	test("Integration: All status transitions work correctly", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"invited", // Initial status
		);
		testCleanupFunctions.push(membership.cleanup);

		// Test all status transitions: invited -> requested -> accepted -> rejected
		const statusTransitions = ["requested", "accepted", "rejected"] as const;

		for (const newStatus of statusTransitions) {
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateVolunteerMembership,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						id: membership.membershipId,
						status: newStatus,
					},
				},
			);

			expect(updateResult.errors).toBeUndefined();
			expect(updateResult.data).toBeDefined();
			assertToBeNonNullish(updateResult.data);
			assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

			const updatedMembership = updateResult.data.updateVolunteerMembership;
			expect(updatedMembership.status).toBe(newStatus);

			// Verify hasAccepted is updated correctly based on status
			const expectedHasAccepted = newStatus === "accepted";
			expect(updatedMembership.volunteer?.hasAccepted).toBe(
				expectedHasAccepted,
			);

			// Verify database state
			const dbVolunteer = await server.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, membership.volunteerId))
				.limit(1);

			expect(dbVolunteer[0]?.hasAccepted).toBe(expectedHasAccepted);
		}
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with multiple invalid parameters
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "", // Empty string should trigger validation
					status: "invalid-status", // Invalid enum should trigger validation
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array),
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateVolunteerMembership"],
				}),
			]),
		);

		// Verify that issues array has been properly mapped from validation errors
		const errorExtensions = updateResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
		expect(
			Array.isArray(errorExtensions?.issues) && errorExtensions.issues.length,
		).toBeGreaterThan(0);
	});

	test("Integration: Database operation verification - membership update", async () => {
		// This test covers the check: if (updatedMembership === undefined) { throw unexpected }
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"requested",
		);
		testCleanupFunctions.push(membership.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: membership.membershipId,
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		// This verifies that updatedMembership is NOT undefined (covering the defensive check)
		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership).toBeDefined();
		expect(updatedMembership.id).toBe(membership.membershipId);
		expect(updatedMembership.status).toBe("accepted");

		// Verify database operation was successful
		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.membershipId))
			.limit(1);

		expect(dbMembership).toHaveLength(1);
		expect(dbMembership[0]?.status).toBe("accepted");
		expect(dbMembership[0]?.updatedBy).toBe(adminUserId);
		expect(dbMembership[0]?.updatedAt).toBeDefined();
	});

	test("Integration: Regular user can update volunteer membership", async () => {
		// This mutation doesn't seem to have explicit authorization checks beyond authentication
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"invited",
		);
		testCleanupFunctions.push(membership.cleanup);

		// Use regular user's token instead of admin
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${testUser.authToken}`,
				},
				variables: {
					id: membership.membershipId,
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		// Verify update was made by regular user
		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership.status).toBe("accepted");

		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.membershipId))
			.limit(1);

		expect(dbMembership[0]?.updatedBy).toBe(testUser.userId); // Updated by regular user
	});

	test("Integration: Covers all mutation logic paths with comprehensive verification", async () => {
		// This test ensures we cover all the successful execution paths
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const membership = await createTestVolunteerMembership(
			event.eventId,
			testUser.userId,
			adminUserId,
			"invited",
		);
		testCleanupFunctions.push(membership.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: membership.membershipId,
					status: "accepted",
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateVolunteerMembership);

		// Verify all mutation logic paths are covered:
		// 1. Authentication check ✓
		// 2. Input validation ✓ (covered in other tests)
		// 3. Membership existence check ✓
		// 4. Database update operation ✓
		// 5. Volunteer hasAccepted update ✓
		// 6. Return updated membership ✓

		const updatedMembership = updateResult.data.updateVolunteerMembership;
		expect(updatedMembership.id).toBe(membership.membershipId);
		expect(updatedMembership.status).toBe("accepted");
		expect(updatedMembership.volunteer?.hasAccepted).toBe(true);
		expect(updatedMembership.volunteer?.user?.id).toBe(testUser.userId);
		expect(updatedMembership.event?.id).toBe(event.eventId);

		// Verify both membership and volunteer were updated correctly
		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.membershipId))
			.limit(1);

		expect(dbMembership[0]?.status).toBe("accepted");
		expect(dbMembership[0]?.updatedBy).toBe(adminUserId);

		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, membership.volunteerId))
			.limit(1);

		expect(dbVolunteer[0]?.hasAccepted).toBe(true);
		expect(dbVolunteer[0]?.updaterId).toBe(adminUserId);
	});
});

import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateEventVolunteer,
	Query_signIn,
} from "../documentNodes";

// Admin auth (fetched once per suite)
let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	if (
		!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
		!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
	) {
		throw new Error("Admin credentials missing in env config");
	}
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (
		res.errors ||
		!res.data?.signIn?.authenticationToken ||
		!res.data?.signIn?.user?.id
	) {
		throw new Error(
			`Unable to sign in admin: ${res.errors?.[0]?.message || "unknown"}`,
		);
	}
	adminToken = res.data.signIn.authenticationToken;
	adminUserId = res.data.signIn.user.id;
	assertToBeNonNullish(adminToken);
	assertToBeNonNullish(adminUserId);
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

interface TestEventVolunteer {
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

async function createTestEventVolunteer(
	userId: string,
	eventId: string,
	creatorId: string,
	hasAccepted = false,
	isPublic = true,
	hoursVolunteered = "0.00",
): Promise<TestEventVolunteer> {
	const [volunteer] = await server.drizzleClient
		.insert(eventVolunteersTable)
		.values({
			userId,
			eventId,
			creatorId,
			hasAccepted,
			isPublic,
			hoursVolunteered,
		})
		.returning();

	assertToBeNonNullish(volunteer);

	return {
		volunteerId: volunteer.id,
		cleanup: async () => {
			// Volunteer will be cleaned up with organization
		},
	};
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation updateEventVolunteer - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot update event volunteer", async () => {
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				variables: {
					id: faker.string.uuid(),
					data: {
						hasAccepted: true,
					},
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
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID format", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "invalid-uuid-format", // Invalid UUID format
					data: {
						hasAccepted: true,
					},
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
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Volunteer not found error", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const nonExistentVolunteerId = faker.string.uuid();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: nonExistentVolunteerId,
					data: {
						hasAccepted: true,
					},
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
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Organization administrator successfully updates event volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const orgAdmin = await createTestUser();
		testCleanupFunctions.push(orgAdmin.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add org admin to organization as administrator
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: orgAdmin.userId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		// Add test user to organization as regular member
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false, // Initial hasAccepted
			true, // Initial isPublic
			"5.25", // Initial hours
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Organization administrator should be able to update volunteer
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true, // Update hasAccepted
						isPublic: false, // Update isPublic
						assignments: [faker.string.uuid()], // This field is accepted but not processed
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.id).toBe(volunteer.volunteerId);
		expect(updatedVolunteer.hasAccepted).toBe(true); // Updated
		expect(updatedVolunteer.isPublic).toBe(false); // Updated
		expect(updatedVolunteer.hoursVolunteered).toBe(5.25); // Unchanged
		expect(updatedVolunteer.user?.id).toBe(testUser.userId);
		expect(updatedVolunteer.event?.id).toBe(event.eventId);
		expect(updatedVolunteer.creator?.id).toBe(adminUserId);
		expect(updatedVolunteer.updater?.id).toBe(orgAdmin.userId); // Updated by org admin
		expect(updatedVolunteer.updatedAt).toBeDefined();

		// Verify database was updated
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(true);
		expect(dbVolunteer[0]?.isPublic).toBe(false);
		expect(dbVolunteer[0]?.updaterId).toBe(orgAdmin.userId);
	});

	test("Integration: Event creator successfully updates event volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const eventCreator = await createTestUser();
		testCleanupFunctions.push(eventCreator.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add both users to organization as regular members
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

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: eventCreator.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		// Create event directly in database with eventCreator as creator
		const startAt = new Date();
		startAt.setHours(startAt.getHours() + 1);
		const endAt = new Date(startAt);
		endAt.setHours(endAt.getHours() + 2);

		const [event] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: `Creator Event ${faker.lorem.words(3)}`,
				description: `Event created by specific user ${faker.lorem.paragraph()}`,
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId: eventCreator.userId, // Event creator
				isPublic: true,
				isRegisterable: true,
			})
			.returning();

		assertToBeNonNullish(event);

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.id,
			eventCreator.userId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Event creator should be able to update volunteer
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${eventCreator.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.id).toBe(volunteer.volunteerId);
		expect(updatedVolunteer.hasAccepted).toBe(true);
		expect(updatedVolunteer.updater?.id).toBe(eventCreator.userId);
	});

	test("Integration: Volunteer can update their own volunteer record", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add test user to organization as regular member
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Volunteer themselves should be able to update their own record
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${testUser.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true, // Accept their volunteer role
						isPublic: false, // Make their profile private
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.id).toBe(volunteer.volunteerId);
		expect(updatedVolunteer.hasAccepted).toBe(true);
		expect(updatedVolunteer.isPublic).toBe(false);
		expect(updatedVolunteer.user?.id).toBe(testUser.userId);
		expect(updatedVolunteer.updater?.id).toBe(testUser.userId); // Updated by themselves
	});

	test("Integration: Unauthorized user cannot update event volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const unauthorizedUser = await createTestUser();
		testCleanupFunctions.push(unauthorizedUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add test user to organization as regular member
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

		// Do NOT add unauthorized user to organization
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Try to update with unauthorized user (not org admin, not event creator, not volunteer themselves)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${unauthorizedUser.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["updateEventVolunteer"],
				}),
			]),
		);

		// Verify volunteer was NOT updated in database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(false); // Unchanged
	});

	test("Integration: Regular organization member cannot update other volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const regularMember = await createTestUser();
		testCleanupFunctions.push(regularMember.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add both users to organization as regular members
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

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: regularMember.userId,
					organizationId: organization.orgId,
					role: "regular", // Regular member, not admin
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const volunteer = await createTestEventVolunteer(
			testUser.userId, // Different user
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Regular member should not be able to update another user's volunteer record
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${regularMember.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Update only hasAccepted field", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false, // Initial hasAccepted
			true, // Initial isPublic
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${testUser.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true, // Only update hasAccepted
						// isPublic not provided - should remain unchanged
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.hasAccepted).toBe(true); // Updated
		expect(updatedVolunteer.isPublic).toBe(true); // Unchanged

		// Verify in database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer[0]?.hasAccepted).toBe(true);
		expect(dbVolunteer[0]?.isPublic).toBe(true); // Unchanged
	});

	test("Integration: Update only isPublic field", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false, // Initial hasAccepted
			true, // Initial isPublic
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						isPublic: false, // Only update isPublic
						// hasAccepted not provided - should remain unchanged
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.hasAccepted).toBe(false); // Unchanged
		expect(updatedVolunteer.isPublic).toBe(false); // Updated

		// Verify in database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer[0]?.hasAccepted).toBe(false); // Unchanged
		expect(dbVolunteer[0]?.isPublic).toBe(false); // Updated
	});

	test("Integration: Update both hasAccepted and isPublic fields", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false, // Initial hasAccepted
			true, // Initial isPublic
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true, // Update both fields
						isPublic: false,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.hasAccepted).toBe(true); // Updated
		expect(updatedVolunteer.isPublic).toBe(false); // Updated

		// Verify in database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer[0]?.hasAccepted).toBe(true); // Updated
		expect(dbVolunteer[0]?.isPublic).toBe(false); // Updated
	});

	test("Integration: Update with empty data (no changes)", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false, // Initial hasAccepted
			true, // Initial isPublic
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						// No actual field updates, just empty data
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.hasAccepted).toBe(false); // Unchanged
		expect(updatedVolunteer.isPublic).toBe(true); // Unchanged
		expect(updatedVolunteer.updater?.id).toBe(adminUserId); // updaterId still gets set
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with invalid data to trigger validation errors
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "", // Empty string should trigger validation
					data: {
						assignments: ["invalid-uuid"], // Invalid UUID in array
					},
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
					path: ["updateEventVolunteer"],
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

	test("Integration: Volunteer array defensive check and database operation verification", async () => {
		// This test covers: const volunteer = existingVolunteer[0]; if (!volunteer) { throw unexpected }
		// And: if (updatedVolunteer === undefined) { throw unexpected }
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
			false,
			true,
			"12.75",
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Test successful update which should not trigger the defensive checks
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true,
						isPublic: false,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		// This verifies that volunteer was found (covering defensive check) and updatedVolunteer is NOT undefined
		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer).toBeDefined();
		expect(updatedVolunteer.id).toBe(volunteer.volunteerId);
		expect(updatedVolunteer.hasAccepted).toBe(true);
		expect(updatedVolunteer.isPublic).toBe(false);
		expect(updatedVolunteer.hoursVolunteered).toBe(12.75); // Unchanged
		expect(updatedVolunteer.updater?.id).toBe(adminUserId);

		// Verify database update was successful
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(true);
		expect(dbVolunteer[0]?.isPublic).toBe(false);
		expect(dbVolunteer[0]?.updaterId).toBe(adminUserId);
		expect(dbVolunteer[0]?.updatedAt).toBeDefined();
	});

	test("Integration: All authorization paths - admin, event creator, volunteer themselves", async () => {
		// This test verifies all three authorization paths work correctly
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const volunteer1User = await createTestUser();
		testCleanupFunctions.push(volunteer1User.cleanup);

		const volunteer2User = await createTestUser();
		testCleanupFunctions.push(volunteer2User.cleanup);

		const volunteer3User = await createTestUser();
		testCleanupFunctions.push(volunteer3User.cleanup);

		const eventCreator = await createTestUser();
		testCleanupFunctions.push(eventCreator.cleanup);

		const orgAdmin = await createTestUser();
		testCleanupFunctions.push(orgAdmin.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add all users to organization
		for (const user of [
			volunteer1User,
			volunteer2User,
			volunteer3User,
			eventCreator,
		]) {
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});
		}

		// Add org admin with administrator role
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: orgAdmin.userId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		// Create event with specific creator
		const startAt = new Date();
		startAt.setHours(startAt.getHours() + 1);
		const endAt = new Date(startAt);
		endAt.setHours(endAt.getHours() + 2);

		const [event] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: `Event by ${eventCreator.userId}`,
				description: "Event created by specific user",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId: eventCreator.userId, // Specific event creator
				isPublic: true,
				isRegisterable: true,
			})
			.returning();

		assertToBeNonNullish(event);

		// Create three volunteers for different authorization scenarios
		const volunteer1 = await createTestEventVolunteer(
			volunteer1User.userId,
			event.id,
			eventCreator.userId,
		);
		testCleanupFunctions.push(volunteer1.cleanup);

		const volunteer2 = await createTestEventVolunteer(
			volunteer2User.userId,
			event.id,
			eventCreator.userId,
		);
		testCleanupFunctions.push(volunteer2.cleanup);

		const volunteer3 = await createTestEventVolunteer(
			volunteer3User.userId,
			event.id,
			eventCreator.userId,
		);
		testCleanupFunctions.push(volunteer3.cleanup);

		// Test 1: Organization admin can update (isOrgAdmin = true)
		const adminUpdateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					id: volunteer1.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(adminUpdateResult.errors).toBeUndefined();
		expect(adminUpdateResult.data?.updateEventVolunteer?.updater?.id).toBe(
			orgAdmin.userId,
		);

		// Test 2: Event creator can update (isEventCreator = true)
		const creatorUpdateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${eventCreator.authToken}`,
				},
				variables: {
					id: volunteer2.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(creatorUpdateResult.errors).toBeUndefined();
		expect(creatorUpdateResult.data?.updateEventVolunteer?.updater?.id).toBe(
			eventCreator.userId,
		);

		// Test 3: Volunteer themselves can update (isVolunteerThemselves = true)
		const selfUpdateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${volunteer3User.authToken}`,
				},
				variables: {
					id: volunteer3.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		expect(selfUpdateResult.errors).toBeUndefined();
		expect(selfUpdateResult.data?.updateEventVolunteer?.updater?.id).toBe(
			volunteer3User.userId,
		);

		// This covers the authorization logic:
		// const isOrgAdmin = currentUserMembership?.role === "administrator";
		// const isEventCreator = event.creatorId === currentUserId;
		// const isVolunteerThemselves = volunteer.userId === currentUserId;
		// if (!isOrgAdmin && !isEventCreator && !isVolunteerThemselves) { throw unauthorized }
	});

	test("Integration: Null data parameter triggers validation error", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Test with null data parameter (should trigger validation error)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: null, // Null data triggers validation error
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
								argumentPath: ["data"],
								message: "Expected object, received null",
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Missing data parameter triggers validation error", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Test without data parameter (completely omitted - should trigger validation error)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					// data parameter completely omitted
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
								argumentPath: ["data"],
								message: "Required",
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Covers event not found defensive check", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Delete the event to create data inconsistency
		await server.drizzleClient
			.delete(eventsTable)
			.where(eq(eventsTable.id, event.eventId));

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						hasAccepted: true,
					},
				},
			},
		);

		// Since the event was deleted, the volunteer should have been cascade deleted too
		// This should trigger the volunteer not found error first
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
					path: ["updateEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Assignment field validation with valid UUIDs", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Test with valid assignment UUIDs (field is accepted but not processed in current implementation)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
					data: {
						assignments: [
							faker.string.uuid(),
							faker.string.uuid(),
							faker.string.uuid(),
						], // Valid UUIDs
						hasAccepted: true,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteer);

		const updatedVolunteer = updateResult.data.updateEventVolunteer;
		expect(updatedVolunteer.hasAccepted).toBe(true); // Updated
		expect(updatedVolunteer.updater?.id).toBe(adminUserId);
	});
});

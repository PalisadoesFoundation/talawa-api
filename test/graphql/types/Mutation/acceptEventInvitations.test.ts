import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, it, suite, test } from "vitest";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventInvitationsTable } from "~/src/drizzle/tables/eventInvitations";
import { usersTable } from "~/src/drizzle/tables/users";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_acceptEventInvitation,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

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
	email: string;
	cleanup: () => Promise<void>;
}

async function createTestOrganization(): Promise<TestOrganization> {
	await new Promise((resolve) => setTimeout(resolve, 300));

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
			try {
				// Cleanup organization (cascade deletes related records)
			} catch (_error) {
				// Silently ignore cleanup errors
			}
		},
	};
}

async function createTestUser(email?: string): Promise<TestUser> {
	await new Promise((resolve) => setTimeout(resolve, 400));

	const { token: adminToken } = await ensureAdminAuth();
	const testEmail = email || `email${faker.string.ulid()}@email.com`;
	const res = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: testEmail,
				isEmailAddressVerified: true,
				name: "Test User",
				password: "password123",
				role: "regular",
			},
		},
	});
	if (
		!res.data?.createUser?.authenticationToken ||
		!res.data?.createUser?.user?.id
	)
		throw new Error(res.errors?.[0]?.message || "user create failed");

	return {
		userId: res.data.createUser.user.id,
		authToken: res.data.createUser.authenticationToken,
		email: testEmail,
		cleanup: async () => {
			try {
				// Cleanup user if needed
			} catch (_error) {
				// Silently ignore cleanup errors
			}
		},
	};
}

async function createTestEvent(organizationId: string): Promise<TestEvent> {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const { token: adminAuthToken, userId: adminId } = await ensureAdminAuth();
	const startAt = new Date();
	startAt.setHours(startAt.getHours() + 1);
	const endAt = new Date(startAt);
	endAt.setHours(endAt.getHours() + 2);
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				memberId: adminId,
				organizationId: organizationId,
				role: "administrator",
			},
		},
	});

	await new Promise((resolve) => setTimeout(resolve, 300));

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
		cleanup: async () => {},
	};
}

beforeAll(async () => {
	await new Promise((resolve) => setTimeout(resolve, 600));
	await ensureAdminAuth();
});

suite("Mutation acceptEventInvitation - Integration Tests", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		const cleanupFunctionsToRun = [...testCleanupFunctions];
		testCleanupFunctions.length = 0;

		for (const cleanup of cleanupFunctionsToRun.reverse()) {
			try {
				await cleanup();
			} catch (_error) {
				// Silently ignore cleanup errors
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	});

	test("Integration: Unauthenticated user cannot accept event invitation", async () => {
		await new Promise((resolve) => setTimeout(resolve, 400));

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				variables: {
					input: {
						invitationToken: "valid-token-but-unauthenticated",
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Valid invitation successfully accepted", async () => {
		await new Promise((resolve) => setTimeout(resolve, 600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;
		const testInviteeName = "John Doe";

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: testInviteeName,
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data).toBeDefined();
		assertToBeNonNullish(acceptResult.data);
		assertToBeNonNullish(acceptResult.data.acceptEventInvitation);

		const invitation = acceptResult.data.acceptEventInvitation;
		expect(invitation.invitationToken).toBe(testToken);
		expect(invitation.inviteeEmail).toBe(testEmail);
		expect(invitation.inviteeName).toBe(testInviteeName);
		expect(invitation.status).toBe("accepted");
		expect(invitation.userId).toBe(testUser.userId);
		expect(invitation.respondedAt).toBeDefined();
		expect(invitation.eventId).toBe(event.eventId);

		// Verify organization membership was created
		const membership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (orgMembership, { and, eq }) =>
					and(
						eq(orgMembership.memberId, testUser.userId),
						eq(orgMembership.organizationId, organization.orgId),
					),
			});
		expect(membership).toBeDefined();
		expect(membership?.role).toBe("regular");

		// Verify event attendee was created
		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq }) =>
					and(
						eq(attendee.userId, testUser.userId),
						eq(attendee.eventId, event.eventId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: Invalid token throws appropriate error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 700));

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: "invalid-token-that-does-not-exist",
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					message: expect.any(String),
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: User with different email cannot accept invitation", async () => {
		await new Promise((resolve) => setTimeout(resolve, 800));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const invitedEmail = `invited${faker.string.ulid()}@example.com`;
		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: invitedEmail,
			inviteeName: "Invited User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		// Create a user with different email
		const differentUser = await createTestUser();
		testCleanupFunctions.push(differentUser.cleanup);

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${differentUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthorizedActionExtensions>({
						code: "unauthorized_action",
					}),
					message: "You are not authorized to perform this action.",
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Already accepted invitation cannot be accepted again", async () => {
		await new Promise((resolve) => setTimeout(resolve, 900));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "accepted", // Already accepted
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "invitationToken"],
								message: "Invitation is not pending",
							},
						],
					}),
					message: "You have provided invalid arguments for this action.",
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Expired invitation cannot be accepted", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "invitationToken"],
								message: "Invitation has expired",
							},
						],
					}),
					message: "You have provided invalid arguments for this action.",
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: User already in organization still gets invitation accepted", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		// Add user to organization first
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

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		// Verify user is still member of organization
		const membership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (orgMembership, { and, eq }) =>
					and(
						eq(orgMembership.memberId, testUser.userId),
						eq(orgMembership.organizationId, organization.orgId),
					),
			});
		expect(membership).toBeDefined();

		// Verify event attendee was created
		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq }) =>
					and(
						eq(attendee.userId, testUser.userId),
						eq(attendee.eventId, event.eventId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: User already registered as attendee updates existing record", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1200));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		// Add user as existing attendee (but not invited)
		await server.drizzleClient.insert(eventAttendeesTable).values({
			id: faker.string.uuid(),
			userId: testUser.userId,
			eventId: event.eventId,
			isInvited: false,
			isRegistered: false,
		});

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		// Verify existing attendee record was updated
		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq }) =>
					and(
						eq(attendee.userId, testUser.userId),
						eq(attendee.eventId, event.eventId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: Empty token throws validation error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1300));

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: "",
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Email case insensitivity works correctly", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1400));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const invitedEmail = `Test.User${faker.string.ulid()}@EXAMPLE.COM`;
		const testUser = await createTestUser(invitedEmail.toLowerCase());
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: invitedEmail, // Mixed case in invitation
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");
	});

	it("Integration: User not found in database throws unauthenticated error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, testUser.userId));

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeDefined();
		expect(acceptResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["acceptEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Event invitation with null recurring event instance ID works correctly", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			recurringEventInstanceId: null,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		const invitation = acceptResult.data.acceptEventInvitation;
		assertToBeNonNullish(invitation);
		expect(invitation.eventId).toBe(event.eventId);
		expect(invitation.recurringEventInstanceId).toBeNull();

		const membership =
			await server.drizzleClient.query.organizationMembershipsTable.findFirst({
				where: (orgMembership, { and, eq }) =>
					and(
						eq(orgMembership.memberId, testUser.userId),
						eq(orgMembership.organizationId, organization.orgId),
					),
			});
		expect(membership).toBeDefined();
		expect(membership?.role).toBe("regular");

		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq }) =>
					and(
						eq(attendee.userId, testUser.userId),
						eq(attendee.eventId, event.eventId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: Invitation without event or recurring event creates generic attendee", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1700));

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		const invitation = acceptResult.data.acceptEventInvitation;
		assertToBeNonNullish(invitation);
		expect(invitation.eventId).toBeNull();
		expect(invitation.recurringEventInstanceId).toBeNull();

		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq, isNull }) =>
					and(
						eq(attendee.userId, testUser.userId),
						isNull(attendee.eventId),
						isNull(attendee.recurringEventInstanceId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: User already registered as event attendee updates existing record (covers lines 183-223)", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1800));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		await server.drizzleClient.insert(eventAttendeesTable).values({
			id: faker.string.uuid(),
			userId: testUser.userId,
			eventId: event.eventId,
			isInvited: false,
			isRegistered: false,
		});

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq }) =>
					and(
						eq(attendee.userId, testUser.userId),
						eq(attendee.eventId, event.eventId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});

	it("Integration: User already has generic attendee record updates existing record", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1900));

		const { token: _adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testUser = await createTestUser(testEmail);
		testCleanupFunctions.push(testUser.cleanup);

		await server.drizzleClient.insert(eventAttendeesTable).values({
			id: faker.string.uuid(),
			userId: testUser.userId,
			isInvited: false,
			isRegistered: false,
		});

		const testToken = `test-token-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const acceptResult = await mercuriusClient.mutate(
			Mutation_acceptEventInvitation,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(acceptResult.errors).toBeUndefined();
		expect(acceptResult.data?.acceptEventInvitation?.status).toBe("accepted");

		const attendee =
			await server.drizzleClient.query.eventAttendeesTable.findFirst({
				where: (attendee, { and, eq, isNull }) =>
					and(
						eq(attendee.userId, testUser.userId),
						isNull(attendee.eventId),
						isNull(attendee.recurringEventInstanceId),
					),
			});
		expect(attendee).toBeDefined();
		expect(attendee?.isInvited).toBe(true);
		expect(attendee?.isRegistered).toBe(true);
	});
});

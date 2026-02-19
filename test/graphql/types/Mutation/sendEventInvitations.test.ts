import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, it, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_sendEventInvitations,
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
	assertToBeNonNullish(adminToken);
	assertToBeNonNullish(adminUserId);
	return { token: adminToken as string, userId: adminUserId as string };
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

async function createTestOrganization(): Promise<TestOrganization> {
	// Add delay to prevent rate limiting
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
			// Cleanup organization (cascade deletes related records)
			// Note: You may need to add a deleteOrganization mutation if not already present
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 400));

	const { token: adminToken } = await ensureAdminAuth();
	const res = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `email${faker.string.ulid()}@email.com`,
				isEmailAddressVerified: false,
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
		cleanup: async () => {
			// Cleanup user if needed
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
		cleanup: async () => {
			/* Events get cleaned up when organization is deleted */
		},
	};
}

beforeAll(async () => {
	await new Promise((resolve) => setTimeout(resolve, 600));
	await ensureAdminAuth();
});

suite("Mutation sendEventInvitations - Integration Tests", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		const cleanupFunctionsToRun = [...testCleanupFunctions];
		testCleanupFunctions.length = 0;

		for (const cleanup of cleanupFunctionsToRun.reverse()) {
			try {
				await cleanup();
			} catch (_error) {
				console.error(_error);
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	});

	test("Integration: Unauthenticated user cannot send event invitations", async () => {
		await new Promise((resolve) => setTimeout(resolve, 400));

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				variables: {
					input: {
						eventId: faker.string.uuid(),
						recipients: [{ email: "test@example.com", name: "Test User" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Admin successfully sends event invitations to single recipient", async () => {
		await new Promise((resolve) => setTimeout(resolve, 600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const recipientEmail = `recipient${faker.string.ulid()}@example.com`;
		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [{ email: recipientEmail, name: "John Doe" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(Array.isArray(invitations)).toBe(true);
		expect(invitations).toHaveLength(1);

		const invitation = invitations[0];
		assertToBeNonNullish(invitation);
		expect(invitation.id).toBeDefined();
		expect(invitation.inviteeEmail).toBe(recipientEmail.toLowerCase());
		expect(invitation.inviteeName).toBe("John Doe");
		expect(invitation.invitationToken).toBeDefined();
		expect(invitation.status).toBe("pending");
		expect(invitation.expiresAt).toBeDefined();
	});

	it("Integration: Admin successfully sends event invitations to multiple recipients", async () => {
		await new Promise((resolve) => setTimeout(resolve, 700));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const recipients = [
			{ email: `user1${faker.string.ulid()}@example.com`, name: "User One" },
			{ email: `user2${faker.string.ulid()}@example.com`, name: "User Two" },
			{ email: `user3${faker.string.ulid()}@example.com`, name: "User Three" },
		];

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data
			.sendEventInvitations as Array<{
			inviteeEmail?: string;
			inviteeName?: string;
			status?: string;
			invitationToken?: string;
		}>;
		expect(invitations).toHaveLength(3);

		for (let i = 0; i < invitations.length; i++) {
			const inv = invitations[i];
			assertToBeNonNullish(inv);
			expect(inv.inviteeEmail).toBe(recipients[i]?.email.toLowerCase());
			expect(inv.inviteeName).toBe(recipients[i]?.name);
			expect(inv.status).toBe("pending");
			expect(inv.invitationToken).toBeDefined();
		}
	});

	it("Integration: Invitations with custom message and expiration", async () => {
		await new Promise((resolve) => setTimeout(resolve, 800));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const customMessage = "Please join our important community event!";
		const expiresInDays = 14;

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [
							{
								email: `recipient${faker.string.ulid()}@example.com`,
								name: "Test Recipient",
							},
						],
						message: customMessage,
						expiresInDays,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(1);

		const invitation = invitations[0];
		assertToBeNonNullish(invitation);
		expect(invitation.expiresAt).toBeDefined();

		assertToBeNonNullish(invitation.expiresAt);
		const expiresDate = new Date(invitation.expiresAt);
		const now = new Date();
		const daysDifference = Math.floor(
			(expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		expect(daysDifference).toBeGreaterThanOrEqual(13);
		expect(daysDifference).toBeLessThanOrEqual(14);
	});

	it("Integration: Non-admin user cannot send event invitations", async () => {
		await new Promise((resolve) => setTimeout(resolve, 900));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [{ email: "test@example.com", name: "Test" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Validation error when no recipients provided", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Validation error when event ID is invalid", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const { token: adminAuth } = await ensureAdminAuth();

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: faker.string.uuid(),
						recipients: [{ email: "test@example.com", name: "Test" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Duplicate emails are deduplicated in recipients list", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1200));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const duplicateEmail = `duplicate${faker.string.ulid()}@example.com`;
		const recipients = [
			{ email: duplicateEmail, name: "User One" },
			{ email: duplicateEmail, name: "User Two" }, // Duplicate email
			{ email: `unique${faker.string.ulid()}@example.com`, name: "User Three" },
		];

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(2);
	});

	it("Integration: Email addresses are normalized (case-insensitive)", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1300));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const baseEmail = `test${faker.string.ulid()}@example.com`;
		const recipients = [
			{ email: baseEmail.toUpperCase(), name: "User One" },
			{ email: baseEmail.toLowerCase(), name: "User Two" },
		];

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(1);
		const firstInvitation = invitations[0];
		assertToBeNonNullish(firstInvitation);
		expect(firstInvitation.inviteeEmail).toBe(baseEmail.toLowerCase());
	});

	it("Integration: Organization admin can send invitations", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1400));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 300));

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [
							{
								email: `orgadmin${faker.string.ulid()}@example.com`,
								name: "Test",
							},
						],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(1);
	});

	it("Integration: Each invitation has unique token", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const recipients = [
			{ email: `user1${faker.string.ulid()}@example.com`, name: "User 1" },
			{ email: `user2${faker.string.ulid()}@example.com`, name: "User 2" },
			{ email: `user3${faker.string.ulid()}@example.com`, name: "User 3" },
		];

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(3);

		const tokens = (invitations as Array<{ invitationToken: string }>).map(
			(inv) => inv.invitationToken,
		);
		const uniqueTokens = new Set(tokens);
		expect(uniqueTokens.size).toBe(3);
	});

	it("Integration: Admin sends invitations using emails array", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const emails = [
			`email1${faker.string.ulid()}@example.com`,
			`email2${faker.string.ulid()}@example.com`,
		];

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						emails,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(2);

		for (let i = 0; i < invitations.length; i++) {
			const inv = invitations[i];
			assertToBeNonNullish(inv);
			expect(inv.inviteeEmail).toBe(emails[i]?.toLowerCase());
			expect(inv.inviteeName).toBeNull();
			expect(inv.status).toBe("pending");
			expect(inv.invitationToken).toBeDefined();
		}
	});

	it("Integration: Error when neither eventId nor recurringEventInstanceId provided", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1700));

		const { token: adminAuth } = await ensureAdminAuth();

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						recipients: [{ email: "test@example.com", name: "Test" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input"],
								message:
									"Either eventId or recurringEventInstanceId must be provided",
							},
						],
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Error when recurring event instance ID is invalid", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1800));

		const { token: adminAuth } = await ensureAdminAuth();

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						recurringEventInstanceId: faker.string.uuid(),
						recipients: [{ email: "test@example.com", name: "Test" }],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "recurringEventInstanceId"] }],
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Error when too many recipient emails provided", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1900));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Create 101 recipients to exceed the MAX_EMAILS limit of 100
		const recipients = Array.from({ length: 101 }, (_, i) => ({
			email: `user${i}${faker.string.ulid()}@example.com`,
			name: `User ${i}`,
		}));

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients,
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeDefined();
		expect(sendEventInvitationsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input"],
								message: "Too many recipient emails; max 100",
							},
						],
					}),
					message: expect.any(String),
					path: ["sendEventInvitations"],
				}),
			]),
		);
	});

	it("Integration: Regular user with organization admin role can send invitations", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Make the test user an organization admin
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 300));

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${testUser.authToken}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [
							{
								email: `orgadmin${faker.string.ulid()}@example.com`,
								name: "Test",
							},
						],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(1);
	});

	it("Integration: System administrator can send invitations without organization membership", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2100));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Create a system administrator user
		const { token: adminAuth } = await ensureAdminAuth();
		const systemAdminResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						emailAddress: `sysadmin${faker.string.ulid()}@example.com`,
						isEmailAddressVerified: true,
						name: "System Admin",
						password: "password123",
						role: "administrator",
					},
				},
			},
		);

		if (!systemAdminResult.data?.createUser?.authenticationToken) {
			throw new Error("Failed to create system admin user");
		}

		const systemAdminToken =
			systemAdminResult.data.createUser.authenticationToken;

		const sendEventInvitationsResult = await mercuriusClient.mutate(
			Mutation_sendEventInvitations,
			{
				headers: { authorization: `bearer ${systemAdminToken}` },
				variables: {
					input: {
						eventId: event.eventId,
						recipients: [
							{
								email: `sysadmin${faker.string.ulid()}@example.com`,
								name: "System Admin Test",
							},
						],
					},
				},
			},
		);

		expect(sendEventInvitationsResult.errors).toBeUndefined();
		expect(sendEventInvitationsResult.data).toBeDefined();
		assertToBeNonNullish(sendEventInvitationsResult.data);
		assertToBeNonNullish(sendEventInvitationsResult.data.sendEventInvitations);

		const invitations = sendEventInvitationsResult.data.sendEventInvitations;
		expect(invitations).toHaveLength(1);
	});
});

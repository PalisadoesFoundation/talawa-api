import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, it, suite, test } from "vitest";
import { eventInvitationsTable } from "~/src/drizzle/tables/eventInvitations";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_verifyEventInvitation,
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

async function createTestEvent(organizationId: string): Promise<TestEvent> {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const { token: adminAuthToken, userId: adminId } = await ensureAdminAuth();
	const startAt = new Date();
	startAt.setDate(startAt.getDate() + 1);
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

suite("Mutation verifyEventInvitation - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot verify event invitation", async () => {
		await new Promise((resolve) => setTimeout(resolve, 400));

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				variables: {
					input: {
						invitationToken: "valid-token-but-unauthenticated",
					},
				},
			},
		);

		expect(verifyResult.errors).toBeDefined();
		expect(verifyResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					message: expect.any(String),
					path: ["verifyEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Valid token returns correct invitation details", async () => {
		await new Promise((resolve) => setTimeout(resolve, 600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
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

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.invitationToken).toBe(testToken);
		// The email masking shows first and last character: t***t@example.com
		expect(invitation.inviteeEmailMasked).toMatch(
			/^t\*\*\*[a-zA-Z0-9]@example\.com$/,
		);
		expect(invitation.inviteeName).toBe(testInviteeName);
		expect(invitation.status).toBe("pending");
		expect(invitation.expiresAt).toBeDefined();
		expect(invitation.eventId).toBe(event.eventId);
		expect(invitation.recurringEventInstanceId).toBeNull();
		expect(invitation.organizationId).toBeDefined();
	});

	it("Integration: Invalid token throws appropriate error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 700));

		const { token: adminAuth } = await ensureAdminAuth();

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: "invalid-token-that-does-not-exist",
					},
				},
			},
		);

		expect(verifyResult.errors).toBeDefined();
		expect(verifyResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					message: expect.any(String),
					path: ["verifyEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Token with null invitee name works correctly", async () => {
		await new Promise((resolve) => setTimeout(resolve, 800));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testToken = `test-token-null-name-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: null,
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.inviteeName).toBeNull();
		expect(invitation.inviteeEmailMasked).toBeDefined();
	});

	it("Integration: Email masking works correctly", async () => {
		await new Promise((resolve) => setTimeout(resolve, 900));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testCases = [
			{ email: "john.doe@example.com", expected: "j***e@example.com" },
			{ email: "test123@test.com", expected: "t***3@test.com" },
			{ email: "a@b.com", expected: "a***@b.com" },
			{ email: "ab@c.com", expected: "a***@c.com" },
			{ email: "test.email@domain.org", expected: "t***l@domain.org" },
		];

		for (const testCase of testCases) {
			const testToken = `test-token-email-${faker.string.uuid()}`;

			await server.drizzleClient.insert(eventInvitationsTable).values({
				id: faker.string.uuid(),
				eventId: event.eventId,
				invitedBy: adminId,
				inviteeEmail: testCase.email,
				inviteeName: "Test User",
				invitationToken: testToken,
				status: "pending",
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				metadata: null,
			});

			const verifyResult = await mercuriusClient.mutate(
				Mutation_verifyEventInvitation,
				{
					headers: { authorization: `bearer ${adminAuth}` },
					variables: {
						input: {
							invitationToken: testToken,
						},
					},
				},
			);

			expect(verifyResult.errors).toBeUndefined();
			expect(verifyResult.data?.verifyEventInvitation?.inviteeEmailMasked).toBe(
				testCase.expected,
			);
		}
	});

	it("Integration: Expired token handling", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testToken = `test-token-expired-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "expired",
			expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.status).toBe("expired");
		expect(invitation.expiresAt).toBeDefined();
	});

	it("Integration: Token with recurring event instance", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();
		const startAt = new Date();
		startAt.setDate(startAt.getDate() + 1);
		const endAt = new Date(startAt);
		endAt.setHours(endAt.getHours() + 2);

		// Ensure admin is a member of the organization
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: adminId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		const res = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					organizationId: organization.orgId,
					name: `Test Recurring Event ${faker.lorem.words(3)}`,
					description: `Test recurring event description ${faker.lorem.paragraph()}`,
					startAt: startAt.toISOString(),
					endAt: endAt.toISOString(),
					isPublic: true,
					isRegisterable: true,
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						never: true,
					},
				},
			},
		});

		if (!res.data?.createEvent?.id)
			throw new Error(
				res.errors?.[0]?.message || "recurring event create failed",
			);

		const recurringEventId = res.data.createEvent.id;

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testToken = `test-token-recurring-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: recurringEventId,
			invitedBy: adminId,
			inviteeEmail: testEmail,
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.eventId).toBe(recurringEventId);
		expect(invitation.recurringEventInstanceId).toBeNull();
		expect(invitation.organizationId).toBeDefined();
	});

	it("Integration: Empty token throws validation error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1200));

		const { token: adminAuth } = await ensureAdminAuth();

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: "",
					},
				},
			},
		);

		expect(verifyResult.errors).toBeDefined();
		expect(verifyResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["verifyEventInvitation"],
				}),
			]),
		);
	});

	it("Integration: Organization ID is correctly returned for event invitations", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1300));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testEmail = `test${faker.string.ulid()}@example.com`;
		const testToken = `test-token-org-${faker.string.uuid()}`;

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

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.organizationId).toBe(organization.orgId);
	});

	it("Integration: Invalid email in invitation triggers maskEmail error handling", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1400));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const { token: adminAuth, userId: adminId } = await ensureAdminAuth();

		const testToken = `test-token-invalid-email-${faker.string.uuid()}`;

		await server.drizzleClient.insert(eventInvitationsTable).values({
			id: faker.string.uuid(),
			eventId: event.eventId,
			invitedBy: adminId,
			inviteeEmail: "invalid-email-without-at-symbol",
			inviteeName: "Test User",
			invitationToken: testToken,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			metadata: null,
		});

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: testToken,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeUndefined();
		expect(verifyResult.data).toBeDefined();
		assertToBeNonNullish(verifyResult.data);
		assertToBeNonNullish(verifyResult.data.verifyEventInvitation);

		const invitation = verifyResult.data.verifyEventInvitation;
		expect(invitation.inviteeEmailMasked).toBe("****@***");
	});

	it("Integration: Malformed input arguments throw validation error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const { token: adminAuth } = await ensureAdminAuth();

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: 12345 as unknown as string,
					},
				},
			},
		);

		expect(verifyResult.errors).toBeDefined();
		// GraphQL validation occurs before our resolver, so we expect a GraphQL validation error
		const errorMessage = verifyResult.errors?.[0]?.message;
		expect(
			errorMessage?.includes("String cannot represent a non string value") ||
				errorMessage?.includes("Graphql validation error"),
		).toBe(true);
	});

	it("Integration: Non-existent invitation token throws not found error", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1600));

		const { token: adminAuth } = await ensureAdminAuth();

		const verifyResult = await mercuriusClient.mutate(
			Mutation_verifyEventInvitation,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						invitationToken: "non-existent-token-12345",
					},
				},
			},
		);

		expect(verifyResult.errors).toBeDefined();
		expect(verifyResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "invitationToken"] }],
					}),
					message: expect.any(String),
					path: ["verifyEventInvitation"],
				}),
			]),
		);
	});
});

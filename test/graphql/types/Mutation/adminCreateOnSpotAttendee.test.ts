import { faker } from "@faker-js/faker";
import { expect, suite, test, afterEach, afterAll } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_adminCreateOnSpotAttendee,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,

	Mutation_deleteUser,
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

/**
 * Tracking arrays for cleanup - prevents DB entity leaks in tests
 */
const trackedEntityIds = {
	organizationIds: [] as string[],
	userIds: [] as string[],
	membershipIds: [] as string[],
};

/**
 * Helper function to cleanup tracked entities
 * Deletes organizations (which cascades memberships), then remaining users
 */
async function cleanupTrackedEntities(): Promise<void> {
	// Delete organizations first (cascades to memberships)
	for (const orgId of trackedEntityIds.organizationIds) {
		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId },
				},
			});
		} catch (error) {
			// Silently ignore errors - organization may already be deleted
			console.log(`Failed to delete organization ${orgId}:`, (error as Error).message);
		}
	}

	// Delete users individually if not already cascade-deleted
	for (const userId of trackedEntityIds.userIds) {
		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: userId },
				},
			});
		} catch (error) {
			// Silently ignore errors - user may already be deleted
			console.log(`Failed to delete user ${userId}:`, (error as Error).message);
		}
	}

	// Clear tracking arrays
	trackedEntityIds.organizationIds = [];
	trackedEntityIds.userIds = [];
	trackedEntityIds.membershipIds = [];
}

suite("Mutation field adminCreateOnSpotAttendee", () => {
	/**
	 * Cleanup hook: runs after each test to prevent DB entity leaks
	 * Deletes all tracked organizations and users created during the test
	 */
	afterEach(async () => {
		await cleanupTrackedEntities();
	});

	/**
	 * Fallback cleanup hook: runs after all tests in this suite
	 * Ensures any remaining entities are cleaned up to prevent test pollution
	 */
	afterAll(async () => {
		await cleanupTrackedEntities();
	});

	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: faker.internet.email(),
							password: "Test123!@#",
							selectedOrganization: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the organization does not exist", () => {
		test("should return an error with forbidden_action_on_arguments_associated_resources code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: faker.internet.email(),
							password: "Test123!@#",
							selectedOrganization: faker.string.uuid(), // Non-existent organization
						},
					},
				},
			);
			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "selectedOrganization"],
									message: "This organization does not exist.",
								}),
							]),
						}),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});

	suite("when the email address is already registered", () => {
		test("should return an error with forbidden_action_on_arguments_associated_resources code", async () => {
			// Create organization first
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Duplicate Email Test Org ${faker.string.ulid()}`,
							description: "Organization for duplicate email testing",
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
			trackedEntityIds.organizationIds.push(orgId);
			trackedEntityIds.organizationIds.push(orgId);

			// Add admin as organization member with administrator role
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			// Create a regular user with a known email
			const { userId: existingUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(existingUserId);
			trackedEntityIds.userIds.push(existingUserId);
			trackedEntityIds.userIds.push(existingUserId);

			// Fetch the user from database to get their email
			const existingUser =
				await server.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, existingUserId),
				});
			assertToBeNonNullish(existingUser);
			const emailAddress = existingUser.emailAddress;

			// Try to create on-spot attendee with the same email
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Duplicate Email Attendee",
							emailAddress, // Existing email
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "emailAddress"],
									message: "This email address is already registered.",
								}),
							]),
						}),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user is not an admin of the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create organization as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Non-Admin Test Org ${faker.string.ulid()}`,
							description: "Organization for non-admin testing",
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
			trackedEntityIds.organizationIds.push(orgId);

			// Create a regular user (non-admin)
			const { userId: regularUserId, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserId);
			assertToBeNonNullish(regularUserToken);
			trackedEntityIds.userIds.push(regularUserId);

			// Add regular user as a regular member (NOT admin) of the organization
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: regularUserId,
							organizationId: orgId,
							role: "regular", // Regular role, not admin
						},
					},
				},
			);
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			// Try to create on-spot attendee as regular user (should fail)
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: faker.internet.email(),
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message:
								"Only organization admins can create on-spot attendees. You must have an admin role.",
						}),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});

	suite("when user has no membership in the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create organization as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `No Membership Test Org ${faker.string.ulid()}`,
							description: "Organization for no membership testing",
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
			trackedEntityIds.organizationIds.push(orgId);

			// Create a regular user with NO membership in the organization
			const { userId: regularUserId, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserId);
			assertToBeNonNullish(regularUserToken);
			trackedEntityIds.userIds.push(regularUserId);

			// Try to create on-spot attendee (should fail - no membership)
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: faker.internet.email(),
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message:
								"Only organization admins can create on-spot attendees. You must have an admin role.",
						}),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});

	suite("when creating on-spot attendee successfully", () => {
		test("should create user with isEmailAddressVerified: true and return authentication tokens", async () => {
			// Create organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Success Test Org ${faker.string.ulid()}`,
							description: "Organization for successful on-spot attendee creation",
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
			trackedEntityIds.organizationIds.push(orgId);

			// Add admin as organization member with administrator role
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = faker.internet.email();
			const attendeeName = faker.person.fullName();
			const tempPassword = "TempPass123!@#";

			// Create on-spot attendee as admin
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: attendeeName,
							emailAddress: attendeeEmail,
							password: tempPassword,
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const createdAttendee = result.data?.adminCreateOnSpotAttendee as any;
			expect(createdAttendee).toBeDefined();

			// Track the created user ID
			const createdUserId = createdAttendee?.user?.id;
			if (createdUserId) trackedEntityIds.userIds.push(createdUserId);

			// Verify user properties
			expect(createdAttendee?.user?.name).toBe(attendeeName);
			expect(createdAttendee?.user?.emailAddress).toBe(attendeeEmail);
			expect(createdAttendee?.user?.isEmailAddressVerified).toBe(true); // CRITICAL: Auto-verified
			expect(createdAttendee?.user?.role).toBe("regular");

			// Verify authentication tokens returned
			expect(createdAttendee?.authenticationToken).toBeDefined();
			expect(createdAttendee?.authenticationToken).toMatch(
				/^[\w-]+\.[\w-]+\.[\w-]+$/,
			); // JWT format
			expect(createdAttendee?.refreshToken).toBeDefined();

			// Verify user exists in database with verified email
			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail),
			});
			expect(dbUser).toBeDefined();
			expect(dbUser?.isEmailAddressVerified).toBe(true);
			expect(dbUser?.name).toBe(attendeeName);

			// Verify organization membership created
			const dbMembership =
				await server.drizzleClient.query.organizationMembershipsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, dbUser!.id),
								operators.eq(fields.organizationId, orgId),
							),
					},
				);
			expect(dbMembership).toBeDefined();
			expect(dbMembership?.role).toBe("regular");
		});
	});

	suite("when organization requires user registration", () => {
		test("should create membership request instead of direct membership", async () => {
			// Create organization with userRegistrationRequired: true
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Registration Required Org ${faker.string.ulid()}`,
							description: "Organization requiring user registration",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
							isUserRegistrationRequired: true, // REQUIRES APPROVAL
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			trackedEntityIds.organizationIds.push(orgId);

			// Add admin as organization member with administrator role
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = faker.internet.email();

			// Create on-spot attendee
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.person.fullName(),
							emailAddress: attendeeEmail,
							password: "TempPass123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const createdAttendee = result.data?.adminCreateOnSpotAttendee as any;
			expect(createdAttendee).toBeDefined();

			// Track the created user ID
			const createdUserId = createdAttendee?.user?.id;
			if (createdUserId) trackedEntityIds.userIds.push(createdUserId);

			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail),
			});
			assertToBeNonNullish(dbUser);

			// Should have membership REQUEST, not direct membership
			const dbMembership =
				await server.drizzleClient.query.organizationMembershipsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, dbUser.id),
								operators.eq(fields.organizationId, orgId),
							),
					},
				);
			expect(dbMembership).toBeUndefined(); // No direct membership

			// Check membership request exists
			const dbRequest =
				await server.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, dbUser.id),
							operators.eq(fields.organizationId, orgId),
						),
				});
			expect(dbRequest).toBeDefined();
		});
	});

	suite("when organization does not require user registration", () => {
		test("should create direct membership", async () => {
			// Create organization with userRegistrationRequired: false (default)
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Direct Membership Org ${faker.string.ulid()}`,
							description: "Organization with direct membership",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
							isUserRegistrationRequired: false, // DIRECT MEMBERSHIP
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			trackedEntityIds.organizationIds.push(orgId);

			// Add admin as organization member with administrator role
			const membershipResult = await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = faker.internet.email();

			// Create on-spot attendee
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.person.fullName(),
							emailAddress: attendeeEmail,
							password: "TempPass123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();

			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail),
			});
			assertToBeNonNullish(dbUser);
			if (dbUser.id) trackedEntityIds.userIds.push(dbUser.id);

			// Should have DIRECT membership
			const dbMembership =
				await server.drizzleClient.query.organizationMembershipsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, dbUser.id),
								operators.eq(fields.organizationId, orgId),
							),
					},
				);
			expect(dbMembership).toBeDefined();
			expect(dbMembership?.role).toBe("regular");

			// Should NOT have membership request
			const dbRequest =
				await server.drizzleClient.query.membershipRequestsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, dbUser.id),
							operators.eq(fields.organizationId, orgId),
						),
				});
			expect(dbRequest).toBeUndefined();
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code for invalid email format", async () => {
			// Create organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Validation Test Org ${faker.string.ulid()}`,
							description: "Organization for validation testing",
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
			trackedEntityIds.organizationIds.push(orgId);

			// Add admin as organization member
			const membershipResult = await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});
			const membershipId = membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			// Try to create with invalid email
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: "invalid-email", // Invalid format
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.data?.adminCreateOnSpotAttendee).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["adminCreateOnSpotAttendee"],
					}),
				]),
			);
		});
	});
});
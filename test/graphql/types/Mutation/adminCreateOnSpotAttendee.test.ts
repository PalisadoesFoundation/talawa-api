import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import type { GraphQLResolveInfo } from "graphql";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { getCurrentSchema } from "~/src/graphql/schema";
import { mutationAdminCreateOnSpotAttendeeArgumentsSchema } from "~/src/graphql/types/Mutation/adminCreateOnSpotAttendee";
import { emailService } from "~/src/services/email/emailServiceInstance";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_adminCreateOnSpotAttendee,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

interface AdminCreateOnSpotAttendeePayload {
	id: string;
	name: string;
	emailAddress: string;
	isEmailAddressVerified: boolean;
	role: string;
}

let authToken: string;
let adminUserId: string;

/**
 * Helper function to cleanup tracked entities
 * Deletes organizations (which cascades memberships), then remaining users
 */
async function cleanupTrackedEntities(trackedEntityIds: {
	organizationIds: string[];
	userIds: string[];
	membershipIds: string[];
}): Promise<void> {
	// Delete organizations first (cascades to memberships)
	for (const orgId of trackedEntityIds.organizationIds) {
		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: { id: orgId },
				},
			});
		} catch (error) {
			// Silently ignore errors - organization may already be deleted
			console.log(
				`Failed·to·delete·organization·${orgId}:`,
				(error as Error).message,
			);
		}
	}

	// Delete users individually if not already cascade-deleted
	for (const userId of trackedEntityIds.userIds) {
		try {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `Bearer ${authToken}` },
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
	let trackedEntityIds: {
		organizationIds: string[];
		userIds: string[];
		membershipIds: string[];
	};

	// unique email helper (guarantees uniqueness across parallel shards)
	const uniqueEmail = () => `${faker.string.ulid()}@example.com`;

	beforeAll(async () => {
		// Sign in as admin once for the whole suite to avoid rate-limit flakiness
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(signInResult.data?.signIn);
		authToken = signInResult.data.signIn.authenticationToken as string;
		adminUserId = signInResult.data.signIn.user?.id as string;
		assertToBeNonNullish(authToken);
		assertToBeNonNullish(adminUserId);
	});

	beforeEach(async () => {
		// Initialize per-test tracker
		trackedEntityIds = {
			organizationIds: [],
			userIds: [],
			membershipIds: [],
		};
	});

	/**
	 * Cleanup hook: runs after each test to prevent DB entity leaks
	 * Deletes all tracked organizations and users created during the test
	 * Restore any mocked functions after each test to prevent cross-test pollution
	 */
	afterEach(async () => {
		await cleanupTrackedEntities(trackedEntityIds);
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	/**
	 * Fallback cleanup hook: runs after all tests in this suite
	 * Ensures any remaining entities are cleaned up to prevent test pollution
	 */
	afterAll(async () => {
		await cleanupTrackedEntities(trackedEntityIds);
	});

	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: uniqueEmail(),
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
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: uniqueEmail(),
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

	suite("when input validation fails with invalid password", () => {
		test("should return invalid_arguments error for password that is too short", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: `Password Validation Org ${faker.string.ulid()}`,
							description: "Org for password validation testing",
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

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Attendee",
							emailAddress: uniqueEmail(),
							password: "short", // Too short (< 8 chars) - fails zod validation
							selectedOrganization: orgId,
						},
					},
				},
			);

			expect(result.data?.adminCreateOnSpotAttendee ?? null).toBeNull();
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

	suite("when the email address is already registered", () => {
		test("should return an error with forbidden_action_on_arguments_associated_resources code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
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

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create an existing user directly in the database to avoid rate-limit flakiness
			const emailAddress = uniqueEmail().toLowerCase();
			const existingUserId = faker.string.uuid();
			await server.drizzleClient.insert(usersTable).values({
				id: existingUserId,
				name: "Existing User",
				emailAddress,
				passwordHash: await hash("TempPass123!@#"),
				isEmailAddressVerified: true,
				role: "regular",
			});
			trackedEntityIds.userIds.push(existingUserId);

			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: "Duplicate Email Attendee",
							emailAddress,
							password: "123!@#Test",
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

	suite(
		"when creating on-spot attendee with avatar explicitly set to null",
		() => {
			test("should create user successfully when avatar is null", async () => {
				vi.spyOn(emailService, "sendEmail").mockResolvedValue({
					id: faker.string.uuid(),
					success: true,
					messageId: faker.string.uuid(),
				});

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `Bearer ${authToken}` },
						variables: {
							input: {
								name: `Null Avatar Org ${faker.string.ulid()}`,
								description: "Org for null avatar testing",
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

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				});

				const attendeeEmail = uniqueEmail();

				const result = await mercuriusClient.mutate(
					Mutation_adminCreateOnSpotAttendee,
					{
						headers: { authorization: `Bearer ${authToken}` },
						variables: {
							input: {
								name: faker.person.fullName(),
								emailAddress: attendeeEmail,
								password: "TempPass123!@#",
								selectedOrganization: orgId,
								avatar: null, // explicit null — triggers the `arg.avatar !== undefined` branch (line 59-61)
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.adminCreateOnSpotAttendee).toBeDefined();

				const createdId = result.data?.adminCreateOnSpotAttendee?.id;
				if (createdId) trackedEntityIds.userIds.push(createdId);
			});
		},
	);
	suite("when emailService.sendEmail throws synchronously", () => {
		test("should still create attendee and log error", async () => {
			vi.spyOn(emailService, "sendEmail").mockImplementation(() => {
				throw new Error("Synchronous email error");
			});

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: `Sync Error Email Org ${faker.string.ulid()}`,
							description: "Org for sync email error testing",
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

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const attendeeEmail = uniqueEmail();

			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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

			// Attendee should still be created despite sync email error
			expect(result.errors).toBeUndefined();
			expect(result.data?.adminCreateOnSpotAttendee).toBeDefined();

			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail.toLowerCase()),
			});
			expect(dbUser).toBeDefined();
			if (dbUser?.id) trackedEntityIds.userIds.push(dbUser.id);
		});
	});

	suite("when user is not an admin of the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Use resolver directly (avoids rate-limit flakiness from multiple GraphQL calls)
			const schema = getCurrentSchema();
			const mutationType = schema.getMutationType();
			assertToBeNonNullish(mutationType);
			const field = mutationType.getFields().adminCreateOnSpotAttendee;
			assertToBeNonNullish(field);
			const resolver = field.resolve as (
				parent: unknown,
				args: unknown,
				ctx: unknown,
				info: GraphQLResolveInfo,
			) => Promise<unknown>;

			const orgId = faker.string.uuid();
			const regularUserId = faker.string.uuid();
			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: regularUserId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: regularUserId,
								role: "regular",
							}),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue({
								role: "regular",
							}),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: orgId,
								userRegistrationRequired: false,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([undefined]),
						}),
					}),
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Test Attendee",
							emailAddress: uniqueEmail(),
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});
	});

	suite("when user has no membership in the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Use resolver directly (avoids rate-limit flakiness from multiple GraphQL calls)
			const schema = getCurrentSchema();
			const mutationType = schema.getMutationType();
			assertToBeNonNullish(mutationType);
			const field = mutationType.getFields().adminCreateOnSpotAttendee;
			assertToBeNonNullish(field);
			const resolver = field.resolve as (
				parent: unknown,
				args: unknown,
				ctx: unknown,
				info: GraphQLResolveInfo,
			) => Promise<unknown>;

			const orgId = faker.string.uuid();
			const regularUserId = faker.string.uuid();
			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: regularUserId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: regularUserId,
								role: "regular",
							}),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue(undefined),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: orgId,
								userRegistrationRequired: false,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([undefined]),
						}),
					}),
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Test Attendee",
							emailAddress: uniqueEmail(),
							password: "Test123!@#",
							selectedOrganization: orgId,
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});
	});

	suite("when creating on-spot attendee successfully", () => {
		test("should create user with isEmailAddressVerified: true and return authentication tokens", async () => {
			// Create organization
			const sendEmailSpy = vi
				.spyOn(emailService, "sendEmail")
				.mockResolvedValue({
					id: faker.string.uuid(),
					success: true,
					messageId: faker.string.uuid(),
				});
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							name: `Success Test Org ${faker.string.ulid()}`,
							description:
								"Organization for successful on-spot attendee creation",
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
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId =
				membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = uniqueEmail();
			const attendeeName = `User ${faker.string.ulid()}`;
			const tempPassword = "TempPass123!@#";

			// Create on-spot attendee as admin
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
			const createdAttendee = result.data
				?.adminCreateOnSpotAttendee as AdminCreateOnSpotAttendeePayload;
			expect(createdAttendee).toBeDefined();

			// Track the created user ID
			const createdUserId = createdAttendee?.id;
			if (createdUserId) trackedEntityIds.userIds.push(createdUserId);

			// Verify user properties
			expect(createdAttendee?.name).toBe(attendeeName);
			expect(createdAttendee?.emailAddress.toLowerCase()).toBe(
				attendeeEmail.toLowerCase(),
			);
			expect(createdAttendee?.isEmailAddressVerified).toBe(true); // CRITICAL: Auto-verified
			expect(createdAttendee?.role).toBe("regular");

			// Verify user exists in database with verified email
			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail.toLowerCase()),
			});
			expect(dbUser).toBeDefined();
			assertToBeNonNullish(dbUser);
			expect(dbUser.isEmailAddressVerified).toBe(true);
			expect(dbUser.name).toBe(attendeeName);

			// Verify organization membership created
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

			expect(sendEmailSpy).toHaveBeenCalledTimes(1);

			const emailArgs = sendEmailSpy.mock.calls[0]?.[0];
			expect(emailArgs?.email.toLowerCase()).toBe(attendeeEmail.toLowerCase());
			expect(emailArgs?.subject).toMatch(/welcome|account|ready/i);
			const body = emailArgs?.htmlBody ?? emailArgs?.textBody ?? "";
			expect(body).toContain(tempPassword);
		});
	});

	suite("when organization requires user registration", () => {
		test("should create membership request instead of direct membership", async () => {
			// Create organization with userRegistrationRequired: true
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId =
				membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = uniqueEmail();

			// Create on-spot attendee
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
			const createdAttendee = result.data
				?.adminCreateOnSpotAttendee as AdminCreateOnSpotAttendeePayload;
			expect(createdAttendee).toBeDefined();

			// Track the created user ID
			const createdUserId = createdAttendee?.id;
			if (createdUserId) trackedEntityIds.userIds.push(createdUserId);

			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, attendeeEmail.toLowerCase()),
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
					headers: { authorization: `Bearer ${authToken}` },
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
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId =
				membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = uniqueEmail();

			// Create on-spot attendee
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
					operators.eq(fields.emailAddress, attendeeEmail.toLowerCase()),
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

	suite("when email sending fails", () => {
		test("should still create on-spot attendee even if email fails", async () => {
			const sendEmailSpy = vi
				.spyOn(emailService, "sendEmail")
				.mockRejectedValueOnce(new Error("SMTP service down"));

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId =
				membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			const attendeeEmail = uniqueEmail();

			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
			expect(result.data?.adminCreateOnSpotAttendee).toBeDefined();

			expect(sendEmailSpy).toHaveBeenCalledTimes(1);

			const createdAttendee = result.data
				?.adminCreateOnSpotAttendee as AdminCreateOnSpotAttendeePayload;

			const dbUser = await server.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.emailAddress, createdAttendee.emailAddress),
			});
			expect(dbUser).toBeDefined();
		});
	});

	suite("argument avatar validation schema", () => {
		const baseInput = {
			name: "Avatar Test User",
			emailAddress: "avatar-test@example.com",
			password: "TempPass123!@#",
			selectedOrganization: faker.string.uuid(),
		};

		test("should add a custom issue when avatar mimetype is invalid", async () => {
			const invalidAvatar = {
				mimetype: "application/pdf",
				createReadStream: vi.fn(),
			} as unknown as { mimetype: string; createReadStream: () => unknown };

			const result =
				await mutationAdminCreateOnSpotAttendeeArgumentsSchema.safeParseAsync({
					input: {
						...baseInput,
						avatar: Promise.resolve(invalidAvatar),
					},
				});

			expect(result.success).toBe(false);
			if (!result.success) {
				const avatarIssues = result.error.issues.filter((issue) =>
					issue.path.includes("avatar"),
				);
				expect(avatarIssues.length).toBeGreaterThan(0);
				expect(avatarIssues[0]?.message).toContain(
					'Mime type "application/pdf" is not allowed.',
				);
			}
		});

		test("should coerce avatar mimetype to allowed enum on success", async () => {
			const validMimeType = imageMimeTypeEnum.enum["image/png"];
			const validAvatar = {
				mimetype: validMimeType,
				createReadStream: vi.fn(),
			} as unknown as { mimetype: string; createReadStream: () => unknown };

			const result =
				await mutationAdminCreateOnSpotAttendeeArgumentsSchema.safeParseAsync({
					input: {
						...baseInput,
						avatar: Promise.resolve(validAvatar),
					},
				});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.input.avatar).toBeDefined();
				expect(result.data.input.avatar?.mimetype).toBe(validMimeType);
			}
		});
	});

	suite("low-level resolver edge cases", () => {
		function getAdminCreateOnSpotAttendeeResolver() {
			const schema = getCurrentSchema();
			const mutationType = schema.getMutationType();
			assertToBeNonNullish(mutationType);
			const field = mutationType.getFields().adminCreateOnSpotAttendee;
			assertToBeNonNullish(field);
			return field.resolve as (
				parent: unknown,
				args: unknown,
				ctx: unknown,
				info: GraphQLResolveInfo,
			) => Promise<unknown>;
		}

		test("should throw forbidden_action when current user context is missing id", async () => {
			const resolver = getAdminCreateOnSpotAttendeeResolver();

			const ctx = {
				currentClient: {
					isAuthenticated: true,
					user: {},
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Missing Id User",
							emailAddress: "missing-id@example.com",
							password: "TempPass123!@#",
							selectedOrganization: faker.string.uuid(),
						},
					},
					ctx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});

		test("should throw forbidden_action_on_arguments_associated_resources when email is already registered", async () => {
			const resolver = getAdminCreateOnSpotAttendeeResolver();
			const adminId = faker.string.uuid();
			const organizationId = faker.string.uuid();

			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: adminId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi
								.fn()
								.mockResolvedValue({ id: adminId, role: "administrator" }),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue({
								role: "administrator",
							}),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: organizationId,
								userRegistrationRequired: false,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([
								{
									id: faker.string.uuid(),
									emailAddress: "duplicate@example.com",
								},
							]),
						}),
					}),
					transaction: vi.fn(), // should not be called due to early error
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Duplicate Email Attendee",
							emailAddress: "duplicate@example.com",
							password: "TempPass123!@#",
							selectedOrganization: organizationId,
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});

		test("should throw unexpected error when organization membership creation returns undefined", async () => {
			const resolver = getAdminCreateOnSpotAttendeeResolver();
			const adminId = faker.string.uuid();
			const organizationId = faker.string.uuid();

			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: adminId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi
								.fn()
								.mockResolvedValue({ id: adminId, role: "administrator" }),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue({
								role: "administrator",
							}),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: organizationId,
								userRegistrationRequired: false,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([undefined]),
						}),
					}),
					transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
						const tx = {
							insert: (table: unknown) => ({
								values: () => ({
									returning: vi.fn().mockResolvedValue(
										table === usersTable
											? [
													{
														id: faker.string.uuid(),
														emailAddress: "user@example.com",
														name: "User",
													},
												]
											: table === organizationMembershipsTable
												? [undefined]
												: [],
									),
								}),
							}),
						};
						return callback(tx);
					},
				},
				minio: {
					client: {
						putObject: vi.fn(),
					},
					bucketName: "test-bucket",
				},
				log: {
					error: vi.fn(),
				},
				envConfig: {
					API_COMMUNITY_NAME: "Test Community",
					API_FRONTEND_URL: "https://example.com",
					API_GRAPHQL_OBJECT_FIELD_COST: 1,
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Membership Error User",
							emailAddress: "membership-error@example.com",
							password: "TempPass123!@#",
							selectedOrganization: organizationId,
							avatar: Promise.resolve({
								mimetype: imageMimeTypeEnum.enum["image/png"],
								createReadStream: vi.fn(),
							}),
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});

		test("should throw unexpected error when user creation returns undefined", async () => {
			const resolver = getAdminCreateOnSpotAttendeeResolver();
			const adminId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const logErrorSpy = vi.fn();

			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: adminId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi
								.fn()
								.mockResolvedValue({ id: adminId, role: "administrator" }),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue({
								role: "administrator",
							}),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: organizationId,
								userRegistrationRequired: false,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([undefined]),
						}),
					}),
					transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
						const tx = {
							insert: (table: unknown) => ({
								values: () => ({
									returning: vi
										.fn()
										.mockResolvedValue(table === usersTable ? [undefined] : []),
								}),
							}),
						};
						return callback(tx);
					},
				},
				minio: {
					client: {
						putObject: vi.fn(),
					},
					bucketName: "test-bucket",
				},
				log: {
					error: logErrorSpy,
				},
				envConfig: {
					API_COMMUNITY_NAME: "Test Community",
					API_FRONTEND_URL: "https://example.com",
					API_GRAPHQL_OBJECT_FIELD_COST: 1,
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Created User Undefined",
							emailAddress: "created-user-undefined@example.com",
							password: "TempPass123!@#",
							selectedOrganization: organizationId,
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);

			expect(logErrorSpy).toHaveBeenCalledWith(
				"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
			);
		});

		test("should throw unexpected error when membership request creation returns empty array", async () => {
			const resolver = getAdminCreateOnSpotAttendeeResolver();
			const adminId = faker.string.uuid();
			const organizationId = faker.string.uuid();

			const fakeCtx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: adminId },
				},
				drizzleClient: {
					query: {
						usersTable: {
							findFirst: vi
								.fn()
								.mockResolvedValue({ id: adminId, role: "administrator" }),
						},
						organizationMembershipsTable: {
							findFirst: vi.fn().mockResolvedValue({
								role: "administrator",
							}),
						},
						organizationsTable: {
							findFirst: vi.fn().mockResolvedValue({
								id: organizationId,
								userRegistrationRequired: true,
							}),
						},
					},
					select: vi.fn().mockReturnValue({
						from: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue([undefined]),
						}),
					}),
					transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
						const tx = {
							insert: (table: unknown) => ({
								values: () => ({
									returning: vi.fn().mockResolvedValue(
										table === usersTable
											? [
													{
														id: faker.string.uuid(),
														emailAddress: "user@example.com",
														name: "User",
													},
												]
											: table === membershipRequestsTable
												? []
												: [],
									),
								}),
							}),
						};
						return callback(tx);
					},
				},
				minio: {
					client: {
						putObject: vi.fn(),
					},
					bucketName: "test-bucket",
				},
				log: {
					error: vi.fn(),
				},
				envConfig: {
					API_COMMUNITY_NAME: "Test Community",
					API_FRONTEND_URL: "https://example.com",
					API_GRAPHQL_OBJECT_FIELD_COST: 1,
				},
			};

			await expect(
				resolver(
					null,
					{
						input: {
							name: "Membership Request Error User",
							emailAddress: "membership-request-error@example.com",
							password: "TempPass123!@#",
							selectedOrganization: organizationId,
							avatar: Promise.resolve({
								mimetype: imageMimeTypeEnum.enum["image/png"],
								createReadStream: vi.fn(),
							}),
						},
					},
					fakeCtx,
					{} as GraphQLResolveInfo,
				),
			).rejects.toBeInstanceOf(TalawaGraphQLError);
		});
	});

	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code for invalid email format", async () => {
			// Create organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `Bearer ${authToken}` },
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
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							memberId: adminUserId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);
			const membershipId =
				membershipResult.data?.createOrganizationMembership?.id;
			if (membershipId) trackedEntityIds.membershipIds.push(membershipId);

			// Try to create with invalid email
			const result = await mercuriusClient.mutate(
				Mutation_adminCreateOnSpotAttendee,
				{
					headers: { authorization: `Bearer ${authToken}` },
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

			expect(result.data?.adminCreateOnSpotAttendee ?? null).toBeNull();
			expect(result.errors?.length).toBeGreaterThan(0);
			if (result.errors && result?.errors?.length !== 0) {
				expect(result?.errors[0]?.extensions?.code).toBe("invalid_arguments");
			}
		});
	});
});

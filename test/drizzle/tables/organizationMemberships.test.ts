import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { server } from "test/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	organizationMembershipsTable,
	organizationMembershipsTableInsertSchema,
	organizationMembershipsTableRelations,
} from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";

//  ==============================
//  Global Functions :- Shared utility functions for logging in users and creating test organizations for integration tests.
//  ==============================

async function createTestOrganization(): Promise<string> {
	// Clear any existing headers to ensure a clean sign-in
	mercuriusClient.setHeaders({});
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (signIn.errors) {
		throw new Error(`Admin sign-in failed: ${JSON.stringify(signIn.errors)}`);
	}
	const token = signIn.data?.signIn?.authenticationToken;
	assertToBeNonNullish(
		token,
		"Authentication token is missing from sign-in response",
	);
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});
	if (org.errors) {
		throw new Error(
			`Create organization failed: ${JSON.stringify(org.errors)}`,
		);
	}
	const orgId = org.data?.createOrganization?.id;
	assertToBeNonNullish(
		orgId,
		"Organization ID is missing from creation response",
	);
	return orgId;
}

async function loginAdminUser(): Promise<{
	adminId: string;
	authToken: string;
}> {
	mercuriusClient.setHeaders({});

	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	// Check for errors first
	if (adminSignInResult.errors) {
		throw new Error(
			`Admin sign-in failed: ${JSON.stringify(adminSignInResult.errors)}`,
		);
	}

	assertToBeNonNullish(adminSignInResult.data?.signIn);
	assertToBeNonNullish(adminSignInResult.data.signIn.authenticationToken);
	assertToBeNonNullish(adminSignInResult.data.signIn.user);

	return {
		adminId: adminSignInResult.data.signIn.user.id,
		authToken: adminSignInResult.data.signIn.authenticationToken,
	};
}

//  ==============================
//  Database Operations Test
//  ==============================

let testOrg: string;
let testUser: { userId: string; authToken: string };
let creatorUser: { adminId: string; authToken: string };

describe("organizationMembershipsTable database operations", () => {
	beforeAll(async () => {
		testOrg = await createTestOrganization();
		testUser = await createRegularUserUsingAdmin();
		creatorUser = await loginAdminUser();
	});

	afterAll(async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.organizationId, testOrg));

		await server.drizzleClient
			.delete(organizationsTable)
			.where(eq(organizationsTable.id, testOrg));

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, testUser.userId));
	});

	it("creates membership with required fields", async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);
		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "regular",
			})
			.returning();

		expect(membership).toBeDefined();
		expect(membership?.memberId).toBe(testUser.userId);
		expect(membership?.organizationId).toBe(testOrg);
		expect(membership?.role).toBe("regular");
		expect(membership?.createdAt).toBeInstanceOf(Date);
	});

	it("sets createdAt automatically on insert", async () => {
		const before = new Date();

		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "regular",
			})
			.returning();

		const after = new Date();

		expect(membership?.createdAt.getTime()).toBeGreaterThanOrEqual(
			before.getTime(),
		);
		expect(membership?.createdAt.getTime()).toBeLessThanOrEqual(
			after.getTime(),
		);
	});

	it("allows optional creatorId and updaterId", async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "administrator",
				creatorId: creatorUser.adminId,
				updaterId: creatorUser.adminId,
			})
			.returning();

		expect(membership?.creatorId).toBe(creatorUser.adminId);
		expect(membership?.updaterId).toBe(creatorUser.adminId);
	});

	it("enforces composite primary key on memberId and organizationId", async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: testUser.userId,
			organizationId: testOrg,
			role: "regular",
		});

		await expect(
			server.drizzleClient.insert(organizationMembershipsTable).values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "administrator",
			}),
		).rejects.toThrow();
	});

	it("updates updatedAt timestamp on update", async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "regular",
				createdAt: new Date(Date.now() - 1000),
			})
			.returning();

		const [updated] = await server.drizzleClient
			.update(organizationMembershipsTable)
			.set({ role: "administrator" })
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			)
			.returning();

		expect(updated?.updatedAt).toBeDefined();
		expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
			(membership?.createdAt as Date).getTime(),
		);
	});

	it("cascades delete when user is deleted", async () => {
		const user = await createRegularUserUsingAdmin();
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, user.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: testOrg,
			role: "regular",
		});

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, user.userId));

		const memberships = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.memberId, user.userId));

		expect(memberships.length).toBe(0);
	});

	it("cascades delete when organization is deleted", async () => {
		const [org] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				id: faker.string.uuid(),
				name: "Temp Org",
				countryCode: "us",
			})
			.returning();

		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, org?.id as string),
				),
			);

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: testUser.userId,
			organizationId: org?.id as string,
			role: "regular",
		});

		await server.drizzleClient
			.delete(organizationsTable)
			.where(eq(organizationsTable.id, org?.id as string));

		const memberships = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(
				eq(organizationMembershipsTable.organizationId, org?.id as string),
			);

		expect(memberships.length).toBe(0);
	});

	it("sets creatorId to null when creator is deleted", async () => {
		const creator = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "regular",
				creatorId: creator.userId,
			})
			.returning();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, creator.userId));

		const [updated] = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(
				and(
					eq(
						organizationMembershipsTable.memberId,
						membership?.memberId as string,
					),
					eq(
						organizationMembershipsTable.organizationId,
						membership?.organizationId as string,
					),
				),
			);

		expect(updated?.creatorId).toBeNull();
	});

	it("sets updaterId to null when updater is deleted", async () => {
		const updater = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		const [membership] = await server.drizzleClient
			.insert(organizationMembershipsTable)
			.values({
				memberId: testUser.userId,
				organizationId: testOrg,
				role: "regular",
				updaterId: updater.userId,
			})
			.returning();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, updater.userId));

		const [updated] = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(
				and(
					eq(
						organizationMembershipsTable.memberId,
						membership?.memberId as string,
					),
					eq(
						organizationMembershipsTable.organizationId,
						membership?.organizationId as string,
					),
				),
			);

		expect(updated?.updaterId).toBeNull();
	});

	it("accepts all valid role values", async () => {
		const roles = ["regular", "administrator"];

		for (const role of roles) {
			const user = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(
					and(
						eq(organizationMembershipsTable.memberId, user.userId),
						eq(organizationMembershipsTable.organizationId, testOrg),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(organizationMembershipsTable)
				.values({
					memberId: user.userId,
					organizationId: testOrg,
					role: role as "regular" | "administrator",
					creatorId: creatorUser.adminId,
				})
				.returning();

			expect(membership?.role).toBe(role);

			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.memberId, user.userId));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));
		}
	});

	it("queries membership by indexes", async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, testUser.userId),
					eq(organizationMembershipsTable.organizationId, testOrg),
				),
			);

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: testUser.userId,
			organizationId: testOrg,
			role: "regular",
			creatorId: creatorUser.adminId,
		});

		const byMember = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.memberId, testUser.userId));

		expect(byMember.length).toBeGreaterThan(0);

		const byOrg = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.organizationId, testOrg));

		expect(byOrg.length).toBeGreaterThan(0);

		const byRole = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.role, "regular"));

		expect(byRole.length).toBeGreaterThan(0);
	});
});

// ====================================
// Insert Schema Edge Cases
// ====================================

const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "550e8400-e29b-41d4-a716-446655440111";

describe("organization Memberships Table Insert Schema edge cases", () => {
	it("Send an empty object to test basic validation", () => {
		expect(() => organizationMembershipsTableInsertSchema.parse({})).toThrow();
	});

	it("Remove the memberId field from the object", () => {
		const data = {
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Remove the organizationId field from the object", () => {
		const data = {
			memberId: validUUID1,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object without role", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Put an invalid UUID in the object", () => {
		const data = {
			memberId: "not-a-uuid",
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send an object with an invalid role", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "SUPERADMIN",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send valid object for valid test case", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Add updaterId and creatorId to the object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "administrator",
			creatorId: validUUID1,
			updaterId: validUUID2,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Test a valid timestamp in the object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			createdAt: new Date("2024-01-01T00:00:00Z"),
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Test a valid updatedAt timestamp in the object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			updatedAt: new Date("2024-01-01T00:00:00Z"),
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Send wrong type for createdAt timestamp", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			createdAt: "not-a-date",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send invalid type for updatedAt timestamp", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			updatedAt: 12345,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object with admin role", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "administrator",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Send object with empty role", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object with Null role", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: null,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Rejects uppercase REGULAR role (case-sensitive)", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "REGULAR",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Rejects uppercase ADMINISTRATOR role (case-sensitive)", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "ADMINISTRATOR",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send null as memberId in object", () => {
		const data = {
			memberId: null,
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send null as organizationId in object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: null,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object with empty string memberId", () => {
		const data = {
			memberId: "",
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object with empty string organizationId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: "",
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send old UUID version for validation", () => {
		const data = {
			memberId: "550e8400-e29b-11d4-a716-446655440000", // v1 UUID
			organizationId: validUUID2,
			role: "regular",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Send object with random creatorId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			creatorId: "invalid-uuid",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Send object with random updaterId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			updaterId: "not-valid",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).toThrow();
	});

	it("Set creatorId to null.", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			creatorId: null,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Share a null value for updaterId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			updaterId: null,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Add an extra key and value to the object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			unknownField: "should not exist",
		};

		const result = organizationMembershipsTableInsertSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it("Send all valid fields in the object", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "administrator",
			creatorId: validUUID1,
			updaterId: validUUID2,
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-02T00:00:00Z"),
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Use the same UUID for memberId and organizationId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID1,
			role: "administrator",
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});

	it("Use the same UUID for memberId and creatorId", () => {
		const data = {
			memberId: validUUID1,
			organizationId: validUUID2,
			role: "regular",
			creatorId: validUUID1,
		};

		expect(() =>
			organizationMembershipsTableInsertSchema.parse(data),
		).not.toThrow();
	});
});

// =====================================================
// Relations Operations Test
// =====================================================

describe("organizationMembershipsTableRelations Operations", () => {
	let orgId: string;
	let memberId: string;
	let creatorId: string;
	let updaterId: string;

	beforeAll(async () => {
		const [org] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: "Relation Test Org",
				countryCode: "us",
			})
			.returning({ id: organizationsTable.id });

		if (!org) throw new Error("Org creation failed");
		orgId = org.id;

		const createUser = async (
			name: string,
			role: "regular" | "administrator",
		) => {
			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					name,
					emailAddress: faker.internet.email(),
					passwordHash: "hashed",
					role,
					isEmailAddressVerified: true,
				})
				.returning({ id: usersTable.id });

			if (!user) throw new Error("User creation failed");
			return user.id;
		};

		memberId = await createUser("Member", "regular");
		creatorId = await createUser("Creator", "administrator");
		updaterId = await createUser("Updater", "administrator");

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId,
			organizationId: orgId,
			role: "regular",
			creatorId,
			updaterId,
		});
	});

	afterAll(async () => {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(eq(organizationMembershipsTable.organizationId, orgId));

		await server.drizzleClient
			.delete(organizationsTable)
			.where(eq(organizationsTable.id, orgId));

		for (const userId of [memberId, creatorId, updaterId]) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));
		}
	});

	it("exports organizationMembershipsTableRelations", () => {
		expect(organizationMembershipsTableRelations).toBeDefined();
	});

	it("resolves creator relation", async () => {
		const [membership] =
			await server.drizzleClient.query.organizationMembershipsTable.findMany({
				with: {
					creator: true,
				},
				where: eq(organizationMembershipsTable.memberId, memberId),
			});

		expect(membership?.creator).toBeDefined();
		expect(membership?.creator?.id).toBe(creatorId);
	});

	it("resolves member relation", async () => {
		const [membership] =
			await server.drizzleClient.query.organizationMembershipsTable.findMany({
				with: {
					member: true,
				},
				where: eq(organizationMembershipsTable.memberId, memberId),
			});

		expect(membership?.member).toBeDefined();
		expect(membership?.member?.id).toBe(memberId);
	});

	it("resolves organization relation", async () => {
		const [membership] =
			await server.drizzleClient.query.organizationMembershipsTable.findMany({
				with: {
					organization: true,
				},
				where: eq(organizationMembershipsTable.memberId, memberId),
			});

		expect(membership?.organization).toBeDefined();
		expect(membership?.organization?.id).toBe(orgId);
	});

	it("resolves updater relation", async () => {
		const [membership] =
			await server.drizzleClient.query.organizationMembershipsTable.findMany({
				with: {
					updater: true,
				},
				where: eq(organizationMembershipsTable.memberId, memberId),
			});

		expect(membership?.updater).toBeDefined();
		expect(membership?.updater?.id).toBe(updaterId);
	});
});

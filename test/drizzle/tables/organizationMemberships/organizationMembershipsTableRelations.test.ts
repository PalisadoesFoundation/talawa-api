import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { server } from "test/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";

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

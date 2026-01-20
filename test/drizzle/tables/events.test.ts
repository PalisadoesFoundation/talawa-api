import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { describe, expect, it } from "vitest";

import { eventsTable } from "~/src/drizzle/schema";

import { server } from "../../server";

/**
 * Tests for eventsTable - validates the table schema, relations, and database operations.
 */

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
				name: `Org-${Date.now()}-${faker.string.alphanumeric(8)}`,
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

describe("src/drizzle/tables/events.ts", () => {
	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const testUser = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const eventName = faker.company.buzzPhrase();
			const startAt = new Date();
			const endAt = new Date(startAt.getTime() + 3600000); // +1 hour

			const [result] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: eventName,
					organizationId: orgId,
					creatorId: testUser.userId,
					startAt,
					endAt,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) return;

			expect(result.id).toBeDefined();
			expect(result.name).toBe(eventName);
			expect(result.organizationId).toBe(orgId);
			expect(result.creatorId).toBe(testUser.userId);
			// Check defaults
			expect(result.isPublic).toBe(false);
			expect(result.isRecurringEventTemplate).toBe(false);
		});

		it("should successfully insert a record with all fields", async () => {
			const testUser = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const eventData = {
				name: faker.company.buzzPhrase(),
				organizationId: orgId,
				creatorId: testUser.userId,
				startAt: new Date(),
				endAt: new Date(Date.now() + 7200000),
				description: faker.lorem.paragraph(),
				location: faker.location.streetAddress(),
				allDay: true,
				isInviteOnly: true,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			};

			const [result] = await server.drizzleClient
				.insert(eventsTable)
				.values(eventData)
				.returning();

			expect(result).toBeDefined();
			if (!result) return;
			expect(result.description).toBe(eventData.description);
			expect(result.location).toBe(eventData.location);
			expect(result.allDay).toBe(true);
			expect(result.isRecurringEventTemplate).toBe(true);
		});

		it("should fail to insert with invalid organizationId", async () => {
			const testUser = await createRegularUserUsingAdmin();

			await expect(
				server.drizzleClient.insert(eventsTable).values({
					name: "Invalid Org Event",
					organizationId: faker.string.uuid(), // Random UUID not in DB
					creatorId: testUser.userId,
					startAt: new Date(),
					endAt: new Date(),
				}),
			).rejects.toThrow();
		});

		it("should fail to insert with invalid creatorId", async () => {
			const orgId = await createTestOrganization();

			await expect(
				server.drizzleClient.insert(eventsTable).values({
					name: "Invalid Creator Event",
					organizationId: orgId,
					creatorId: faker.string.uuid(), // Random UUID not in DB
					startAt: new Date(),
					endAt: new Date(),
				}),
			).rejects.toThrow();
		});

		it("should successfully update an event", async () => {
			const testUser = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const [created] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Original Name",
					organizationId: orgId,
					startAt: new Date(),
					endAt: new Date(),
				})
				.returning();

			expect(created).toBeDefined();
			if (!created) return;

			const newName = "Updated Name";
			const input = {
				name: newName,
				updaterId: testUser.userId,
			};

			const [updated] = await server.drizzleClient
				.update(eventsTable)
				.set(input)
				.where(sql`${eventsTable.id} = ${created.id}`)
				.returning();

			expect(updated).toBeDefined();
			if (!updated) return;

			expect(updated.name).toBe(newName);
			expect(updated.updaterId).toBe(testUser.userId);
			// updatedAt should start null then update?
			// Drizzle timestamps sometimes manage themselves, or we check the logic.
			// The schema says .$onUpdate(() => new Date()), so it should be set.
			expect(updated.updatedAt).toBeInstanceOf(Date);
		});

		it("should successfully delete an event", async () => {
			const orgId = await createTestOrganization();
			const [created] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "To Delete",
					organizationId: orgId,
					startAt: new Date(),
					endAt: new Date(),
				})
				.returning();

			expect(created).toBeDefined();
			if (!created) return;

			const [deleted] = await server.drizzleClient
				.delete(eventsTable)
				.where(sql`${eventsTable.id} = ${created.id}`)
				.returning();

			expect(deleted).toBeDefined();
			if (!deleted) return;

			expect(deleted.id).toBe(created.id);

			const found = await server.drizzleClient
				.select()
				.from(eventsTable)
				.where(sql`${eventsTable.id} = ${created.id}`);

			expect(found).toHaveLength(0);
		});
	});
});

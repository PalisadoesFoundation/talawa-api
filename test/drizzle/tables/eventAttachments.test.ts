import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { describe, expect, it } from "vitest";
import {
	eventAttachmentsTable,
	eventAttachmentsTableRelations,
	eventsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { eventAttachmentsTableInsertSchema } from "~/src/drizzle/tables/eventAttachments";
import { server } from "../../server";

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

async function createTestEvent(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const OrgId = await createTestOrganization();

	const startAt = faker.date.recent();
	const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
	const eventResult = await server.drizzleClient
		.insert(eventsTable)
		.values({
			creatorId: userId,
			organizationId: OrgId,
			name: faker.lorem.word(),
			startAt,
			endAt,
		})
		.returning({ id: eventsTable.id });

	const id = eventResult[0]?.id;
	assertToBeNonNullish(id, "Event ID is missing from creation response");

	return id;
}

describe("src/drizzle/tables/eventAttachments.ts", () => {
	describe("EventAttachments Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(eventAttachmentsTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("eventId");
			expect(columns).toContain("mimeType");
			expect(columns).toContain("name");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have required fields configured as not null", () => {
			expect(eventAttachmentsTable.createdAt.notNull).toBe(true);
			expect(eventAttachmentsTable.eventId.notNull).toBe(true);
			expect(eventAttachmentsTable.mimeType.notNull).toBe(true);
			expect(eventAttachmentsTable.name.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(eventAttachmentsTable.updaterId.notNull).toBe(false);
			expect(eventAttachmentsTable.creatorId.notNull).toBe(false);
			expect(eventAttachmentsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(eventAttachmentsTable.createdAt.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const validEventId = await createTestEvent();
			await expect(
				server.drizzleClient.insert(eventAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: invalidCreatorId,
					mimeType: "image/png",
					eventId: validEventId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();
			const validEventId = await createTestEvent();
			await expect(
				server.drizzleClient.insert(eventAttachmentsTable).values({
					name: "testfile.txt",
					updaterId: invalidUpdaterId,
					mimeType: "image/png",
					eventId: validEventId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid eventId foreign key", async () => {
			const invalidEventId = faker.string.uuid();
			const validCreatorId = await createRegularUserUsingAdmin();
			await expect(
				server.drizzleClient.insert(eventAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: validCreatorId.userId,
					mimeType: "image/png",
					eventId: invalidEventId,
				}),
			).rejects.toThrow();
		});
	});

	describe("Table Relations", () => {
		type RelationCall = {
			type: "one" | "many";
			table: unknown;
			config: unknown;
			withFieldName: (fieldName: string) => RelationCall;
		};

		const createMockBuilders = () => {
			const one = (table: unknown, config: unknown): RelationCall => {
				const result: RelationCall = {
					type: "one" as const,
					table,
					config,
					withFieldName: () => result,
				};
				return result;
			};

			const many = (table: unknown, config: unknown): RelationCall => {
				const result: RelationCall = {
					type: "many" as const,
					table,
					config,
					withFieldName: () => result,
				};
				return result;
			};

			return {
				one: one as unknown as Parameters<
					typeof eventAttachmentsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof eventAttachmentsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(eventAttachmentsTableRelations).toBeDefined();
			expect(typeof eventAttachmentsTableRelations).toBe("object");
		});

		it("should be associated with eventAttachmentsTable", () => {
			expect(eventAttachmentsTableRelations.table).toBe(eventAttachmentsTable);
		});

		it("should have a config function", () => {
			expect(typeof eventAttachmentsTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventAttachmentsTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.event).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventAttachmentsTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventAttachmentsTableRelations.config({
				one,
				many,
			});

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define event as a one-to-one relation with eventsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventAttachmentsTableRelations.config({
				one,
				many,
			});

			const event = relationsResult.event as unknown as RelationCall;
			expect(event.type).toBe("one");
			expect(event.table).toBe(eventsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required name field", () => {
			const invalidData = {};
			const result = eventAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = { name: "" };
			const result = eventAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should accept name with exactly minimum length (1 character)", () => {
			const validData = {
				name: "a",
				mimeType: "image/png",
				eventId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			const result = eventAttachmentsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject invalid mimeType in insert schema", () => {
			const result = eventAttachmentsTableInsertSchema.safeParse({
				name: faker.system.fileName(),
				mimeType: "not/a/real-type",
				eventId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const validEventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [result] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: validEventId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.eventId).toBe(validEventId);
			expect(result.creatorId).toBe(userId);
			expect(result.name).toBe(name);
			expect(result.mimeType).toBe(mimeType);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const { userId } = await createRegularUserUsingAdmin();

			const validMimeTypes: Array<
				| "image/avif"
				| "image/jpeg"
				| "image/png"
				| "image/webp"
				| "video/mp4"
				| "video/webm"
			> = [
				"image/avif",
				"image/jpeg",
				"image/png",
				"image/webp",
				"video/mp4",
				"video/webm",
			];

			for (const mimeType of validMimeTypes) {
				const eventId = await createTestEvent();
				const [result] = await server.drizzleClient
					.insert(eventAttachmentsTable)
					.values({
						name: faker.system.fileName(),
						creatorId: userId,
						mimeType: mimeType,
						eventId: eventId,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					expect(result.mimeType).toBe(mimeType);
				}
			}
		});

		it("should successfully query records", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient.insert(eventAttachmentsTable).values({
				name: name,
				creatorId: userId,
				mimeType: mimeType,
				eventId: eventId,
			});

			const results = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.name, name));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe(name);
		});

		it("should successfully update a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert EventAttachments record");
			}
			const updatedName = faker.system.fileName();
			const updatedMimeType = "image/jpeg";

			const [updated] = await server.drizzleClient
				.update(eventAttachmentsTable)
				.set({
					name: updatedName,
					mimeType: updatedMimeType,
				})
				.where(eq(eventAttachmentsTable.eventId, inserted.eventId))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(updatedName);
			expect(updated?.mimeType).toBe(updatedMimeType);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert eventAttachmentsTable record");
			}

			const eventAttachmentsEventId = inserted.eventId;

			const [deleted] = await server.drizzleClient
				.delete(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventAttachmentsEventId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.eventId).toBe(eventAttachmentsEventId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventAttachmentsEventId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find eventAttachments by old creatorId after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert EventAttachments record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert eventAttachment record");
			}

			expect(inserted.creatorId).toBe(userId);
			const eventAttachmentId = inserted.eventId;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventAttachmentId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					updaterId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert eventAttachment record");
			}
			expect(inserted.updaterId).toBe(userId);

			const eventAttachmentId = inserted.eventId;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventAttachmentId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});

		it("should delete attachment when event is deleted (cascade)", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();

			const [inserted] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: faker.system.fileName(),
					creatorId: userId,
					mimeType: "image/png",
					eventId: eventId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert eventAttachment record");
			}
			expect(inserted.creatorId).toBe(userId);

			const eventAttachmentId = inserted.eventId;

			// Delete the event
			await server.drizzleClient
				.delete(eventsTable)
				.where(eq(eventsTable.id, eventAttachmentId));

			// Verify attachment was cascade deleted
			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventAttachmentId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should efficiently query using indexed creatorId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.creatorId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed eventId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.eventId, eventId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed createdAt column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const createdAt = faker.date.recent();

			await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					eventId: eventId,
					createdAt: createdAt,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(eventAttachmentsTable)
				.where(eq(eventAttachmentsTable.createdAt, createdAt));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const validMimeType = "image/png";
			const createdAt = faker.date.recent();

			const [result] = await server.drizzleClient
				.insert(eventAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: validMimeType,
					eventId: eventId,
					createdAt: createdAt,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.mimeType).toBe(validMimeType);
			}
		});

		it("should reject invalid enum values at the database layer", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();
			const name = faker.system.fileName();
			const invalidMimeType = "not/a/real-type";
			const createdAt = faker.date.recent();

			await expect(
				server.drizzleClient.insert(eventAttachmentsTable).values({
					name,
					creatorId: userId,
					mimeType: invalidMimeType as "image/png",
					eventId,
					createdAt: createdAt,
				}),
			).rejects.toThrow();
		});
	});
});

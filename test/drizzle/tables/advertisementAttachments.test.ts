import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { describe, expect, it } from "vitest";
import { advertisementsTable, usersTable } from "~/src/drizzle/schema";
import {
	advertisementAttachmentsTable,
	advertisementAttachmentsTableInsertSchema,
	advertisementAttachmentsTableRelations,
} from "~/src/drizzle/tables/advertisementAttachments";
import { server } from "../../server";

async function createTestOrganization(): Promise<string> {
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

async function createTestAdvertisement(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const orgId = await createTestOrganization();

	const startAt = faker.date.recent();
	const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
	const advertisementResult = await server.drizzleClient
		.insert(advertisementsTable)
		.values({
			creatorId: userId,
			organizationId: orgId,
			name: faker.lorem.word(),
			type: "banner",
			startAt,
			endAt,
		})
		.returning({ id: advertisementsTable.id });

	const id = advertisementResult[0]?.id;
	assertToBeNonNullish(
		id,
		"Advertisement ID is missing from creation response",
	);

	return id;
}

describe("src/drizzle/tables/advertisementAttachments", () => {
	describe("AdvertisementAttachments Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(advertisementAttachmentsTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("advertisementId");
			expect(columns).toContain("mimeType");
			expect(columns).toContain("name");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have required fields configured as not null", () => {
			expect(advertisementAttachmentsTable.createdAt.notNull).toBe(true);
			expect(advertisementAttachmentsTable.advertisementId.notNull).toBe(true);
			expect(advertisementAttachmentsTable.mimeType.notNull).toBe(true);
			expect(advertisementAttachmentsTable.name.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(advertisementAttachmentsTable.updaterId.notNull).toBe(false);
			expect(advertisementAttachmentsTable.creatorId.notNull).toBe(false);
			expect(advertisementAttachmentsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(advertisementAttachmentsTable.createdAt.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const validAdvertisementId = await createTestAdvertisement();
			await expect(
				server.drizzleClient.insert(advertisementAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: invalidCreatorId,
					mimeType: "image/png",
					advertisementId: validAdvertisementId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();
			const validAdvertisementId = await createTestAdvertisement();
			await expect(
				server.drizzleClient.insert(advertisementAttachmentsTable).values({
					name: "testfile.txt",
					updaterId: invalidUpdaterId,
					mimeType: "image/png",
					advertisementId: validAdvertisementId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid advertisementId foreign key", async () => {
			const invalidAdvertisementId = faker.string.uuid();
			const validCreatorId = await createRegularUserUsingAdmin();
			await expect(
				server.drizzleClient.insert(advertisementAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: validCreatorId.userId,
					mimeType: "image/png",
					advertisementId: invalidAdvertisementId,
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
					typeof advertisementAttachmentsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof advertisementAttachmentsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(advertisementAttachmentsTableRelations).toBeDefined();
			expect(typeof advertisementAttachmentsTableRelations).toBe("object");
		});

		it("should be associated with advertisementAttachmentsTable", () => {
			expect(advertisementAttachmentsTableRelations.table).toBe(
				advertisementAttachmentsTable,
			);
		});

		it("should have a config function", () => {
			expect(typeof advertisementAttachmentsTableRelations.config).toBe(
				"function",
			);
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = advertisementAttachmentsTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.advertisement).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = advertisementAttachmentsTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = advertisementAttachmentsTableRelations.config({
				one,
				many,
			});

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define advertisement as a one-to-one relation with advertisementsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = advertisementAttachmentsTableRelations.config({
				one,
				many,
			});

			const advertisement =
				relationsResult.advertisement as unknown as RelationCall;
			expect(advertisement.type).toBe("one");
			expect(advertisement.table).toBe(advertisementsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required name field", () => {
			const invalidData = {};
			const result =
				advertisementAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = { name: "" };
			const result =
				advertisementAttachmentsTableInsertSchema.safeParse(invalidData);
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
				advertisementId: crypto.randomUUID(),
				creatorId: crypto.randomUUID(),
			};
			const result =
				advertisementAttachmentsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [result] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.advertisementId).toBe(advertisementId);
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
				const advertisementId = await createTestAdvertisement();
				const [result] = await server.drizzleClient
					.insert(advertisementAttachmentsTable)
					.values({
						name: faker.system.fileName(),
						creatorId: userId,
						mimeType: mimeType,
						advertisementId: advertisementId,
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
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient.insert(advertisementAttachmentsTable).values({
				name: name,
				creatorId: userId,
				mimeType: mimeType,
				advertisementId: advertisementId,
			});

			const results = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(eq(advertisementAttachmentsTable.name, name));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe(name);
		});

		it("should successfully update a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert AdvertisementAttachments record");
			}
			const updatedName = faker.system.fileName();
			const updatedMimeType = "image/jpeg";

			const [updated] = await server.drizzleClient
				.update(advertisementAttachmentsTable)
				.set({
					name: updatedName,
					mimeType: updatedMimeType,
				})
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						inserted.advertisementId,
					),
				)
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(updatedName);
			expect(updated?.mimeType).toBe(updatedMimeType);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error(
					"Failed to insert advertisementAttachmentsTable record",
				);
			}

			const advertisementAttachmentsAdvertisementId = inserted.advertisementId;

			const [deleted] = await server.drizzleClient
				.delete(advertisementAttachmentsTable)
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						advertisementAttachmentsAdvertisementId,
					),
				)
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.advertisementId).toBe(
				advertisementAttachmentsAdvertisementId,
			);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						advertisementAttachmentsAdvertisementId,
					),
				)
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find advertisementAttachments by old creatorId after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert AdvertisementAttachments record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(eq(advertisementAttachmentsTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert advertisementAttachment record");
			}

			expect(inserted.creatorId).toBe(userId);
			const advertisementAttachmentId = inserted.advertisementId;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						advertisementAttachmentId,
					),
				)
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					updaterId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert advertisementAttachment record");
			}
			expect(inserted.updaterId).toBe(userId);

			const advertisementAttachmentId = inserted.advertisementId;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						advertisementAttachmentId,
					),
				)
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});

		it("should delete attachment when advertisement is deleted (cascade)", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();

			const [inserted] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: faker.system.fileName(),
					creatorId: userId,
					mimeType: "image/png",
					advertisementId: advertisementId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert advertisementAttachment record");
			}
			expect(inserted.creatorId).toBe(userId);

			const advertisementAttachmentId = inserted.advertisementId;

			await server.drizzleClient
				.delete(advertisementsTable)
				.where(eq(advertisementsTable.id, advertisementAttachmentId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(
					eq(
						advertisementAttachmentsTable.advertisementId,
						advertisementAttachmentId,
					),
				)
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should have three indexes defined", () => {
			const tableConfig = getTableConfig(advertisementAttachmentsTable);
			expect(tableConfig.indexes).toHaveLength(3);
		});

		it("should have an index on advertisementId column", () => {
			const tableConfig = getTableConfig(advertisementAttachmentsTable);
			const idx = tableConfig.indexes.find((i) =>
				i.config.columns.some(
					(col) => "name" in col && col.name === "advertisement_id",
				),
			);
			expect(idx).toBeDefined();
		});

		it("should have an index on creatorId column", () => {
			const tableConfig = getTableConfig(advertisementAttachmentsTable);
			const idx = tableConfig.indexes.find((i) =>
				i.config.columns.some(
					(col) => "name" in col && col.name === "creator_id",
				),
			);
			expect(idx).toBeDefined();
		});

		it("should have an index on createdAt column", () => {
			const tableConfig = getTableConfig(advertisementAttachmentsTable);
			const idx = tableConfig.indexes.find((i) =>
				i.config.columns.some(
					(col) => "name" in col && col.name === "created_at",
				),
			);
			expect(idx).toBeDefined();
		});

		it("should efficiently query using indexed creatorId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(eq(advertisementAttachmentsTable.creatorId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed advertisementId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";

			await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(
					eq(advertisementAttachmentsTable.advertisementId, advertisementId),
				);

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed createdAt column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const createdAt = faker.date.recent();

			await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					advertisementId: advertisementId,
					createdAt: createdAt,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(advertisementAttachmentsTable)
				.where(eq(advertisementAttachmentsTable.createdAt, createdAt));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const validMimeType = "image/png";
			const createdAt = faker.date.recent();

			const [result] = await server.drizzleClient
				.insert(advertisementAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: validMimeType,
					advertisementId: advertisementId,
					createdAt: createdAt,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.mimeType).toBe(validMimeType);
			}
		});

		it("should reject insert with invalid mimeType enum value", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const advertisementId = await createTestAdvertisement();
			const name = faker.system.fileName();
			const invalidMimeType = "invalid/mime";
			const createdAt = faker.date.recent();

			// Note: The database uses a text column with TypeScript enum typing.
			// Database-level enum constraint is not enforced; validation happens
			// at the application layer via advertisementAttachmentsTableInsertSchema.
			// This test verifies that the insert schema rejects invalid mimeTypes
			// before they reach the database.
			const insertData = {
				name: name,
				creatorId: userId,
				mimeType: invalidMimeType,
				advertisementId: advertisementId,
				createdAt: createdAt,
			};

			const parseResult =
				advertisementAttachmentsTableInsertSchema.safeParse(insertData);
			expect(parseResult.success).toBe(false);
			if (!parseResult.success) {
				expect(
					parseResult.error.issues.some((issue) =>
						issue.path.includes("mimeType"),
					),
				).toBe(true);
			}
		});

		it("should reject invalid mimeType via insert schema validation", () => {
			const invalidData = {
				name: faker.system.fileName(),
				mimeType: "invalid/mime",
				advertisementId: crypto.randomUUID(),
				creatorId: crypto.randomUUID(),
			};
			const result =
				advertisementAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("mimeType")),
				).toBe(true);
			}
		});
	});
});

import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { Mutation_createOrganization } from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { describe, expect, it } from "vitest";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import {
	actionItemCategoriesTable,
	actionItemsTable,
	advertisementsTable,
	chatsTable,
	eventsTable,
	familiesTable,
	fundsTable,
	organizationMembershipsTable,
	postsTable,
	tagFoldersTable,
	tagsTable,
	usersTable,
	venuesTable,
} from "~/src/drizzle/schema";
import {
	organizationsTable,
	organizationsTableInsertSchema,
	organizationsTableRelations,
} from "~/src/drizzle/tables/organizations";
import { server } from "../../server";

/*
 * Tests for the organizations table and its relations.
 * Test validates table schema, insertion, and relations.
 * database operations, indexes.
 */

async function createTestOrganization(): Promise<string> {
	mercuriusClient.setHeaders({});
	const { accessToken: token } = await getAdminAuthViaRest(server);
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

describe("src/drizzle/tables/organizations.ts", () => {
	describe("Organization Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(organizationsTable);
			expect(columns).toContain("addressLine1");
			expect(columns).toContain("addressLine2");
			expect(columns).toContain("avatarMimeType");
			expect(columns).toContain("avatarName");
			expect(columns).toContain("city");
			expect(columns).toContain("countryCode");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("description");
			expect(columns).toContain("id");
			expect(columns).toContain("name");
			expect(columns).toContain("postalCode");
			expect(columns).toContain("state");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("userRegistrationRequired");
		});

		it("should have correct primary key configuration", () => {
			expect(organizationsTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(organizationsTable.name.notNull).toBe(true);
			expect(organizationsTable.createdAt.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(organizationsTable.creatorId.notNull).toBe(false);
			expect(organizationsTable.updaterId.notNull).toBe(false);
			expect(organizationsTable.description.notNull).toBe(false);
			expect(organizationsTable.avatarName.notNull).toBe(false);
			expect(organizationsTable.avatarMimeType.notNull).toBe(false);
			expect(organizationsTable.updatedAt.notNull).toBe(false);
			expect(organizationsTable.addressLine1.notNull).toBe(false);
			expect(organizationsTable.addressLine2.notNull).toBe(false);
			expect(organizationsTable.city.notNull).toBe(false);
			expect(organizationsTable.countryCode.notNull).toBe(false);
			expect(organizationsTable.postalCode.notNull).toBe(false);
			expect(organizationsTable.state.notNull).toBe(false);
			expect(organizationsTable.userRegistrationRequired.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(organizationsTable.createdAt.hasDefault).toBe(true);
			expect(organizationsTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(organizationsTable).values({
					name: faker.company.name(),
					creatorId: invalidCreatorId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const orgId = await createTestOrganization();
			const invalidUpdaterId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(organizationsTable).values({
					name: faker.company.name(),
					id: orgId,
					updaterId: invalidUpdaterId,
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
					typeof organizationsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof organizationsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(organizationsTableRelations).toBeDefined();
			expect(typeof organizationsTableRelations).toBe("object");
		});

		it("should be associated with organizationsTable", () => {
			expect(organizationsTableRelations.table).toBe(organizationsTable);
		});

		it("should have a config function", () => {
			expect(typeof organizationsTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			expect(
				relationsResult.actionItemCategoriesWhereOrganization,
			).toBeDefined();
			expect(relationsResult.actionItemsWhereOrganization).toBeDefined();
			expect(relationsResult.advertisementsWhereOrganization).toBeDefined();
			expect(relationsResult.chatsWhereOrganization).toBeDefined();
			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.eventsWhereOrganization).toBeDefined();
			expect(relationsResult.familiesWhereOrganization).toBeDefined();
			expect(relationsResult.fundsWhereOrganization).toBeDefined();
			expect(relationsResult.membershipsWhereOrganization).toBeDefined();
			expect(relationsResult.postsWhereOrganization).toBeDefined();
			expect(relationsResult.tagFoldersWhereOrganization).toBeDefined();
			expect(relationsResult.tagsWhereOrganization).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.venuesWhereOrganization).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define actionItemsWhereOrganization as a one-to-many relation with actionItemsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.actionItemsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(actionItemsTable);
		});

		it("should define actionItemCategoriesWhereOrganization as a one-to-many relation with actionItemsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.actionItemCategoriesWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(actionItemCategoriesTable);
		});

		it("should define advertisementsWhereOrganization as a one-to-many relation with advertisementsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.advertisementsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(advertisementsTable);
		});

		it("should define chatsWhereOrganization as a one-to-many relation with chatsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.chatsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(chatsTable);
		});

		it("should define eventsWhereOrganization as a one-to-many relation with eventsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.eventsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(eventsTable);
		});

		it("should define familiesWhereOrganization as a one-to-many relation with familiesTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.familiesWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(familiesTable);
		});

		it("should define fundsWhereOrganization as a one-to-many relation with fundsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.fundsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(fundsTable);
		});

		it("should define membershipsWhereOrganization as a one-to-many relation with organizationMembershipsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.membershipsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(organizationMembershipsTable);
		});

		it("should define postsWhereOrganization as a one-to-many relation with postsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.postsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(postsTable);
		});

		it("should define tagsWhereOrganization as a one-to-many relation with tagsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.tagsWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(tagsTable);
		});

		it("should define tagFoldersWhereOrganization as a one-to-many relation with tagFoldersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.tagFoldersWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(tagFoldersTable);
		});

		it("should define venuesWhereOrganization as a one-to-many relation with venuesTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = organizationsTableRelations.config({ one, many });

			const organization =
				relationsResult.venuesWhereOrganization as unknown as RelationCall;
			expect(organization.type).toBe("many");
			expect(organization.table).toBe(venuesTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required name field", () => {
			const invalidData = {};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = { name: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject name exceeding maximum length", () => {
			const invalidData = { name: "aAaBcC".repeat(120) };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should accept valid name within length constraints", () => {
			const validData = { name: faker.lorem.words(5) };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept name with exactly minimum length (1 character)", () => {
			const validData = { name: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept name with exactly maximum length (256 characters)", () => {
			const validData = { name: "a".repeat(256) };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject description with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), description: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("description"),
					),
				).toBe(true);
			}
		});

		it("should reject description exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				description: "a".repeat(2049),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("description"),
					),
				).toBe(true);
			}
		});

		it("should accept valid description within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				description: faker.lorem.paragraph(),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept description with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), description: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept description with exactly maximum length (2048 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				description: "a".repeat(2048),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject avatarName with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), avatarName: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("avatarName"),
					),
				).toBe(true);
			}
		});

		it("should accept valid avatarName", () => {
			const validData = {
				name: faker.lorem.words(3),
				avatarName: faker.string.alphanumeric(10),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject addressLine1 with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), addressLine1: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine1"),
					),
				).toBe(true);
			}
		});

		it("should reject addressLine1 exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				addressLine1: "a".repeat(1025),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine1"),
					),
				).toBe(true);
			}
		});

		it("should accept valid addressLine1 within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				addressLine1: faker.lorem.paragraph(),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept addressLine1 with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), addressLine1: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept addressLine1 with exactly maximum length (1024 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				addressLine1: "a".repeat(1024),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject addressLine2 with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), addressLine2: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine2"),
					),
				).toBe(true);
			}
		});

		it("should reject addressLine2 exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				addressLine2: "a".repeat(1025),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine2"),
					),
				).toBe(true);
			}
		});

		it("should accept valid addressLine2 within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				addressLine2: faker.lorem.paragraph(),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept addressLine2 with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), addressLine2: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept addressLine2 with exactly maximum length (1024 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				addressLine2: "a".repeat(1024),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject city with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), city: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("city")),
				).toBe(true);
			}
		});

		it("should reject city exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				city: "a".repeat(65),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("city")),
				).toBe(true);
			}
		});

		it("should accept valid city within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				city: faker.location.city(),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept city with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), city: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept city with exactly maximum length (64 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				city: "a".repeat(64),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject postalCode with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), postalCode: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("postalCode"),
					),
				).toBe(true);
			}
		});

		it("should reject postalCode exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				postalCode: "a".repeat(33),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("postalCode"),
					),
				).toBe(true);
			}
		});

		it("should accept valid postalCode within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				postalCode: faker.location.zipCode(),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept postalCode with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), postalCode: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept postalCode with exactly maximum length (32 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				postalCode: "a".repeat(32),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject state with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), state: "" };
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("state")),
				).toBe(true);
			}
		});

		it("should reject state exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				state: "a".repeat(65),
			};
			const result = organizationsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("state")),
				).toBe(true);
			}
		});

		it("should accept valid state within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				state: "in",
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept state with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), state: "a" };
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept state with exactly maximum length (64 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				state: "a".repeat(64),
			};
			const result = organizationsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const testUser = await createRegularUserUsingAdmin();
			const orgName = faker.internet.displayName();

			const [result] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.id).toBeDefined();
			expect(result.name).toBe(orgName);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should reject duplicate organization names", async () => {
			const name = faker.company.name();
			await server.drizzleClient.insert(organizationsTable).values({ name });

			await expect(
				server.drizzleClient.insert(organizationsTable).values({ name }),
			).rejects.toThrow();
		});

		it("should successfully insert a record with all optional fields", async () => {
			const testUser = await createRegularUserUsingAdmin();
			const orgName = faker.internet.displayName();
			const description = faker.lorem.paragraph();
			const addressLine1 = faker.location.streetAddress();
			const addressLine2 = faker.location.secondaryAddress();
			const city = faker.location.city();
			const countryCode = "in";
			const postalCode = faker.location.zipCode();
			const state = faker.location.state();
			const avatarName = faker.system.fileName();
			const avatarMimeType = "image/png";

			const [result] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
					description,
					addressLine1,
					addressLine2,
					city,
					countryCode,
					postalCode,
					state,
					avatarName,
					avatarMimeType,
					userRegistrationRequired: true,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert organization record");
			}

			expect(result.name).toBe(orgName);
			expect(result.creatorId).toBe(testUser.userId);
			expect(result.description).toBe(description);
			expect(result.avatarName).toBe(avatarName);
			expect(result.avatarMimeType).toBe(avatarMimeType);
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const testUser = await createRegularUserUsingAdmin();

			const validMimeTypes: Array<
				"image/avif" | "image/jpeg" | "image/png" | "image/webp"
			> = ["image/avif", "image/jpeg", "image/png", "image/webp"];

			for (const mimeType of validMimeTypes) {
				const [result] = await server.drizzleClient
					.insert(organizationsTable)
					.values({
						name: `${faker.internet.displayName()}-${mimeType.replace(/\//g, "-")}`,
						creatorId: testUser.userId,
						avatarMimeType: mimeType,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					expect(result.avatarMimeType).toBe(mimeType);
				}
			}
		});

		it("should successfully query records", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			await server.drizzleClient.insert(organizationsTable).values({
				name: orgName,
				creatorId: testUser.userId,
			});

			const results = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.name, orgName));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe(orgName);
		});

		it("should successfully update a record", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();
			const newName = faker.lorem.words(4);
			const newDescription = faker.lorem.paragraph();

			const [inserted] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert organization record");
			}

			const orgId = inserted.id;

			const [updated] = await server.drizzleClient
				.update(organizationsTable)
				.set({
					name: newName,
					description: newDescription,
				})
				.where(eq(organizationsTable.id, orgId))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(newName);
			expect(updated?.description).toBe(newDescription);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			const [inserted] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert organization record");
			}

			const orgId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(orgId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.id, orgId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find organization by old creatorId after user deletion", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			const [inserted] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert organization record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.creatorId, testUser.userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			const [inserted] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert organization record");
			}
			expect(inserted.creatorId).toBe(testUser.userId);
			const orgId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.userId));

			const [updatedOrg] = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.id, orgId))
				.limit(1);

			expect(updatedOrg).toBeDefined();
			expect(updatedOrg?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			const [inserted] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					updaterId: testUser.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert organization record");
			}
			expect(inserted.updaterId).toBe(testUser.userId);

			const orgId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.userId));

			const [updatedOrg] = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.id, orgId))
				.limit(1);

			expect(updatedOrg).toBeDefined();
			expect(updatedOrg?.updaterId).toBeNull();
		});
	});

	describe("Index Configuration", () => {
		it("should efficiently query using indexed creatorId column", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.creatorId, testUser.userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed name column", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.name, orgName));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed updaterId column", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					updaterId: testUser.userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(organizationsTable)
				.where(eq(organizationsTable.updaterId, testUser.userId));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();
			const validMimeType = "image/png" as const;

			const [result] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
					avatarMimeType: validMimeType,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.avatarMimeType).toBe(validMimeType);
			}
		});

		it("should handle null values for optional enum fields", async () => {
			const orgName = faker.internet.displayName();
			const testUser = await createRegularUserUsingAdmin();

			const [result] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: orgName,
					creatorId: testUser.userId,
					avatarMimeType: null,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.avatarMimeType).toBeNull();
			}
		});

		it("should accept valid ISO 3166-1 alpha-2 country codes", () => {
			const result = iso3166Alpha2CountryCodeEnum.safeParse("in");
			expect(result.success).toBe(true);
		});

		it("should reject invalid ISO 3166-1 alpha-2 country codes", () => {
			const result = iso3166Alpha2CountryCodeEnum.safeParse("xyz");
			expect(result.success).toBe(false);
		});

		it("should reject uppercase country codes", () => {
			const result = iso3166Alpha2CountryCodeEnum.safeParse("IN");
			expect(result.success).toBe(false);
		});
	});
});

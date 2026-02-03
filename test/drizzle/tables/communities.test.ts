import { getTableName } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it } from "vitest";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import {
	communitiesTable,
	communitiesTableInsertSchema,
	communitiesTableRelations,
} from "~/src/drizzle/tables/communities";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/communities.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(communitiesTable)).toBe("communities");
		});

		it("should have all required columns defined", () => {
			const config = getTableConfig(communitiesTable);
			const columns = config.columns.map((col) => col.name);
			expect(columns).toContain("id");
			expect(columns).toContain("created_at");
			expect(columns).toContain("updated_at");
			expect(columns).toContain("name");
			expect(columns).toContain("facebook_url");
			expect(columns).toContain("github_url");
			expect(columns).toContain("inactivity_timeout_duration");
			expect(columns).toContain("instagram_url");
			expect(columns).toContain("linkedin_url");
			expect(columns).toContain("logo_mime_type");
			expect(columns).toContain("logo_name");
			expect(columns).toContain("reddit_url");
			expect(columns).toContain("slack_url");
			expect(columns).toContain("updater_id");
			expect(columns).toContain("website_url");
			expect(columns).toContain("x_url");
			expect(columns).toContain("youtube_url");
		});

		it("should have correct primary key configuration", () => {
			const config = getTableConfig(communitiesTable);
			const idColumn = config.columns.find((col) => col.name === "id");
			expect(idColumn?.primary).toBe(true);
		});

		it("should have correct foreign key relationships", () => {
			const config = getTableConfig(communitiesTable);
			expect(config.foreignKeys).toHaveLength(1);
			const updaterFk = config.foreignKeys[0];
			expect(updaterFk).toBeDefined();
			expect(updaterFk?.onDelete).toBe("set null");
			expect(updaterFk?.onUpdate).toBe("cascade");
			const ref = updaterFk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have correct column types and constraints", () => {
			const config = getTableConfig(communitiesTable);
			const nameColumn = config.columns.find((col) => col.name === "name");
			expect(nameColumn?.notNull).toBe(true);

			const logoMimeTypeColumn = config.columns.find(
				(col) => col.name === "logo_mime_type",
			);
			expect(logoMimeTypeColumn?.enumValues).toEqual(imageMimeTypeEnum.options);
		});
	});

	describe("Table Relations", () => {
		it("should be defined", () => {
			expect(communitiesTableRelations).toBeDefined();
		});

		it("should be associated with communitiesTable", () => {
			expect(communitiesTableRelations.table).toBe(communitiesTable);
		});

		describe("relation definitions", () => {
			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				config: {
					fields: PgColumn[];
					references: PgColumn[];
					relationName?: string;
				};
				withFieldName: (fieldName: string) => RelationCall;
			};

			let one: Parameters<typeof communitiesTableRelations.config>[0]["one"];
			let many: Parameters<typeof communitiesTableRelations.config>[0]["many"];
			let relationsResult: ReturnType<typeof communitiesTableRelations.config>;

			const createMockBuilders = () => {
				const one = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "one" as const,
						table,
						config: config as RelationCall["config"],
						withFieldName: () => result,
					};
					return result;
				};

				const many = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "many" as const,
						table,
						config: config as RelationCall["config"],
						withFieldName: () => result,
					};
					return result;
				};

				return {
					one: one as unknown as Parameters<
						typeof communitiesTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof communitiesTableRelations.config
					>[0]["many"],
				};
			};

			beforeEach(() => {
				const builders = createMockBuilders();
				one = builders.one;
				many = builders.many;
				relationsResult = communitiesTableRelations.config({
					one,
					many,
				});
			});

			it("should define correct many-to-one relationships", () => {
				expect(relationsResult.updater).toBeDefined();
				const updaterRel = relationsResult.updater as unknown as RelationCall;
				expect(updaterRel.type).toBe("one");
				expect(updaterRel.table).toBe(usersTable);
				expect(updaterRel.config.relationName).toBe(
					"community.updater_id:users.id",
				);
				expect(updaterRel.config.fields.map((col) => col.name)).toEqual([
					"updater_id",
				]);
				expect(updaterRel.config.references.map((col) => col.name)).toEqual([
					"id",
				]);
			});
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required fields", () => {
			const invalidData = {};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();
		});

		it("should accept valid data", () => {
			const validData = {
				name: "Test Community",
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should validate URL fields", () => {
			const invalidData = {
				name: "Test Community",
				facebookURL: "invalid-url",
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const validData = {
				name: "Test Community",
				facebookURL: "https://example.com",
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should validate name length", () => {
			const invalidData = {
				name: "a".repeat(257),
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const validData = {
				name: "a".repeat(256),
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should validate inactivity timeout duration", () => {
			const invalidData = {
				name: "Test Community",
				inactivityTimeoutDuration: 0,
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const invalidDataNegative = {
				name: "Test Community",
				inactivityTimeoutDuration: -1,
			};
			expect(() =>
				communitiesTableInsertSchema.parse(invalidDataNegative),
			).toThrow();

			const validData = {
				name: "Test Community",
				inactivityTimeoutDuration: 60,
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should validate logo name length", () => {
			const invalidData = {
				name: "Test Community",
				logoName: "",
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const validData = {
				name: "Test Community",
				logoName: "logo.png",
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should accept all optional URL fields", () => {
			const validData = {
				name: "Test Community",
				facebookURL: "https://example.com",
				githubURL: "https://example.com",
				instagramURL: "https://example.com",
				linkedinURL: "https://example.com",
				redditURL: "https://example.com",
				slackURL: "https://example.com",
				websiteURL: "https://example.com",
				xURL: "https://example.com",
				youtubeURL: "https://example.com",
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});

		it("should parse insert data without DB defaults", () => {
			const data = { name: "Test Community" };
			const parsed = communitiesTableInsertSchema.parse(data);
			expect(parsed).toStrictEqual(data);
		});

		it("should validate updaterId as valid UUID or null", () => {
			const invalidData = {
				name: "Test Community",
				updaterId: "invalid-uuid",
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const validDataUUID = {
				name: "Test Community",
				updaterId: "550e8400-e29b-41d4-a716-446655440000",
			};
			expect(() =>
				communitiesTableInsertSchema.parse(validDataUUID),
			).not.toThrow();

			const validDataNull = {
				name: "Test Community",
				updaterId: null,
			};
			expect(() =>
				communitiesTableInsertSchema.parse(validDataNull),
			).not.toThrow();
		});

		it("should allow duplicate names as uniqueness is enforced at DB level", () => {
			const data1 = { name: "Test Community" };
			const data2 = { name: "Test Community" };
			expect(() => communitiesTableInsertSchema.parse(data1)).not.toThrow();
			expect(() => communitiesTableInsertSchema.parse(data2)).not.toThrow();
		});

		it("should reject empty name", () => {
			const invalidData = {
				name: "",
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();
		});

		it("should accept inactivityTimeoutDuration of 1", () => {
			const validData = {
				name: "Test Community",
				inactivityTimeoutDuration: 1,
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});
	});

	describe("Enum Constraints", () => {
		it("should enforce logo mime type enum values", () => {
			const invalidData = {
				name: "Test Community",
				logoMimeType: "invalid-mime",
			};
			expect(() => communitiesTableInsertSchema.parse(invalidData)).toThrow();

			const validData = {
				name: "Test Community",
				logoMimeType: imageMimeTypeEnum.options[0],
			};
			expect(() => communitiesTableInsertSchema.parse(validData)).not.toThrow();
		});
	});
});

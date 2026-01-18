import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	agendaItemUrlTable,
	agendaItemUrlTableInsertSchema,
	agendaItemUrlTableRelations,
} from "~/src/drizzle/tables/agendaItemUrls";

describe("agendaItemUrlTable", () => {
	describe("agendaItemUrlTableInsertSchema", () => {
		const validData = {
			agendaItemId: "01234567-89ab-cdef-0123-456789abcdef",
			url: "https://example.com",
		};

		describe("agendaItemId field", () => {
			it("should accept a valid UUID", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse(validData);
				expect(result.success).toBe(true);
			});

			it("should reject missing agendaItemId", () => {
				const { agendaItemId: _id, ...data } = validData;
				const result =
					agendaItemUrlTableInsertSchema.safeParse(data);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						agendaItemId: "invalid-uuid",
					});
				expect(result.success).toBe(false);
			});

			it("should reject null agendaItemId", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						agendaItemId: null,
					});
				expect(result.success).toBe(false);
			});
		});

		describe("url field", () => {
			it("should accept a valid URL", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse(validData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid URL format", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						url: "not-a-url",
					});
				expect(result.success).toBe(false);
			});

			it("should reject empty url", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						url: "",
					});
				expect(result.success).toBe(false);
			});

			it("should reject missing url", () => {
				const { url: _url, ...data } = validData;
				const result =
					agendaItemUrlTableInsertSchema.safeParse(data);
				expect(result.success).toBe(false);
			});

			it("should reject null url", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						url: null,
					});
				expect(result.success).toBe(false);
			});
		});

		describe("optional fields", () => {
			it("should accept undefined creatorId", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse(validData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						creatorId: null,
					});
				expect(result.success).toBe(true);
			});

			it("should accept explicit createdAt", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						createdAt: new Date(),
					});
				expect(result.success).toBe(true);
			});

			it("should accept explicit updatedAt", () => {
				const result =
					agendaItemUrlTableInsertSchema.safeParse({
						...validData,
						updatedAt: new Date(),
					});
				expect(result.success).toBe(true);
			});
		});
	});

	describe("agendaItemUrlTable structure", () => {
		it("should have id as primary key", () => {
			expect(agendaItemUrlTable.id).toBeDefined();
			expect(agendaItemUrlTable.id.name).toBe("id");
		});

		it("should have agendaItemId column", () => {
			expect(agendaItemUrlTable.agendaItemId).toBeDefined();
			expect(agendaItemUrlTable.agendaItemId.name).toBe(
				"agenda_item_id",
			);
		});

		it("should have url column", () => {
			expect(agendaItemUrlTable.url).toBeDefined();
			expect(agendaItemUrlTable.url.name).toBe("url");
		});

		it("should have createdAt column", () => {
			expect(agendaItemUrlTable.createdAt).toBeDefined();
			expect(agendaItemUrlTable.createdAt.name).toBe("created_at");
		});

		it("should have updatedAt column", () => {
			expect(agendaItemUrlTable.updatedAt).toBeDefined();
			expect(agendaItemUrlTable.updatedAt.name).toBe("updated_at");
		});

		it("should have creatorId column", () => {
			expect(agendaItemUrlTable.creatorId).toBeDefined();
			expect(agendaItemUrlTable.creatorId.name).toBe("creator_id");
		});

		it("should have updaterId column", () => {
			expect(agendaItemUrlTable.updaterId).toBeDefined();
			expect(agendaItemUrlTable.updaterId.name).toBe("updater_id");
		});
	});

	describe("agendaItemUrlTable indexes", () => {
		const tableConfig = getTableConfig(agendaItemUrlTable);

		const getColumnName = (
			col:
				| (typeof tableConfig.indexes)[0]["config"]["columns"][0]
				| undefined,
		): string | undefined =>
			col && "name" in col ? (col.name as string) : undefined;

		it("should have index on createdAt", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "created_at",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on agendaItemId", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					getColumnName(i.config.columns[0]) ===
					"agenda_item_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have unique index on agendaItemId + url", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.unique === true &&
					i.config.columns.length === 2 &&
					i.config.columns.some(
						(c) => getColumnName(c) === "agenda_item_id",
					) &&
					i.config.columns.some(
						(c) => getColumnName(c) === "url",
					),
			);
			expect(idx).toBeDefined();
			expect(idx?.config.unique).toBe(true);
		});

		it("should have exactly 5 indexes", () => {
			expect(tableConfig.indexes.length).toBe(5);
		});
	});

	describe("agendaItemUrlTableRelations", () => {
        interface CapturedRelation {
            table: Table;
            config: {
                relationName?: string;
                fields?: unknown[];
                references?: unknown[];
            };
        }

        interface MockHelpers {
            one: (
                table: Table,
                config?: CapturedRelation["config"],
            ) => { withFieldName: () => object };
        }

        let captured: Record<string, CapturedRelation> = {};

        beforeAll(() => {
            captured = {};
            (
                agendaItemUrlTableRelations.config as unknown as (
                    helpers: MockHelpers,
                ) => unknown
            )({
                one: (table, config) => {
                    if (config?.relationName?.includes("agenda_item_id")) {
                        captured.agendaItem = { table, config };
                    }
                    if (config?.relationName?.includes("creator_id")) {
                        captured.creator = { table, config };
                    }
                    if (config?.relationName?.includes("updater_id")) {
                        captured.updater = { table, config };
                    }
                    return { withFieldName: () => ({}) };
                },
            });
        });

        it("should define agendaItem relation", () => {
            expect(captured.agendaItem).toBeDefined();

            const table = captured.agendaItem?.table;
            expect(table).toBeDefined();
            expect(getTableName(table as Table)).toBe("agenda_items");
        });

        it("should define creator relation", () => {
            expect(captured.creator).toBeDefined();

            const table = captured.creator?.table;
            expect(table).toBeDefined();
            expect(getTableName(table as Table)).toBe("users");
        });

        it("should define updater relation", () => {
            expect(captured.updater).toBeDefined();

            const table = captured.updater?.table;
            expect(table).toBeDefined();
            expect(getTableName(table as Table)).toBe("users");
        });
    });
});

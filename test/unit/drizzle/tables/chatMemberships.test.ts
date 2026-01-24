import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { chatMembershipRoleEnum } from "~/src/drizzle/enums/chatMembershipRole";
import {
	chatMembershipsTable,
	chatMembershipsTableInsertSchema,
	chatMembershipsTableRelations,
} from "~/src/drizzle/tables/chatMemberships";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/chatMemberships.ts", () => {
	describe("chatMembershipsTable schema", () => {
		it("should be defined as a pgTable", () => {
			expect(chatMembershipsTable).toBeDefined();
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(chatMembershipsTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("chatId");
			expect(columns).toContain("memberId");
			expect(columns).toContain("role");
			expect(columns).toContain("lastReadAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have correct primary key configuration", () => {
			const { primaryKeys } = getTableConfig(chatMembershipsTable);
			expect(primaryKeys).toHaveLength(1);
			expect(primaryKeys[0]?.columns).toHaveLength(2);
			const pkColumns = primaryKeys[0]?.columns.map((col) => col.name);
			expect(pkColumns).toContain("chat_id");
			expect(pkColumns).toContain("member_id");
		});

		it("should have correct column configurations", () => {
			expect(chatMembershipsTable.createdAt).toBeDefined();
			expect(chatMembershipsTable.creatorId).toBeDefined();
			expect(chatMembershipsTable.chatId).toBeDefined();
			expect(chatMembershipsTable.memberId).toBeDefined();
			expect(chatMembershipsTable.role).toBeDefined();
			expect(chatMembershipsTable.lastReadAt).toBeDefined();
			expect(chatMembershipsTable.updatedAt).toBeDefined();
			expect(chatMembershipsTable.updaterId).toBeDefined();
		});

		it("should have correct not null constraints", () => {
			expect(chatMembershipsTable.createdAt.notNull).toBe(true);
			expect(chatMembershipsTable.chatId.notNull).toBe(true);
			expect(chatMembershipsTable.memberId.notNull).toBe(true);
			expect(chatMembershipsTable.role.notNull).toBe(true);

			// Optional/Nullable fields
			expect(chatMembershipsTable.creatorId.notNull).toBe(false);
			expect(chatMembershipsTable.lastReadAt.notNull).toBe(false);
			expect(chatMembershipsTable.updatedAt.notNull).toBe(false);
			expect(chatMembershipsTable.updaterId.notNull).toBe(false);
		});

		it("should have default value for createdAt", () => {
			expect(chatMembershipsTable.createdAt.hasDefault).toBe(true);
		});

		it("should have foreign keys properly defined", () => {
			const { foreignKeys } = getTableConfig(chatMembershipsTable);
			expect(foreignKeys).toHaveLength(4);
		});

		it("should have chatId referencing chatsTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(chatMembershipsTable);
			const fk = foreignKeys.find((k) => {
				const ref = k.reference();
				return ref.columns.some((col) => col.name === "chat_id");
			});

			expect(fk).toBeDefined();
			const ref = fk?.reference();
			expect(ref?.foreignTable).toBe(chatsTable);
			expect(fk?.onDelete).toBe("cascade");
			expect(fk?.onUpdate).toBe("cascade");
		});

		it("should have memberId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(chatMembershipsTable);
			const fk = foreignKeys.find((k) => {
				const ref = k.reference();
				return ref.columns.some((col) => col.name === "member_id");
			});

			expect(fk).toBeDefined();
			const ref = fk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(fk?.onDelete).toBe("cascade");
			expect(fk?.onUpdate).toBe("cascade");
		});

		it("should have creatorId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(chatMembershipsTable);
			const fk = foreignKeys.find((k) => {
				const ref = k.reference();
				return ref.columns.some((col) => col.name === "creator_id");
			});

			expect(fk).toBeDefined();
			const ref = fk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(fk?.onDelete).toBe("set null");
			expect(fk?.onUpdate).toBe("cascade");
		});

		it("should have updaterId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(chatMembershipsTable);
			const fk = foreignKeys.find((k) => {
				const ref = k.reference();
				return ref.columns.some((col) => col.name === "updater_id");
			});

			expect(fk).toBeDefined();
			const ref = fk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(fk?.onDelete).toBe("set null");
			expect(fk?.onUpdate).toBe("cascade");
		});

		it("should have role using enum", () => {
			expect(chatMembershipsTable.role.enumValues).toEqual(
				chatMembershipRoleEnum.options,
			);
		});
	});

	describe("Indexes", () => {
		it("should have appropriate indexes defined", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			expect(indexes).toHaveLength(6);
		});

		it("should have index on chatId", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "chat_id"),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on createdAt", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "created_at"),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on creatorId", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "creator_id"),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on memberId", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "member_id"),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on role", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "role"),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on lastReadAt", () => {
			const { indexes } = getTableConfig(chatMembershipsTable);
			const idx = indexes.find((i) =>
				i.config.columns.some((c) => "name" in c && c.name === "last_read_at"),
			);
			expect(idx).toBeDefined();
		});
	});

	describe("chatMembershipsTableRelations", () => {
		it("should be defined", () => {
			expect(chatMembershipsTableRelations).toBeDefined();
		});

		it("should have correct relation configuration", () => {
			const createMockRelation = () => ({
				withFieldName: vi.fn().mockReturnThis(),
			});

			const mockOne = vi.fn().mockImplementation(() => createMockRelation());
			const mockMany = vi.fn().mockImplementation(() => createMockRelation());

			chatMembershipsTableRelations.config({
				one: mockOne,
				many: mockMany,
			});

			// Verify 'chat' relation
			expect(mockOne).toHaveBeenCalledWith(chatsTable, {
				fields: [chatMembershipsTable.chatId],
				references: [chatsTable.id],
				relationName: "chat_memberships.chat_id:chats.id",
			});

			// Verify 'creator' relation
			expect(mockOne).toHaveBeenCalledWith(usersTable, {
				fields: [chatMembershipsTable.creatorId],
				references: [usersTable.id],
				relationName: "chat_memberships.creator_id:users.id",
			});

			// Verify 'member' relation
			expect(mockOne).toHaveBeenCalledWith(usersTable, {
				fields: [chatMembershipsTable.memberId],
				references: [usersTable.id],
				relationName: "chat_memberships.member_id:users.id",
			});

			// Verify 'updater' relation
			expect(mockOne).toHaveBeenCalledWith(usersTable, {
				fields: [chatMembershipsTable.updaterId],
				references: [usersTable.id],
				relationName: "chat_memberships.updater_id:users.id",
			});
		});

		it("should reference the correct table", () => {
			expect(chatMembershipsTableRelations.table).toBe(chatMembershipsTable);
		});
	});

	describe("chatMembershipsTableInsertSchema", () => {
		const validInput = {
			chatId: faker.string.uuid(),
			memberId: faker.string.uuid(),
			role: "administrator",
		};

		it("should accept valid input", () => {
			const result = chatMembershipsTableInsertSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should reject missing chatId", () => {
			const { chatId, ...input } = validInput;
			const result = chatMembershipsTableInsertSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing memberId", () => {
			const { memberId, ...input } = validInput;
			const result = chatMembershipsTableInsertSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject missing role", () => {
			const { role, ...input } = validInput;
			const result = chatMembershipsTableInsertSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it("should reject invalid role enum", () => {
			const result = chatMembershipsTableInsertSchema.safeParse({
				...validInput,
				role: "invalid-role",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid UUIDs", () => {
			const result = chatMembershipsTableInsertSchema.safeParse({
				...validInput,
				chatId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should accept optional fields", () => {
			const result = chatMembershipsTableInsertSchema.safeParse({
				...validInput,
				creatorId: faker.string.uuid(),
				updaterId: faker.string.uuid(),
				lastReadAt: new Date(),
			});
			expect(result.success).toBe(true);
		});
	});
});

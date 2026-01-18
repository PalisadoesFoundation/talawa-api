import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { iso639Set1LanguageCodeEnum } from "~/src/drizzle/enums/iso639Set1LanguageCode";
import { userEducationGradeEnum } from "~/src/drizzle/enums/userEducationGrade";
import { userEmploymentStatusEnum } from "~/src/drizzle/enums/userEmploymentStatus";
import { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { userNatalSexEnum } from "~/src/drizzle/enums/userNatalSex";
import { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { commentsTable } from "~/src/drizzle/tables/comments";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { communitiesTable } from "~/src/drizzle/tables/communities";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { familiesTable } from "~/src/drizzle/tables/families";
import { familyMembershipsTable } from "~/src/drizzle/tables/familyMemberships";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { fundsTable } from "~/src/drizzle/tables/funds";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { postVotesTable } from "~/src/drizzle/tables/postVotes";
import { tagAssignmentsTable } from "~/src/drizzle/tables/tagAssignments";
import { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import { tagsTable } from "~/src/drizzle/tables/tags";
import {
	usersTable,
	usersTableInsertSchema,
	usersTableRelations,
} from "~/src/drizzle/tables/users";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venueBookingsTable } from "~/src/drizzle/tables/venueBookings";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { server } from "../../server";

describe("src/drizzle/tables/users.ts - Table Definition Tests", () => {
	async function createTestUser(overrides?: {
		emailAddress?: string;
		role?: "administrator" | "regular";
		creatorId?: string | null;
		updaterId?: string | null;
	}) {
		const testEmail =
			overrides?.emailAddress ?? `test.user.${faker.string.ulid()}@email.com`;
		const testPassword = "password";
		const hashedPassword = await hash(testPassword);

		const [userRow] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: testEmail,
				passwordHash: hashedPassword,
				role: overrides?.role ?? "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
				creatorId: overrides?.creatorId,
				updaterId: overrides?.updaterId,
			})
			.returning();

		if (!userRow?.id) {
			throw new Error("Failed to create test user");
		}

		return userRow;
	}

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(usersTable)).toBe("users");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(usersTable);
			expect(columns).toContain("id");
			expect(columns).toContain("addressLine1");
			expect(columns).toContain("addressLine2");
			expect(columns).toContain("avatarMimeType");
			expect(columns).toContain("avatarName");
			expect(columns).toContain("birthDate");
			expect(columns).toContain("city");
			expect(columns).toContain("countryCode");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("description");
			expect(columns).toContain("educationGrade");
			expect(columns).toContain("emailAddress");
			expect(columns).toContain("employmentStatus");
			expect(columns).toContain("failedLoginAttempts");
			expect(columns).toContain("homePhoneNumber");
			expect(columns).toContain("isEmailAddressVerified");
			expect(columns).toContain("lastFailedLoginAt");
			expect(columns).toContain("lockedUntil");
			expect(columns).toContain("maritalStatus");
			expect(columns).toContain("mobilePhoneNumber");
			expect(columns).toContain("name");
			expect(columns).toContain("natalSex");
			expect(columns).toContain("naturalLanguageCode");
			expect(columns).toContain("passwordHash");
			expect(columns).toContain("postalCode");
			expect(columns).toContain("role");
			expect(columns).toContain("state");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("workPhoneNumber");
		});

		it("should have correct primary key configuration", () => {
			expect(usersTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(usersTable.emailAddress.notNull).toBe(true);
			expect(usersTable.passwordHash.notNull).toBe(true);
			expect(usersTable.role.notNull).toBe(true);
			expect(usersTable.name.notNull).toBe(true);
			expect(usersTable.isEmailAddressVerified.notNull).toBe(true);
			expect(usersTable.createdAt.notNull).toBe(true);
			expect(usersTable.failedLoginAttempts.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(usersTable.addressLine1.notNull).toBe(false);
			expect(usersTable.addressLine2.notNull).toBe(false);
			expect(usersTable.avatarMimeType.notNull).toBe(false);
			expect(usersTable.avatarName.notNull).toBe(false);
			expect(usersTable.birthDate.notNull).toBe(false);
			expect(usersTable.city.notNull).toBe(false);
			expect(usersTable.countryCode.notNull).toBe(false);
			expect(usersTable.creatorId.notNull).toBe(false);
			expect(usersTable.description.notNull).toBe(false);
			expect(usersTable.educationGrade.notNull).toBe(false);
			expect(usersTable.employmentStatus.notNull).toBe(false);
			expect(usersTable.homePhoneNumber.notNull).toBe(false);
			expect(usersTable.lastFailedLoginAt.notNull).toBe(false);
			expect(usersTable.lockedUntil.notNull).toBe(false);
			expect(usersTable.maritalStatus.notNull).toBe(false);
			expect(usersTable.mobilePhoneNumber.notNull).toBe(false);
			expect(usersTable.natalSex.notNull).toBe(false);
			expect(usersTable.naturalLanguageCode.notNull).toBe(false);
			expect(usersTable.postalCode.notNull).toBe(false);
			expect(usersTable.state.notNull).toBe(false);
			expect(usersTable.updatedAt.notNull).toBe(false);
			expect(usersTable.updaterId.notNull).toBe(false);
			expect(usersTable.workPhoneNumber.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(usersTable.createdAt.hasDefault).toBe(true);
			expect(usersTable.id.hasDefault).toBe(true);
			expect(usersTable.failedLoginAttempts.hasDefault).toBe(true);
		});

		it("should have unique constraint on emailAddress", () => {
			expect(usersTable.emailAddress.isUnique).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should have creatorId column defined", () => {
			expect(usersTable.creatorId).toBeDefined();
		});

		it("should have updaterId column defined", () => {
			expect(usersTable.updaterId).toBeDefined();
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidUserId = faker.string.uuid();
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");

			await expect(
				server.drizzleClient.insert(usersTable).values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "regular",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
					creatorId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUserId = faker.string.uuid();
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");

			await expect(
				server.drizzleClient.insert(usersTable).values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "regular",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
					updaterId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should accept valid creatorId foreign key", async () => {
			const creator = await createTestUser();

			const [result] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: `test.user.${faker.string.ulid()}@email.com`,
					passwordHash: await hash("password"),
					role: "regular",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
					creatorId: creator.id,
				})
				.returning();

			expect(result).toBeDefined();
			expect(result?.creatorId).toBe(creator.id);
		});

		it("should accept valid updaterId foreign key", async () => {
			const updater = await createTestUser();

			const [result] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: `test.user.${faker.string.ulid()}@email.com`,
					passwordHash: await hash("password"),
					role: "regular",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
					updaterId: updater.id,
				})
				.returning();

			expect(result).toBeDefined();
			expect(result?.updaterId).toBe(updater.id);
		});
	});

	describe("Table Relations", () => {
		// Type for tracking relation calls
		type RelationCall = {
			type: "one" | "many";
			table: unknown;
			config: unknown;
			withFieldName: (fieldName: string) => RelationCall;
		};

		// Helper to create mock builders that track calls
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
					typeof usersTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof usersTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(usersTableRelations).toBeDefined();
			expect(typeof usersTableRelations).toBe("object");
		});

		it("should be associated with usersTable", () => {
			expect(usersTableRelations.table).toBe(usersTable);
		});

		it("should have a config function", () => {
			expect(typeof usersTableRelations.config).toBe("function");
		});

		it("should define all expected relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			// Self-referential relations
			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.updater).toBeDefined();

			// Action items relations
			expect(relationsResult.actionItemsWhereAssignee).toBeDefined();
			expect(relationsResult.actionItemsWhereCreator).toBeDefined();
			expect(relationsResult.actionItemsWhereUpdater).toBeDefined();

			// Action item categories relations
			expect(relationsResult.actionItemCategoriesWhereCreator).toBeDefined();
			expect(relationsResult.actionItemCategoriesWhereUpdater).toBeDefined();

			// Advertisement relations
			expect(relationsResult.advertisementAttachmentsWhereCreator).toBeDefined();
			expect(relationsResult.advertisementAttachmentsWhereUpdater).toBeDefined();
			expect(relationsResult.advertisementsWhereCreator).toBeDefined();
			expect(relationsResult.advertisementsWhereUpdater).toBeDefined();

			// Agenda relations
			expect(relationsResult.agendaFoldersWhereCreator).toBeDefined();
			expect(relationsResult.agendaFoldersWhereUpdater).toBeDefined();
			expect(relationsResult.agendaItemsWhereCreator).toBeDefined();
			expect(relationsResult.agendaItemsWhereUpdater).toBeDefined();

			// Chat relations
			expect(relationsResult.chatsWhereCreator).toBeDefined();
			expect(relationsResult.chatsWhereUpdater).toBeDefined();
			expect(relationsResult.chatMembershipsWhereCreator).toBeDefined();
			expect(relationsResult.chatMembershipsWhereMember).toBeDefined();
			expect(relationsResult.chatMembershipsWhereUpdater).toBeDefined();
			expect(relationsResult.chatMessagesWhereCreator).toBeDefined();

			// Comments relations
			expect(relationsResult.commentsWhereCreator).toBeDefined();
			expect(relationsResult.commentVotesWhereCreator).toBeDefined();
			expect(relationsResult.commentVotesWhereUpdater).toBeDefined();

			// Communities relations
			expect(relationsResult.communitiesWhereUpdater).toBeDefined();

			// Events relations
			expect(relationsResult.eventsWhereCreator).toBeDefined();
			expect(relationsResult.eventsWhereUpdater).toBeDefined();
			expect(relationsResult.eventAttachmentsWhereCreator).toBeDefined();
			expect(relationsResult.eventAttachmentsWhereUpdater).toBeDefined();

			// Families relations
			expect(relationsResult.familiesWhereCreator).toBeDefined();
			expect(relationsResult.familiesWhereUpdater).toBeDefined();
			expect(relationsResult.familyMembershipsWhereCreator).toBeDefined();
			expect(relationsResult.familyMembershipsWhereMember).toBeDefined();
			expect(relationsResult.familyMembershipsWhereUpdater).toBeDefined();

			// Fund relations
			expect(relationsResult.fundCampaignsWhereCreator).toBeDefined();
			expect(relationsResult.fundCampaignsWhereUpdater).toBeDefined();
			expect(relationsResult.fundsWhereCreator).toBeDefined();
			expect(relationsResult.fundsWhereUpdater).toBeDefined();
			expect(relationsResult.fundCampaignPledgesWhereCreator).toBeDefined();
			expect(relationsResult.fundCampaignPledgesWherePledger).toBeDefined();
			expect(relationsResult.fundCampaignPledgesWhereUpdater).toBeDefined();

			// Organization relations
			expect(relationsResult.organizationsWhereCreator).toBeDefined();
			expect(relationsResult.organizationsWhereUpdater).toBeDefined();
			expect(relationsResult.organizationMembershipsWhereCreator).toBeDefined();
			expect(relationsResult.organizationMembershipsWhereMember).toBeDefined();
			expect(relationsResult.organizationMembershipsWhereUpdater).toBeDefined();

			// Posts relations
			expect(relationsResult.postsWhereCreator).toBeDefined();
			expect(relationsResult.postsWhereUpdater).toBeDefined();
			expect(relationsResult.postAttachmentsWhereCreator).toBeDefined();
			expect(relationsResult.postAttachmentsWhereUpdater).toBeDefined();
			expect(relationsResult.postVotesWhereCreator).toBeDefined();

			// Tags relations
			expect(relationsResult.tagFoldersWhereCreator).toBeDefined();
			expect(relationsResult.tagFoldersWhereUpdater).toBeDefined();
			expect(relationsResult.tagsWhereCreator).toBeDefined();
			expect(relationsResult.tagsWhereUpdater).toBeDefined();
			expect(relationsResult.tagAssignmentsWhereAssignee).toBeDefined();
			expect(relationsResult.tagAssignmentsWhereCreator).toBeDefined();

			// Venue relations
			expect(relationsResult.venuesWhereCreator).toBeDefined();
			expect(relationsResult.venuesWhereUpdater).toBeDefined();
			expect(relationsResult.venueAttachmentsWhereCreator).toBeDefined();
			expect(relationsResult.venueAttachmentsWhereUpdater).toBeDefined();
			expect(relationsResult.venueBookingsWhereCreator).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define actionItemsWhereAssignee as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.actionItemsWhereAssignee as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(actionItemsTable);
		});

		it("should define actionItemsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.actionItemsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(actionItemsTable);
		});

		it("should define actionItemsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.actionItemsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(actionItemsTable);
		});

		it("should define actionItemCategoriesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.actionItemCategoriesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(actionItemCategoriesTable);
		});

		it("should define actionItemCategoriesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.actionItemCategoriesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(actionItemCategoriesTable);
		});

		it("should define advertisementAttachmentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.advertisementAttachmentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(advertisementAttachmentsTable);
		});

		it("should define advertisementAttachmentsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.advertisementAttachmentsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(advertisementAttachmentsTable);
		});

		it("should define advertisementsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.advertisementsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(advertisementsTable);
		});

		it("should define advertisementsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.advertisementsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(advertisementsTable);
		});

		it("should define agendaFoldersWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.agendaFoldersWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(agendaFoldersTable);
		});

		it("should define agendaFoldersWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.agendaFoldersWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(agendaFoldersTable);
		});

		it("should define agendaItemsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.agendaItemsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(agendaItemsTable);
		});

		it("should define agendaItemsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.agendaItemsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(agendaItemsTable);
		});

		it("should define chatsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatsTable);
		});

		it("should define chatsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatsTable);
		});

		it("should define chatMembershipsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatMembershipsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatMembershipsTable);
		});

		it("should define chatMembershipsWhereMember as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatMembershipsWhereMember as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatMembershipsTable);
		});

		it("should define chatMembershipsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatMembershipsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatMembershipsTable);
		});

		it("should define chatMessagesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.chatMessagesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(chatMessagesTable);
		});

		it("should define commentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.commentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(commentsTable);
		});

		it("should define commentVotesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.commentVotesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(commentVotesTable);
		});

		it("should define commentVotesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.commentVotesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(commentVotesTable);
		});

		it("should define communitiesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.communitiesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(communitiesTable);
		});

		it("should define eventsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.eventsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(eventsTable);
		});

		it("should define eventsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.eventsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(eventsTable);
		});

		it("should define eventAttachmentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.eventAttachmentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(eventAttachmentsTable);
		});

		it("should define eventAttachmentsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.eventAttachmentsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(eventAttachmentsTable);
		});

		it("should define familiesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.familiesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(familiesTable);
		});

		it("should define familiesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.familiesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(familiesTable);
		});

		it("should define familyMembershipsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.familyMembershipsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(familyMembershipsTable);
		});

		it("should define familyMembershipsWhereMember as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.familyMembershipsWhereMember as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(familyMembershipsTable);
		});

		it("should define familyMembershipsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.familyMembershipsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(familyMembershipsTable);
		});

		it("should define fundCampaignsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundCampaignsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundCampaignsTable);
		});

		it("should define fundCampaignsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundCampaignsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundCampaignsTable);
		});

		it("should define fundsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundsTable);
		});

		it("should define fundsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundsTable);
		});

		it("should define organizationsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.organizationsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(organizationsTable);
		});

		it("should define organizationsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.organizationsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(organizationsTable);
		});

		it("should define organizationMembershipsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.organizationMembershipsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(organizationMembershipsTable);
		});

		it("should define organizationMembershipsWhereMember as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.organizationMembershipsWhereMember as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(organizationMembershipsTable);
		});

		it("should define organizationMembershipsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.organizationMembershipsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(organizationMembershipsTable);
		});

		it("should define fundCampaignPledgesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundCampaignPledgesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundCampaignPledgesTable);
		});

		it("should define fundCampaignPledgesWherePledger as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundCampaignPledgesWherePledger as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundCampaignPledgesTable);
		});

		it("should define fundCampaignPledgesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.fundCampaignPledgesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(fundCampaignPledgesTable);
		});

		it("should define postsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.postsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(postsTable);
		});

		it("should define postsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.postsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(postsTable);
		});

		it("should define postAttachmentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.postAttachmentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(postAttachmentsTable);
		});

		it("should define postAttachmentsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.postAttachmentsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(postAttachmentsTable);
		});

		it("should define postVotesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.postVotesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(postVotesTable);
		});

		it("should define tagFoldersWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagFoldersWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagFoldersTable);
		});

		it("should define tagFoldersWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagFoldersWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagFoldersTable);
		});

		it("should define tagsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagsTable);
		});

		it("should define tagsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagsTable);
		});

		it("should define tagAssignmentsWhereAssignee as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagAssignmentsWhereAssignee as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagAssignmentsTable);
		});

		it("should define tagAssignmentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.tagAssignmentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(tagAssignmentsTable);
		});

		it("should define venuesWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.venuesWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(venuesTable);
		});

		it("should define venuesWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.venuesWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(venuesTable);
		});

		it("should define venueAttachmentsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.venueAttachmentsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(venueAttachmentsTable);
		});

		it("should define venueAttachmentsWhereUpdater as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.venueAttachmentsWhereUpdater as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(venueAttachmentsTable);
		});

		it("should define venueBookingsWhereCreator as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = usersTableRelations.config({ one, many });

			const relation =
				relationsResult.venueBookingsWhereCreator as unknown as RelationCall;
			expect(relation.type).toBe("many");
			expect(relation.table).toBe(venueBookingsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required emailAddress field", () => {
			const invalidData = { name: "Test User", passwordHash: "hash" };
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("emailAddress"),
					),
				).toBe(true);
			}
		});

		it("should reject invalid email format", () => {
			const invalidData = {
				emailAddress: "invalid-email",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("emailAddress"),
					),
				).toBe(true);
			}
		});

		it("should accept valid email format", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should validate required name field", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject name exceeding maximum length (256 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "a".repeat(257),
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should accept name with exactly minimum length (1 character)", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "a",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept name with exactly maximum length (256 characters)", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "a".repeat(256),
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject addressLine1 with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				addressLine1: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine1"),
					),
				).toBe(true);
			}
		});

		it("should reject addressLine1 exceeding maximum length (1024 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				addressLine1: "a".repeat(1025),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
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
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				addressLine1: "123 Main Street",
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject addressLine2 with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				addressLine2: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine2"),
					),
				).toBe(true);
			}
		});

		it("should reject addressLine2 exceeding maximum length (1024 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				addressLine2: "a".repeat(1025),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("addressLine2"),
					),
				).toBe(true);
			}
		});

		it("should reject avatarName with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				avatarName: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
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
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				avatarName: faker.string.alphanumeric(10),
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject city with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				city: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("city")),
				).toBe(true);
			}
		});

		it("should reject city exceeding maximum length (64 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				city: "a".repeat(65),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("city")),
				).toBe(true);
			}
		});

		it("should accept valid city within length constraints", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				city: "New York",
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject description with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				description: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("description"),
					),
				).toBe(true);
			}
		});

		it("should reject description exceeding maximum length (2048 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				description: "a".repeat(2049),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
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
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				description: faker.lorem.paragraph(),
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject postalCode with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				postalCode: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("postalCode"),
					),
				).toBe(true);
			}
		});

		it("should reject postalCode exceeding maximum length (32 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				postalCode: "a".repeat(33),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
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
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				postalCode: "12345",
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject state with length less than minimum when provided", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				state: "",
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("state")),
				).toBe(true);
			}
		});

		it("should reject state exceeding maximum length (64 characters)", () => {
			const invalidData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				state: "a".repeat(65),
			};
			const result = usersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("state")),
				).toBe(true);
			}
		});

		it("should accept valid state within length constraints", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
				state: "California",
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept all optional fields as undefined", () => {
			const validData = {
				emailAddress: "test@example.com",
				name: "Test User",
				passwordHash: "hash",
				role: "regular",
				isEmailAddressVerified: true,
			};
			const result = usersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");
			const name = faker.person.fullName();

			const [result] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "regular",
					name: name,
					isEmailAddressVerified: true,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert user record");
			}
			expect(result.id).toBeDefined();
			expect(result.emailAddress).toBe(testEmail);
			expect(result.name).toBe(name);
			expect(result.role).toBe("regular");
			expect(result.isEmailAddressVerified).toBe(true);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
			expect(result.failedLoginAttempts).toBe(0);
		});

		it("should successfully insert a record with all optional fields", async () => {
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");
			const name = faker.person.fullName();
			const addressLine1 = faker.location.streetAddress();
			const addressLine2 = faker.location.secondaryAddress();
			const avatarName = faker.string.alphanumeric(10);
			const avatarMimeType = "image/png" as const;
			// Create a date without time component (database stores only date)
			const birthDate = new Date("1990-05-15");
			const city = faker.location.city();
			const countryCode = "us" as const;
			const description = faker.lorem.paragraph();
			const educationGrade = "graduate" as const;
			const employmentStatus = "full_time" as const;
			const homePhoneNumber = faker.phone.number();
			const maritalStatus = "single" as const;
			const mobilePhoneNumber = faker.phone.number();
			const natalSex = "male" as const;
			const naturalLanguageCode = "en" as const;
			const postalCode = faker.location.zipCode();
			const state = faker.location.state();
			const workPhoneNumber = faker.phone.number();

			const [result] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "administrator",
					name: name,
					isEmailAddressVerified: false,
					addressLine1,
					addressLine2,
					avatarName,
					avatarMimeType,
					birthDate,
					city,
					countryCode,
					description,
					educationGrade,
					employmentStatus,
					homePhoneNumber,
					maritalStatus,
					mobilePhoneNumber,
					natalSex,
					naturalLanguageCode,
					postalCode,
					state,
					workPhoneNumber,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert user record");
			}
			expect(result.emailAddress).toBe(testEmail);
			expect(result.name).toBe(name);
			expect(result.role).toBe("administrator");
			expect(result.isEmailAddressVerified).toBe(false);
			expect(result.addressLine1).toBe(addressLine1);
			expect(result.addressLine2).toBe(addressLine2);
			expect(result.avatarName).toBe(avatarName);
			expect(result.avatarMimeType).toBe(avatarMimeType);
			// Compare dates by converting to ISO date strings (ignoring time)
			expect(result.birthDate?.toISOString().split("T")[0]).toBe(
				birthDate.toISOString().split("T")[0],
			);
			expect(result.city).toBe(city);
			expect(result.countryCode).toBe(countryCode);
			expect(result.description).toBe(description);
			expect(result.educationGrade).toBe(educationGrade);
			expect(result.employmentStatus).toBe(employmentStatus);
			expect(result.homePhoneNumber).toBe(homePhoneNumber);
			expect(result.maritalStatus).toBe(maritalStatus);
			expect(result.mobilePhoneNumber).toBe(mobilePhoneNumber);
			expect(result.natalSex).toBe(natalSex);
			expect(result.naturalLanguageCode).toBe(naturalLanguageCode);
			expect(result.postalCode).toBe(postalCode);
			expect(result.state).toBe(state);
			expect(result.workPhoneNumber).toBe(workPhoneNumber);
		});

		it("should reject duplicate email addresses", async () => {
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");

			await server.drizzleClient.insert(usersTable).values({
				emailAddress: testEmail,
				passwordHash: hashedPassword,
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			});

			await expect(
				server.drizzleClient.insert(usersTable).values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "regular",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
				}),
			).rejects.toThrow();
		});

		it("should successfully query records", async () => {
			const user = await createTestUser();

			const results = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, user.id));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBe(1);
			expect(results[0]?.id).toBe(user.id);
		});

		it("should successfully update a record", async () => {
			const user = await createTestUser();
			const newName = faker.person.fullName();
			const newDescription = faker.lorem.paragraph();

			const [updated] = await server.drizzleClient
				.update(usersTable)
				.set({
					name: newName,
					description: newDescription,
				})
				.where(eq(usersTable.id, user.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(newName);
			expect(updated?.description).toBe(newDescription);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const user = await createTestUser();

			const [deleted] = await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.id))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(user.id);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, user.id))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const creator = await createTestUser();
			const user = await createTestUser({ creatorId: creator.id });

			expect(user.creatorId).toBe(creator.id);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, creator.id));

			const [updated] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, user.id))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const updater = await createTestUser();
			const user = await createTestUser({ updaterId: updater.id });

			expect(user.updaterId).toBe(updater.id);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, updater.id));

			const [updated] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, user.id))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});

		it("should update failedLoginAttempts field", async () => {
			const user = await createTestUser();

			const [updated] = await server.drizzleClient
				.update(usersTable)
				.set({
					failedLoginAttempts: 3,
					lastFailedLoginAt: new Date(),
				})
				.where(eq(usersTable.id, user.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.failedLoginAttempts).toBe(3);
			expect(updated?.lastFailedLoginAt).toBeInstanceOf(Date);
		});

		it("should update lockedUntil field", async () => {
			const user = await createTestUser();
			const lockDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

			const [updated] = await server.drizzleClient
				.update(usersTable)
				.set({
					lockedUntil: lockDate,
				})
				.where(eq(usersTable.id, user.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.lockedUntil).toBeInstanceOf(Date);
		});
	});

	describe("Index Configuration", () => {
		it("should have indexed columns present (creatorId, name, updaterId)", () => {
			const tableDefinition = usersTable;
			expect(tableDefinition).toBeDefined();

			expect(tableDefinition.creatorId).toBeDefined();
			expect(tableDefinition.name).toBeDefined();
			expect(tableDefinition.updaterId).toBeDefined();
		});

		it("should efficiently query using indexed creatorId column", async () => {
			const creator = await createTestUser();
			await createTestUser({ creatorId: creator.id });

			const results = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.creatorId, creator.id));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed name column", async () => {
			const user = await createTestUser();

			const results = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.name, user.name));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed updaterId column", async () => {
			const updater = await createTestUser();
			await createTestUser({ updaterId: updater.id });

			const results = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.updaterId, updater.id));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should accept valid enum values for role", () => {
			const validRoles: Array<"administrator" | "regular"> = [
				"administrator",
				"regular",
			];

			for (const role of validRoles) {
				const result = userRoleEnum.safeParse(role);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for role", () => {
			const invalidRoles = ["superadmin", "guest", "moderator", ""];

			for (const role of invalidRoles) {
				const result = userRoleEnum.safeParse(role);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for avatarMimeType", () => {
			const validMimeTypes: Array<
				"image/avif" | "image/jpeg" | "image/png" | "image/webp"
			> = ["image/avif", "image/jpeg", "image/png", "image/webp"];

			for (const mimeType of validMimeTypes) {
				const result = imageMimeTypeEnum.safeParse(mimeType);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for avatarMimeType", () => {
			const invalidMimeTypes = [
				"image/gif",
				"image/svg+xml",
				"application/pdf",
				"",
			];

			for (const mimeType of invalidMimeTypes) {
				const result = imageMimeTypeEnum.safeParse(mimeType);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for countryCode", () => {
			const validCountryCodes = ["us", "gb", "ca", "au", "de"];

			for (const code of validCountryCodes) {
				const result = iso3166Alpha2CountryCodeEnum.safeParse(code);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for countryCode", () => {
			const invalidCountryCodes = ["xx", "usa", "UK", ""];

			for (const code of invalidCountryCodes) {
				const result = iso3166Alpha2CountryCodeEnum.safeParse(code);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for educationGrade", () => {
			const validGrades = [
				"grade_1",
				"grade_12",
				"graduate",
				"kg",
				"no_grade",
				"pre_kg",
			];

			for (const grade of validGrades) {
				const result = userEducationGradeEnum.safeParse(grade);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for educationGrade", () => {
			const invalidGrades = ["grade_13", "phd", "bachelor", ""];

			for (const grade of invalidGrades) {
				const result = userEducationGradeEnum.safeParse(grade);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for employmentStatus", () => {
			const validStatuses: Array<"full_time" | "part_time" | "unemployed"> = [
				"full_time",
				"part_time",
				"unemployed",
			];

			for (const status of validStatuses) {
				const result = userEmploymentStatusEnum.safeParse(status);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for employmentStatus", () => {
			const invalidStatuses = ["contractor", "freelance", "retired", ""];

			for (const status of invalidStatuses) {
				const result = userEmploymentStatusEnum.safeParse(status);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for maritalStatus", () => {
			const validStatuses = [
				"divorced",
				"engaged",
				"married",
				"seperated",
				"single",
				"widowed",
			];

			for (const status of validStatuses) {
				const result = userMaritalStatusEnum.safeParse(status);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for maritalStatus", () => {
			const invalidStatuses = ["dating", "complicated", "partnered", ""];

			for (const status of invalidStatuses) {
				const result = userMaritalStatusEnum.safeParse(status);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for natalSex", () => {
			const validSexes: Array<"female" | "intersex" | "male"> = [
				"female",
				"intersex",
				"male",
			];

			for (const sex of validSexes) {
				const result = userNatalSexEnum.safeParse(sex);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for natalSex", () => {
			const invalidSexes = ["other", "unknown", ""];

			for (const sex of invalidSexes) {
				const result = userNatalSexEnum.safeParse(sex);
				expect(result.success).toBe(false);
			}
		});

		it("should accept valid enum values for naturalLanguageCode", () => {
			const validCodes = ["en", "es", "fr", "de", "zh"];

			for (const code of validCodes) {
				const result = iso639Set1LanguageCodeEnum.safeParse(code);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for naturalLanguageCode", () => {
			const invalidCodes = ["eng", "english", "xx", ""];

			for (const code of invalidCodes) {
				const result = iso639Set1LanguageCodeEnum.safeParse(code);
				expect(result.success).toBe(false);
			}
		});

		it("should validate enum values in database insert", async () => {
			const testEmail = `test.user.${faker.string.ulid()}@email.com`;
			const hashedPassword = await hash("password");

			const [result] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					passwordHash: hashedPassword,
					role: "administrator",
					name: faker.person.fullName(),
					isEmailAddressVerified: true,
					avatarMimeType: "image/png",
					countryCode: "us",
					educationGrade: "graduate",
					employmentStatus: "full_time",
					maritalStatus: "single",
					natalSex: "male",
					naturalLanguageCode: "en",
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.role).toBe("administrator");
				expect(result.avatarMimeType).toBe("image/png");
				expect(result.countryCode).toBe("us");
				expect(result.educationGrade).toBe("graduate");
				expect(result.employmentStatus).toBe("full_time");
				expect(result.maritalStatus).toBe("single");
				expect(result.natalSex).toBe("male");
				expect(result.naturalLanguageCode).toBe("en");
			}
		});

		it("should handle null values for optional enum fields", async () => {
			const user = await createTestUser();

			const [result] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, user.id))
				.limit(1);

			expect(result).toBeDefined();
			if (result) {
				expect(result.avatarMimeType).toBeNull();
				expect(result.countryCode).toBeNull();
				expect(result.educationGrade).toBeNull();
				expect(result.employmentStatus).toBeNull();
				expect(result.maritalStatus).toBeNull();
				expect(result.natalSex).toBeNull();
				expect(result.naturalLanguageCode).toBeNull();
			}
		});
	});
});
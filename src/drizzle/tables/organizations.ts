import { type InferSelectModel, relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementsTable } from "./advertisements";
import { familiesTable } from "./families";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { postsTable } from "./posts";
import { tagFoldersTable } from "./tagFolders";
import { tagsTable } from "./tags";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

export const organizationsTable = pgTable(
	"organizations",
	{
		addressLine1: text("address_line_1"),

		addressLine2: text("address_line_2"),

		avatarURI: text("avatar_uri"),

		city: text("city"),

		countryCode: text("country_code", {
			enum: iso3166Alpha2CountryCodeEnum.options,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		description: text("description"),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		isPrivate: boolean("is_private").notNull().default(false),

		isVisible: boolean("is_visible").notNull().default(true),

		name: text("name", {}).notNull().unique(),

		postalCode: text("postal_code"),

		state: text("state"),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.name),
	}),
);

export type OrganizationPgType = InferSelectModel<typeof organizationsTable>;

export const organizationsTableRelations = relations(
	organizationsTable,
	({ one, many }) => ({
		actionsWhereOrganization: many(actionsTable, {
			relationName: "actions.organization_id:organizations.id",
		}),
		actionCategoriesWhereOrganization: many(actionCategoriesTable, {
			relationName: "action_categories.organization_id:organizations.id",
		}),

		advertisementsWhereOrganization: many(advertisementsTable, {
			relationName: "advertisements.organization_id:organizations.id",
		}),

		creator: one(usersTable, {
			fields: [organizationsTable.creatorId],
			references: [usersTable.id],
			relationName: "organizations.creator_id:users.id",
		}),

		familiesWhereOrganization: many(familiesTable, {
			relationName: "families.organization_id:organizations.id",
		}),

		fundsWhereOrganization: many(fundsTable, {
			relationName: "funds.organization_id:organizations.id",
		}),

		organizationMembershipsWhereOrganization: many(
			organizationMembershipsTable,
			{
				relationName:
					"organization_memberships.organization_id:organizations.id",
			},
		),

		postsWhereOrganization: many(postsTable, {
			relationName: "organizations.id:posts.organization_id",
		}),

		tagFoldersWhereOrganization: many(tagFoldersTable, {
			relationName: "organizations.id:tag_folders.organization_id",
		}),

		tagsWhereOrganization: many(tagsTable, {
			relationName: "organizations.id:tags.organization_id",
		}),

		updater: one(usersTable, {
			fields: [organizationsTable.updaterId],
			references: [usersTable.id],
			relationName: "organizations.updater_id:users.id",
		}),

		venuesWhereOrganization: many(venuesTable, {
			relationName: "organizations.id:venues.organization_id",
		}),
	}),
);

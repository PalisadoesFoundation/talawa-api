import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for a community.
 */
export const communitiesTable = pgTable("communities", {
	/**
	 * Date time at the time the community was created.
	 */
	createdAt: timestamp("created_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
	/**
	 * URL to the facebook account of the community.
	 */
	facebookURL: text("facebook_url"),
	/**
	 * URL to the github account of the community.
	 */
	githubURL: text("github_url"),
	/**
	 * Primary unique identifier of the community.
	 */
	id: uuid("id").primaryKey().$default(uuidv7),
	/**
	 * Duration in seconds it should take for inactive clients to get timed out of their authenticated session within client-side talawa applications.
	 */
	inactivityTimeoutDuration: integer("inactivity_timeout_duration"),
	/**
	 * URL to the instagram account of the community.
	 */
	instagramURL: text("instagram_url"),
	/**
	 * URL to the linkedin account of the community.
	 */
	linkedinURL: text("linkedin_url"),
	/**
	 * Mime type of the logo of the community.
	 */
	logoMimeType: text("logo_mime_type", {
		enum: imageMimeTypeEnum.options,
	}),
	/**
	 * Primary unique identifier of the community's logo.
	 */
	logoName: text("logo_name"),
	/**
	 * Name of the community.
	 */
	name: text("name", {}).notNull().unique(),
	/**
	 * URL to the reddit account of the community.
	 */
	redditURL: text("reddit_url"),
	/**
	 * URL to the slack account of the community.
	 */
	slackURL: text("slack_url"),
	/**
	 * Date time at the time the community was last updated.
	 */
	updatedAt: timestamp("updated_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.$defaultFn(() => sql`${null}`)
		.$onUpdate(() => new Date()),
	/**
	 * Foreign key reference to the id of the user who last updated the community.
	 */
	updaterId: uuid("updater_id").references(() => usersTable.id, {
		onDelete: "set null",
		onUpdate: "cascade",
	}),
	/**
	 * URL to the website of the community.
	 */
	websiteURL: text("website_url"),
	/**
	 * URL to the x account of the community.
	 */
	xURL: text("x_url"),
	/**
	 * URL to the youtube account of the community.
	 */
	youtubeURL: text("youtube_url"),
});

export const communitiesTableRelations = relations(
	communitiesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `communities` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [communitiesTable.updaterId],
			references: [usersTable.id],
			relationName: "community.updater_id:users.id",
		}),
	}),
);

export const communitiesTableInsertSchema = createInsertSchema(
	communitiesTable,
	{
		facebookURL: (schema) => schema.url().optional(),
		githubURL: (schema) => schema.url().optional(),
		inactivityTimeoutDuration: (schema) => schema.min(1).optional(),
		instagramURL: (schema) => schema.url().optional(),
		linkedinURL: (schema) => schema.url().optional(),
		logoName: (schema) => schema.min(1).optional(),
		name: (schema) => schema.min(1).max(256),
		redditURL: (schema) => schema.url().optional(),
		slackURL: (schema) => schema.url().optional(),
		websiteURL: (schema) => schema.url().optional(),
		xURL: (schema) => schema.url().optional(),
		youtubeURL: (schema) => schema.url().optional(),
	},
);

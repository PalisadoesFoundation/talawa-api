import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
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
			enum: imageMimeTypeEnum.options as [string, ...string[]],
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
		facebookURL: () => z.string().url().optional(),
		githubURL: () => z.string().url().optional(),
		inactivityTimeoutDuration: (schema) => schema.min(1).optional(),
		instagramURL: () => z.string().url().optional(),
		linkedinURL: () => z.string().url().optional(),
		logoName: (schema) => schema.min(1).optional(),
		name: (schema) => schema.min(1).max(256),
		redditURL: () => z.string().url().optional(),
		slackURL: () => z.string().url().optional(),
		websiteURL: () => z.string().url().optional(),
		xURL: () => z.string().url().optional(),
		youtubeURL: () => z.string().url().optional(),
	},
);

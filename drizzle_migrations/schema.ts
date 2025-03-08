import {
	boolean,
	date,
	foreignKey,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
	"organizations",
	{
		addressLine1: text("address_line_1"),
		addressLine2: text("address_line_2"),
		avatarMimeType: text("avatar_mime_type"),
		avatarName: text("avatar_name"),
		city: text(),
		countryCode: text("country_code"),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		postalCode: text("postal_code"),
		state: text(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
		userRegistrationRequired: boolean("user_registration_required").default(
			false,
		),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using("btree", table.updaterId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "organizations_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "organizations_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		unique("organizations_name_unique").on(table.name),
	],
);

export const users = pgTable(
	"users",
	{
		addressLine1: text("address_line_1"),
		addressLine2: text("address_line_2"),
		avatarMimeType: text("avatar_mime_type"),
		avatarName: text("avatar_name"),
		birthDate: date("birth_date"),
		city: text(),
		countryCode: text("country_code"),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		educationGrade: text("education_grade"),
		emailAddress: text("email_address").notNull(),
		employmentStatus: text("employment_status"),
		homePhoneNumber: text("home_phone_number"),
		id: uuid().primaryKey().notNull(),
		isEmailAddressVerified: boolean("is_email_address_verified").notNull(),
		maritalStatus: text("marital_status"),
		mobilePhoneNumber: text("mobile_phone_number"),
		name: text().notNull(),
		natalSex: text("natal_sex"),
		naturalLanguageCode: text("natural_language_code"),
		passwordHash: text("password_hash").notNull(),
		postalCode: text("postal_code"),
		role: text().notNull(),
		state: text(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
		workPhoneNumber: text("work_phone_number"),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using("btree", table.updaterId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [table.id],
			name: "users_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [table.id],
			name: "users_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		unique("users_email_address_unique").on(table.emailAddress),
	],
);

export const actionCategories = pgTable(
	"action_categories",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		id: uuid().primaryKey().notNull(),
		isDisabled: boolean("is_disabled").notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "action_categories_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "action_categories_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "action_categories_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const actions = pgTable(
	"actions",
	{
		assignedAt: timestamp("assigned_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		actorId: uuid("actor_id"),
		categoryId: uuid("category_id"),
		completionAt: timestamp("completion_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id"),
		id: uuid().primaryKey().notNull(),
		isCompleted: boolean("is_completed").notNull(),
		organizationId: uuid("organization_id").notNull(),
		postCompletionNotes: text("post_completion_notes"),
		preCompletionNotes: text("pre_completion_notes"),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.actorId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.assignedAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.completionAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "actions_actor_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.categoryId],
			foreignColumns: [actionCategories.id],
			name: "actions_category_id_action_categories_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "actions_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "actions_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "actions_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "actions_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const events = pgTable(
	"events",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		endAt: timestamp("end_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		startAt: timestamp("start_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.endAt.asc().nullsLast().op("timestamptz_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.startAt.asc().nullsLast().op("timestamptz_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "events_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "events_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "events_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const advertisements = pgTable(
	"advertisements",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		endAt: timestamp("end_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		startAt: timestamp("start_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
		type: text().notNull(),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.endAt.asc().nullsLast().op("timestamptz_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.startAt.asc().nullsLast().op("timestamptz_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "advertisements_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "advertisements_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "advertisements_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const advertisementAttachments = pgTable(
	"advertisement_attachments",
	{
		advertisementId: uuid("advertisement_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		mimeType: text("mime_type").notNull(),
		name: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.advertisementId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.advertisementId],
			foreignColumns: [advertisements.id],
			name: "advertisement_attachments_advertisement_id_advertisements_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "advertisement_attachments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "advertisement_attachments_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const agendaFolders = pgTable(
	"agenda_folders",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id").notNull(),
		id: uuid().primaryKey().notNull(),
		isAgendaItemFolder: boolean("is_agenda_item_folder").notNull(),
		name: text().notNull(),
		parentFolderId: uuid("parent_folder_id"),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.isAgendaItemFolder.asc().nullsLast().op("bool_ops"),
		),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using(
			"btree",
			table.parentFolderId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "agenda_folders_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "agenda_folders_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.parentFolderId],
			foreignColumns: [table.id],
			name: "agenda_folders_parent_folder_id_agenda_folders_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "agenda_folders_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const agendaItems = pgTable(
	"agenda_items",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		duration: text(),
		folderId: uuid("folder_id").notNull(),
		id: uuid().primaryKey().notNull(),
		key: text(),
		name: text().notNull(),
		type: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.folderId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using("btree", table.type.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "agenda_items_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.folderId],
			foreignColumns: [agendaFolders.id],
			name: "agenda_items_folder_id_agenda_folders_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "agenda_items_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const chats = pgTable(
	"chats",
	{
		avatarMimeType: text("avatar_mime_type"),
		avatarName: text("avatar_name"),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using("btree", table.updaterId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "chats_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "chats_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "chats_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		unique("chats_name_unique").on(table.name),
	],
);

export const chatMessages = pgTable(
	"chat_messages",
	{
		body: text().notNull(),
		chatId: uuid("chat_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		parentMessageId: uuid("parent_message_id"),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index().using("btree", table.chatId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.parentMessageId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "chat_messages_chat_id_chats_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "chat_messages_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.parentMessageId],
			foreignColumns: [table.id],
			name: "chat_messages_parent_message_id_chat_messages_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const comments = pgTable(
	"comments",
	{
		body: text().notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		postId: uuid("post_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "comments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const commentVotes = pgTable(
	"comment_votes",
	{
		commentId: uuid("comment_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		type: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		uniqueIndex().using(
			"btree",
			table.commentId.asc().nullsLast().op("uuid_ops"),
			table.creatorId.asc().nullsLast().op("uuid_ops"),
		),
		index().using("btree", table.commentId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.type.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_votes_comment_id_comments_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "comment_votes_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const posts = pgTable(
	"posts",
	{
		caption: text().notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id").notNull(),
		id: uuid().primaryKey().notNull(),
		organizationId: uuid("organization_id").notNull(),
		pinnedAt: timestamp("pinned_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.pinnedAt.asc().nullsLast().op("timestamptz_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "posts_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "posts_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "posts_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const communities = pgTable(
	"communities",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		facebookUrl: text("facebook_url"),
		githubUrl: text("github_url"),
		id: uuid().primaryKey().notNull(),
		inactivityTimeoutDuration: integer("inactivity_timeout_duration"),
		instagramUrl: text("instagram_url"),
		linkedinUrl: text("linkedin_url"),
		logoMimeType: text("logo_mime_type"),
		logoName: text("logo_name"),
		name: text().notNull(),
		redditUrl: text("reddit_url"),
		slackUrl: text("slack_url"),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
		websiteUrl: text("website_url"),
		xUrl: text("x_url"),
		youtubeUrl: text("youtube_url"),
	},
	(table) => [
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "communities_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		unique("communities_name_unique").on(table.name),
	],
);

export const eventAttachments = pgTable(
	"event_attachments",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id").notNull(),
		mimeType: text("mime_type").notNull(),
		name: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "event_attachments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_attachments_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "event_attachments_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const eventAttendances = pgTable(
	"event_attendances",
	{
		attendeeId: uuid("attendee_id").notNull(),
		checkInAt: timestamp("check_in_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		checkOutAt: timestamp("check_out_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.attendeeId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.checkInAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using(
			"btree",
			table.checkOutAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.attendeeId],
			foreignColumns: [users.id],
			name: "event_attendances_attendee_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "event_attendances_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_attendances_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "event_attendances_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const families = pgTable(
	"families",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "families_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "families_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "families_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const fundCampaigns = pgTable(
	"fund_campaigns",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		currencyCode: text("currency_code").notNull(),
		endAt: timestamp("end_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		fundId: uuid("fund_id").notNull(),
		goalAmount: integer("goal_amount").notNull(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		startAt: timestamp("start_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}).notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.endAt.asc().nullsLast().op("timestamptz_ops")),
		index().using("btree", table.fundId.asc().nullsLast().op("uuid_ops")),
		uniqueIndex().using(
			"btree",
			table.fundId.asc().nullsLast().op("text_ops"),
			table.name.asc().nullsLast().op("text_ops"),
		),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using(
			"btree",
			table.startAt.asc().nullsLast().op("timestamptz_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "fund_campaigns_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.fundId],
			foreignColumns: [funds.id],
			name: "fund_campaigns_fund_id_funds_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "fund_campaigns_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const fundCampaignPledges = pgTable(
	"fund_campaign_pledges",
	{
		amount: integer().notNull(),
		campaignId: uuid("campaign_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		note: text(),
		pledgerId: uuid("pledger_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
		uniqueIndex().using(
			"btree",
			table.campaignId.asc().nullsLast().op("uuid_ops"),
			table.pledgerId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.pledgerId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.campaignId],
			foreignColumns: [fundCampaigns.id],
			name: "fund_campaign_pledges_campaign_id_fund_campaigns_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "fund_campaign_pledges_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.pledgerId],
			foreignColumns: [users.id],
			name: "fund_campaign_pledges_pledger_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "fund_campaign_pledges_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const funds = pgTable(
	"funds",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		isTaxDeductible: boolean("is_tax_deductible").notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "funds_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "funds_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "funds_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const postAttachments = pgTable(
	"post_attachments",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		postId: uuid("post_id").notNull(),
		mimeType: text("mime_type").notNull(),
		name: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "post_attachments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_attachments_post_id_posts_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "post_attachments_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const postVotes = pgTable(
	"post_votes",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		postId: uuid("post_id").notNull(),
		type: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		uniqueIndex().using(
			"btree",
			table.creatorId.asc().nullsLast().op("uuid_ops"),
			table.postId.asc().nullsLast().op("uuid_ops"),
		),
		index().using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.type.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "post_votes_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_votes_post_id_posts_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const tags = pgTable(
	"tags",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		folderId: uuid("folder_id"),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "tags_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.folderId],
			foreignColumns: [tagFolders.id],
			name: "tags_folder_id_tag_folders_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "tags_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "tags_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const tagFolders = pgTable(
	"tag_folders",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		parentFolderId: uuid("parent_folder_id"),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using(
			"btree",
			table.parentFolderId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "tag_folders_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "tag_folders_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.parentFolderId],
			foreignColumns: [table.id],
			name: "tag_folders_parent_folder_id_tag_folders_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "tag_folders_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const venueAttachments = pgTable(
	"venue_attachments",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		mimeType: text("mime_type").notNull(),
		name: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
		venueId: uuid("venue_id").notNull(),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.venueId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "venue_attachments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "venue_attachments_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "venue_attachments_venue_id_venues_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const venues = pgTable(
	"venues",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		description: text(),
		id: uuid().primaryKey().notNull(),
		name: text().notNull(),
		organizationId: uuid("organization_id").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		uniqueIndex().using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
			table.organizationId.asc().nullsLast().op("text_ops"),
		),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "venues_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "venues_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "venues_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const volunteerGroups = pgTable(
	"volunteer_groups",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id").notNull(),
		id: uuid().primaryKey().notNull(),
		leaderId: uuid("leader_id"),
		maxVolunteerCount: integer("max_volunteer_count").notNull(),
		name: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
		uniqueIndex().using(
			"btree",
			table.eventId.asc().nullsLast().op("uuid_ops"),
			table.name.asc().nullsLast().op("text_ops"),
		),
		index().using("btree", table.leaderId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.name.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "volunteer_groups_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "volunteer_groups_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.leaderId],
			foreignColumns: [users.id],
			name: "volunteer_groups_leader_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "volunteer_groups_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
	],
);

export const tagAssignments = pgTable(
	"tag_assignments",
	{
		assigneeId: uuid("assignee_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		tagId: uuid("tag_id").notNull(),
	},
	(table) => [
		index().using("btree", table.assigneeId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "tag_assignments_assignee_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "tag_assignments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "tag_assignments_tag_id_tags_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({
			columns: [table.assigneeId, table.tagId],
			name: "tag_assignments_assignee_id_tag_id_pk",
		}),
	],
);

export const venueBookings = pgTable(
	"venue_bookings",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		eventId: uuid("event_id").notNull(),
		venueId: uuid("venue_id").notNull(),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.venueId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "venue_bookings_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "venue_bookings_event_id_events_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "venue_bookings_venue_id_venues_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({
			columns: [table.eventId, table.venueId],
			name: "venue_bookings_event_id_venue_id_pk",
		}),
	],
);

export const chatMemberships = pgTable(
	"chat_memberships",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		chatId: uuid("chat_id").notNull(),
		memberId: uuid("member_id").notNull(),
		role: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using("btree", table.chatId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.role.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "chat_memberships_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "chat_memberships_chat_id_chats_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberId],
			foreignColumns: [users.id],
			name: "chat_memberships_member_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "chat_memberships_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		primaryKey({
			columns: [table.chatId, table.memberId],
			name: "chat_memberships_chat_id_member_id_pk",
		}),
	],
);

export const familyMemberships = pgTable(
	"family_memberships",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		familyId: uuid("family_id").notNull(),
		memberId: uuid("member_id").notNull(),
		role: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.familyId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "family_memberships_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "family_memberships_family_id_families_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.memberId],
			foreignColumns: [users.id],
			name: "family_memberships_member_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "family_memberships_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		primaryKey({
			columns: [table.familyId, table.memberId],
			name: "family_memberships_family_id_member_id_pk",
		}),
	],
);

export const organizationMemberships = pgTable(
	"organization_memberships",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		memberId: uuid("member_id").notNull(),
		organizationId: uuid("organization_id").notNull(),
		role: text().notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using("btree", table.role.asc().nullsLast().op("text_ops")),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "organization_memberships_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.memberId],
			foreignColumns: [users.id],
			name: "organization_memberships_member_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_memberships_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "organization_memberships_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		primaryKey({
			columns: [table.memberId, table.organizationId],
			name: "organization_memberships_member_id_organization_id_pk",
		}),
	],
);

export const membershipRequests = pgTable(
	"membership_requests",
	{
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),

		membershipRequestId: uuid("membership_request_id")
			.defaultRandom()
			.notNull(),

		userId: uuid("user_id").notNull(),
		organizationId: uuid("organization_id").notNull(),

		status: text().notNull().default("pending"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		index().using(
			"btree",
			table.organizationId.asc().nullsLast().op("uuid_ops"),
		),
		index().using("btree", table.status.asc().nullsLast().op("text_ops")),

		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "membership_requests_user_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),

		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "membership_requests_organization_id_organizations_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),

		primaryKey({
			columns: [table.membershipRequestId],
			name: "membership_requests_membership_request_id_pk",
		}),
	],
);

export const volunteerGroupAssignments = pgTable(
	"volunteer_group_assignments",
	{
		assigneeId: uuid("assignee_id").notNull(),
		createdAt: timestamp("created_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		creatorId: uuid("creator_id"),
		groupId: uuid("group_id").notNull(),
		inviteStatus: text("invite_status").notNull(),
		updatedAt: timestamp("updated_at", {
			precision: 3,
			withTimezone: true,
			mode: "string",
		}),
		updaterId: uuid("updater_id"),
	},
	(table) => [
		index().using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamptz_ops"),
		),
		index().using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
		index().using("btree", table.groupId.asc().nullsLast().op("uuid_ops")),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "volunteer_group_assignments_assignee_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "volunteer_group_assignments_creator_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.groupId],
			foreignColumns: [volunteerGroups.id],
			name: "volunteer_group_assignments_group_id_volunteer_groups_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.updaterId],
			foreignColumns: [users.id],
			name: "volunteer_group_assignments_updater_id_users_id_fk",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		primaryKey({
			columns: [table.assigneeId, table.groupId],
			name: "volunteer_group_assignments_assignee_id_group_id_pk",
		}),
	],
);

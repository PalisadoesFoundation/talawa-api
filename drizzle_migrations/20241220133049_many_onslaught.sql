CREATE TABLE "action_categories" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_disabled" boolean NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"assigned_at" timestamp (3) with time zone NOT NULL,
	"actor_id" uuid,
	"category_id" uuid,
	"completion_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_completed" boolean NOT NULL,
	"organization_id" uuid NOT NULL,
	"post_completion_notes" text,
	"pre_completion_notes" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "advertisement_attachments" (
	"advertisement_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"uri" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertisements" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"end_at" timestamp (3) with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"start_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"duration" text,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text,
	"name" text,
	"position" integer NOT NULL,
	"section_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_sections" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_section_id" uuid,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "chat_memberships" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"chat_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "chat_memberships_chat_id_member_id_pk" PRIMARY KEY("chat_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"body" text NOT NULL,
	"chat_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_chat_message_id" uuid,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"avatar_uri" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "chats_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"comment_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updated_id" uuid
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"body" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "event_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"uri" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendances" (
	"attendee_id" uuid NOT NULL,
	"check_in_at" timestamp (3) with time zone,
	"check_out_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"invite_status" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "events" (
	"base_recurring_event_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"end_date" date,
	"end_time" time,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_all_day" boolean NOT NULL,
	"is_base_recurring_event" boolean NOT NULL,
	"is_private" boolean NOT NULL,
	"is_recurring" boolean NOT NULL,
	"is_recurring_exception" boolean NOT NULL,
	"is_registerable" boolean NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"start_time" time,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "families" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "family_memberships" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"family_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "family_memberships_family_id_member_id_pk" PRIMARY KEY("family_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "fund_campaign_pledges" (
	"amount" integer NOT NULL,
	"campaign_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"note" text,
	"pledger_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "fund_campaigns" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"currency_code" text NOT NULL,
	"end_at" timestamp (3) with time zone NOT NULL,
	"fund_id" uuid NOT NULL,
	"goal_amount" integer NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_tax_deductible" boolean NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"member_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "organization_memberships_member_id_organization_id_pk" PRIMARY KEY("member_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"address" text,
	"avatar_uri" text,
	"city" text,
	"country_code" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"postal_code" text,
	"state" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "post_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"post_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"uri" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updated_id" uuid
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"caption" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"pinned_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "recurrences" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"day_of_month" integer,
	"day_of_week" integer,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"max_count" integer,
	"month_of_year" integer,
	"rrule_string" text NOT NULL,
	"seperation_count" integer,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"week_of_month" integer
);
--> statement-breakpoint
CREATE TABLE "tag_assignments" (
	"assignee_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"tag_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "tag_assignments_assignee_id_tag_id_pk" PRIMARY KEY("assignee_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_folder" boolean NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_tag_id" uuid,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" text,
	"avatar_uri" text,
	"birth_date" date,
	"city" text,
	"country_code" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"education_grade" text,
	"email_address" text NOT NULL,
	"employment_status" text,
	"home_phone_number" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_email_address_verified" boolean NOT NULL,
	"marital_status" text,
	"mobile_phone_number" text,
	"name" text NOT NULL,
	"natal_sex" text,
	"password_hash" text NOT NULL,
	"postal_code" text,
	"role" text NOT NULL,
	"state" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"work_phone_number" text,
	CONSTRAINT "users_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
CREATE TABLE "venue_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"uri" text NOT NULL,
	"venue_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_bookings" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"venue_id" uuid NOT NULL,
	CONSTRAINT "venue_bookings_event_id_venue_id_pk" PRIMARY KEY("event_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"capacity" integer NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "volunteer_group_assignments" (
	"assignee_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"group_id" uuid NOT NULL,
	"invite_status" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "volunteer_group_assignments_assignee_id_group_id_pk" PRIMARY KEY("assignee_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_groups" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"leader_id" uuid,
	"max_volunteer_count" integer NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_category_id_action_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."action_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_advertisement_id_advertisements_id_fk" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_section_id_agenda_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."agenda_sections"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_parent_section_id_agenda_sections_id_fk" FOREIGN KEY ("parent_section_id") REFERENCES "public"."agenda_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parent_chat_message_id_chat_messages_id_fk" FOREIGN KEY ("parent_chat_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_updated_id_users_id_fk" FOREIGN KEY ("updated_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_attendee_id_users_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_base_recurring_event_id_events_id_fk" FOREIGN KEY ("base_recurring_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaign_pledges" ADD CONSTRAINT "fund_campaign_pledges_campaign_id_fund_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."fund_campaigns"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaign_pledges" ADD CONSTRAINT "fund_campaign_pledges_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaign_pledges" ADD CONSTRAINT "fund_campaign_pledges_pledger_id_users_id_fk" FOREIGN KEY ("pledger_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaign_pledges" ADD CONSTRAINT "fund_campaign_pledges_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaigns" ADD CONSTRAINT "fund_campaigns_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaigns" ADD CONSTRAINT "fund_campaigns_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fund_campaigns" ADD CONSTRAINT "fund_campaigns_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "funds" ADD CONSTRAINT "funds_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "funds" ADD CONSTRAINT "funds_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "funds" ADD CONSTRAINT "funds_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_updated_id_users_id_fk" FOREIGN KEY ("updated_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_tag_id_tags_id_fk" FOREIGN KEY ("parent_tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_group_id_volunteer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."volunteer_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "action_categories_created_at_index" ON "action_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "action_categories_creator_id_index" ON "action_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "action_categories_name_index" ON "action_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "action_categories_name_organization_id_index" ON "action_categories" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "actions_assigned_at_index" ON "actions" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "actions_actor_id_index" ON "actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "actions_category_id_index" ON "actions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "actions_completion_at_index" ON "actions" USING btree ("completion_at");--> statement-breakpoint
CREATE INDEX "actions_created_at_index" ON "actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "actions_creator_id_index" ON "actions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "actions_organization_id_index" ON "actions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_advertisement_id_index" ON "advertisement_attachments" USING btree ("advertisement_id");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_created_at_index" ON "advertisement_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_creator_id_index" ON "advertisement_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "advertisements_creator_id_index" ON "advertisements" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "advertisements_end_at_index" ON "advertisements" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "advertisements_name_index" ON "advertisements" USING btree ("name");--> statement-breakpoint
CREATE INDEX "advertisements_organization_id_index" ON "advertisements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "advertisements_start_at_index" ON "advertisements" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "advertisements_name_organization_id_index" ON "advertisements" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "agenda_items_created_at_index" ON "agenda_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_items_creator_id_index" ON "agenda_items" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_items_name_index" ON "agenda_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_items_position_index" ON "agenda_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX "agenda_items_section_id_index" ON "agenda_items" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "agenda_items_type_index" ON "agenda_items" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_items_event_id_position_index" ON "agenda_items" USING btree ("event_id","position") WHERE "agenda_items"."section_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_items_position_section_id_index" ON "agenda_items" USING btree ("position","section_id") WHERE "agenda_items"."section_id" is not null;--> statement-breakpoint
CREATE INDEX "agenda_sections_created_at_index" ON "agenda_sections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_sections_creator_id_index" ON "agenda_sections" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_sections_event_id_index" ON "agenda_sections" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "agenda_sections_name_index" ON "agenda_sections" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_sections_parent_section_id_index" ON "agenda_sections" USING btree ("parent_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_sections_event_id_name_index" ON "agenda_sections" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "chat_memberships_chat_id_index" ON "chat_memberships" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_created_at_index" ON "chat_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_memberships_creator_id_index" ON "chat_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_member_id_index" ON "chat_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_role_index" ON "chat_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_index" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_index" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_creator_id_index" ON "chat_messages" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chat_messages_parent_chat_message_id_index" ON "chat_messages" USING btree ("parent_chat_message_id");--> statement-breakpoint
CREATE INDEX "chats_creator_id_index" ON "chats" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chats_name_index" ON "chats" USING btree ("name");--> statement-breakpoint
CREATE INDEX "chats_organization_id_index" ON "chats" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "chats_updater_id_index" ON "chats" USING btree ("updater_id");--> statement-breakpoint
CREATE INDEX "comment_votes_comment_id_index" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_votes_creator_id_index" ON "comment_votes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "comment_votes_type_index" ON "comment_votes" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_votes_comment_id_creator_id_index" ON "comment_votes" USING btree ("comment_id","creator_id");--> statement-breakpoint
CREATE INDEX "comments_created_at_index" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "comments_creator_id_index" ON "comments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "comments_post_id_index" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "event_attachments_event_id_index" ON "event_attachments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attachments_created_at_index" ON "event_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_attachments_creator_id_index" ON "event_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "event_attendances_attendee_id_index" ON "event_attendances" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "event_attendances_check_in_at_index" ON "event_attendances" USING btree ("check_in_at");--> statement-breakpoint
CREATE INDEX "event_attendances_check_out_at_index" ON "event_attendances" USING btree ("check_out_at");--> statement-breakpoint
CREATE INDEX "event_attendances_created_at_index" ON "event_attendances" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_attendances_creator_id_index" ON "event_attendances" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "event_attendances_event_id_index" ON "event_attendances" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attendances_invite_status_index" ON "event_attendances" USING btree ("invite_status");--> statement-breakpoint
CREATE INDEX "events_created_at_index" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_creator_id_index" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "events_name_index" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "events_organization_id_index" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "families_created_at_index" ON "families" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "families_creator_id_index" ON "families" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "families_name_index" ON "families" USING btree ("name");--> statement-breakpoint
CREATE INDEX "families_organization_id_index" ON "families" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "families_name_organization_id_index" ON "families" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "family_memberships_created_at_index" ON "family_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "family_memberships_creator_id_index" ON "family_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "family_memberships_family_id_index" ON "family_memberships" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_memberships_member_id_index" ON "family_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "fund_campaign_pledges_campaign_id_index" ON "fund_campaign_pledges" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "fund_campaign_pledges_created_at_index" ON "fund_campaign_pledges" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fund_campaign_pledges_creator_id_index" ON "fund_campaign_pledges" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "fund_campaign_pledges_pledger_id_index" ON "fund_campaign_pledges" USING btree ("pledger_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fund_campaign_pledges_campaign_id_pledger_id_index" ON "fund_campaign_pledges" USING btree ("campaign_id","pledger_id");--> statement-breakpoint
CREATE INDEX "fund_campaigns_created_at_index" ON "fund_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fund_campaigns_creator_id_index" ON "fund_campaigns" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "fund_campaigns_end_at_index" ON "fund_campaigns" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "fund_campaigns_fund_id_index" ON "fund_campaigns" USING btree ("fund_id");--> statement-breakpoint
CREATE INDEX "fund_campaigns_name_index" ON "fund_campaigns" USING btree ("name");--> statement-breakpoint
CREATE INDEX "fund_campaigns_start_at_index" ON "fund_campaigns" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fund_campaigns_fund_id_name_index" ON "fund_campaigns" USING btree ("fund_id","name");--> statement-breakpoint
CREATE INDEX "funds_created_at_index" ON "funds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "funds_creator_id_index" ON "funds" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "funds_name_index" ON "funds" USING btree ("name");--> statement-breakpoint
CREATE INDEX "funds_organization_id_index" ON "funds" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "funds_name_organization_id_index" ON "funds" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_created_at_index" ON "organization_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_memberships_creator_id_index" ON "organization_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_member_id_index" ON "organization_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_organization_id_index" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_role_index" ON "organization_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "organizations_creator_id_index" ON "organizations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "organizations_name_index" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_updater_id_index" ON "organizations" USING btree ("updater_id");--> statement-breakpoint
CREATE INDEX "post_attachments_created_at_index" ON "post_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "post_attachments_creator_id_index" ON "post_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "post_attachments_post_id_index" ON "post_attachments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_votes_creator_id_index" ON "post_votes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "post_votes_post_id_index" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_votes_type_index" ON "post_votes" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "post_votes_creator_id_post_id_index" ON "post_votes" USING btree ("creator_id","post_id");--> statement-breakpoint
CREATE INDEX "posts_created_at_index" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_creator_id_index" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "posts_pinned_at_index" ON "posts" USING btree ("pinned_at");--> statement-breakpoint
CREATE INDEX "posts_organization_id_index" ON "posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "recurrences_created_at_index" ON "recurrences" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "recurrences_creator_id_index" ON "recurrences" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "recurrences_event_id_index" ON "recurrences" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tag_assignments_assignee_id_index" ON "tag_assignments" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tag_assignments_created_at_index" ON "tag_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tag_assignments_creator_id_index" ON "tag_assignments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tag_assignments_tag_id_index" ON "tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tags_creator_id_index" ON "tags" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tags_is_folder_index" ON "tags" USING btree ("is_folder");--> statement-breakpoint
CREATE INDEX "tags_name_index" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_organization_id_index" ON "tags" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tags_parent_tag_id_index" ON "tags" USING btree ("parent_tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_is_folder_name_organization_id_index" ON "tags" USING btree ("is_folder","name","organization_id");--> statement-breakpoint
CREATE INDEX "users_creator_id_index" ON "users" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "users_name_index" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "users_updater_id_index" ON "users" USING btree ("updater_id");--> statement-breakpoint
CREATE INDEX "venue_attachments_created_at_index" ON "venue_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "venue_attachments_creator_id_index" ON "venue_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "venue_attachments_venue_id_index" ON "venue_attachments" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_created_at_index" ON "venue_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "venue_bookings_creator_id_index" ON "venue_bookings" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_event_id_index" ON "venue_bookings" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_venue_id_index" ON "venue_bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venues_created_at_index" ON "venues" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "venues_creator_id_index" ON "venues" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "venues_name_index" ON "venues" USING btree ("name");--> statement-breakpoint
CREATE INDEX "venues_organization_id_index" ON "venues" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_name_organization_id_index" ON "venues" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "volunteer_group_assignments_created_at_index" ON "volunteer_group_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "volunteer_group_assignments_creator_id_index" ON "volunteer_group_assignments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "volunteer_group_assignments_group_id_index" ON "volunteer_group_assignments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "volunteer_groups_created_at_index" ON "volunteer_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "volunteer_groups_creator_id_index" ON "volunteer_groups" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "volunteer_groups_event_id_index" ON "volunteer_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "volunteer_groups_leader_id_index" ON "volunteer_groups" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX "volunteer_groups_name_index" ON "volunteer_groups" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "volunteer_groups_event_id_name_index" ON "volunteer_groups" USING btree ("event_id","name");
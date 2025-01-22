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
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
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
CREATE TABLE "agenda_folders" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_agenda_item_folder" boolean NOT NULL,
	"name" text NOT NULL,
	"parent_folder_id" uuid,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"duration" text,
	"folder_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
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
	"parent_message_id" uuid,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"avatar_mime_type" text,
	"avatar_name" text,
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
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"body" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"facebook_url" text,
	"github_url" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"inactivity_timeout_duration" integer,
	"instagram_url" text,
	"linkedin_url" text,
	"logo_mime_type" text,
	"logo_name" text,
	"name" text NOT NULL,
	"reddit_url" text,
	"slack_url" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"website_url" text,
	"x_url" text,
	"youtube_url" text,
	CONSTRAINT "communities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "event_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "event_attendances" (
	"attendee_id" uuid NOT NULL,
	"check_in_at" timestamp (3) with time zone,
	"check_out_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "events" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"end_at" timestamp (3) with time zone NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"start_at" timestamp (3) with time zone NOT NULL,
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
	"address_line_1" text,
	"address_line_2" text,
	"avatar_mime_type" text,
	"avatar_name" text,
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
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone
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
CREATE TABLE "tag_assignments" (
	"assignee_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "tag_assignments_assignee_id_tag_id_pk" PRIMARY KEY("assignee_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag_folders" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_folder_id" uuid,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"folder_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address_line_1" text,
	"address_line_2" text,
	"avatar_mime_type" text,
	"avatar_name" text,
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
	"natural_language_code" text,
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
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"venue_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_bookings" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	CONSTRAINT "venue_bookings_event_id_venue_id_pk" PRIMARY KEY("event_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
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
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_parent_folder_id_agenda_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."agenda_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_folder_id_agenda_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."agenda_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parent_message_id_chat_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_attendee_id_users_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
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
ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_parent_folder_id_tag_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."tag_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_folder_id_tag_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."tag_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
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
CREATE INDEX "agenda_folders_created_at_index" ON "agenda_folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_folders_creator_id_index" ON "agenda_folders" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_folders_event_id_index" ON "agenda_folders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "agenda_folders_is_agenda_item_folder_index" ON "agenda_folders" USING btree ("is_agenda_item_folder");--> statement-breakpoint
CREATE INDEX "agenda_folders_name_index" ON "agenda_folders" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_folders_parent_folder_id_index" ON "agenda_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "agenda_items_created_at_index" ON "agenda_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_items_creator_id_index" ON "agenda_items" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_items_folder_id_index" ON "agenda_items" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "agenda_items_name_index" ON "agenda_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_items_type_index" ON "agenda_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_memberships_chat_id_index" ON "chat_memberships" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_created_at_index" ON "chat_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_memberships_creator_id_index" ON "chat_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_member_id_index" ON "chat_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_role_index" ON "chat_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_index" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_index" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_creator_id_index" ON "chat_messages" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chat_messages_parent_message_id_index" ON "chat_messages" USING btree ("parent_message_id");--> statement-breakpoint
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
CREATE INDEX "events_created_at_index" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_creator_id_index" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "events_end_at_index" ON "events" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "events_name_index" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "events_organization_id_index" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_start_at_index" ON "events" USING btree ("start_at");--> statement-breakpoint
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
CREATE INDEX "tag_assignments_assignee_id_index" ON "tag_assignments" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tag_assignments_created_at_index" ON "tag_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tag_assignments_creator_id_index" ON "tag_assignments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tag_assignments_tag_id_index" ON "tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tag_folders_created_at_index" ON "tag_folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tag_folders_creator_id_index" ON "tag_folders" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tag_folders_name_index" ON "tag_folders" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_folders_organization_id_index" ON "tag_folders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tag_folders_parent_folder_id_index" ON "tag_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "tags_creator_id_index" ON "tags" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tags_name_index" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_organization_id_index" ON "tags" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_organization_id_index" ON "tags" USING btree ("name","organization_id");--> statement-breakpoint
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
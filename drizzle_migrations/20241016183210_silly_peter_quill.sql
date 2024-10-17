CREATE TABLE IF NOT EXISTS "action_categories" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actions" (
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"category_id" uuid,
	"completion_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"organization_id" uuid NOT NULL,
	"post_completion_notes" text,
	"pre_completion_notes" text,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advertisement_attachments" (
	"advertisement_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"position" integer NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"uri" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advertisements" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"description" text,
	"end_at" timestamp NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"start_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agenda_items" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"description" text,
	"duration" text,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text,
	"name" text,
	"position" integer NOT NULL,
	"section_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agenda_sections" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_section_id" uuid,
	"position" integer NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment_votes" (
	"comment_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"type" text NOT NULL,
	"updated_at" timestamp,
	"updated_id" uuid,
	"voter_id" uuid,
	CONSTRAINT "comment_votes_comment_id_voter_id_pk" PRIMARY KEY("comment_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"body" text NOT NULL,
	"commenter_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_comment_id" uuid,
	"pinned_at" timestamp,
	"pinner_id" uuid,
	"post_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_attachments" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"uri" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_attendances" (
	"attendee_id" uuid,
	"check_in_at" timestamp,
	"check_out_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"invite_status" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"base_recurring_event_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"description" text,
	"end_date" date,
	"end_time" time,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"is_base_recurring_event" boolean DEFAULT false NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"is_recurring_exception" boolean DEFAULT false NOT NULL,
	"is_registerable" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"start_time" time,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "families" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_memberships" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"family_id" uuid NOT NULL,
	"member_id" uuid,
	"role" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "family_memberships_family_id_member_id_pk" PRIMARY KEY("family_id","member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fundraising_campaigns" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"end_at" timestamp NOT NULL,
	"fund_id" uuid NOT NULL,
	"goal_amount" integer NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "fundraising_campaigns_fund_id_name_unique" UNIQUE("fund_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funds" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_tax_deductibe" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "funds_name_organization_id_unique" UNIQUE("name","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_memberships" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"is_administrator" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"reason_for_block" text,
	"member_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "organization_memberships_member_id_organization_id_pk" PRIMARY KEY("member_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"address_line_1" text,
	"address_line_2" text,
	"avatar_uri" text,
	"city" text,
	"country_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"postal_code" text,
	"state" text,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pledges" (
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"end_at" timestamp NOT NULL,
	"fundraising_campaign_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_include_family" boolean DEFAULT false NOT NULL,
	"notes" text,
	"pledger_id" uuid,
	"start_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_attachments" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"position" integer NOT NULL,
	"post_id" uuid NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"uri" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_votes" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"post_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updated_id" uuid,
	"type" text NOT NULL,
	"voter_id" uuid,
	CONSTRAINT "post_votes_post_id_voter_id_pk" PRIMARY KEY("post_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"caption" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pinned_at" timestamp,
	"pinner_id" uuid,
	"poster_id" uuid,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recurrences" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"day_of_month" integer,
	"day_of_week" integer,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_count" integer,
	"month_of_year" integer,
	"rrule_string" text NOT NULL,
	"seperation_count" integer,
	"type" text,
	"updated_at" timestamp,
	"updater_id" uuid,
	"week_of_month" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag_assignments" (
	"assignee_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"tag_id" uuid,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "tag_assignments_assignee_id_tag_id_pk" PRIMARY KEY("assignee_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag_folders" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"parent_folder_id" uuid,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"folder_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"address_line_1" text,
	"address_line_2" text,
	"avatar_uri" text,
	"birth_date" date,
	"city" text,
	"country_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"education_grade" text,
	"state" text,
	"email" text NOT NULL,
	"employment_status" text,
	"first_name" text,
	"home_phone_number" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_administrator" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"last_name" text,
	"marital_status" text,
	"mobile_phone_number" text,
	"name" text,
	"natal_sex" text,
	"password_hash" text,
	"postal_code" text,
	"updated_at" timestamp,
	"updater_id" uuid,
	"work_phone_number" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venue_attachments" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"position" integer NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"uri" text NOT NULL,
	"venue_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venue_bookings" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	"venue_id" uuid NOT NULL,
	CONSTRAINT "venue_bookings_event_id_venue_id_pk" PRIMARY KEY("event_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venues" (
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteer_group_assignments" (
	"assignee_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"group_id" uuid NOT NULL,
	"invite_status" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid,
	CONSTRAINT "volunteer_group_assignments_assignee_id_group_id_pk" PRIMARY KEY("assignee_id","group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteer_groups" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leader_id" uuid,
	"max_volunteer_count" integer NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp,
	"updater_id" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_category_id_action_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."action_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_advertisement_id_advertisements_id_fk" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_section_id_agenda_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."agenda_sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_parent_section_id_agenda_sections_id_fk" FOREIGN KEY ("parent_section_id") REFERENCES "public"."agenda_sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agenda_sections" ADD CONSTRAINT "agenda_sections_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_updated_id_user_id_fk" FOREIGN KEY ("updated_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_voter_id_user_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_commenter_id_user_id_fk" FOREIGN KEY ("commenter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_pinner_id_user_id_fk" FOREIGN KEY ("pinner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_attendee_id_user_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_base_recurring_event_id_events_id_fk" FOREIGN KEY ("base_recurring_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "families" ADD CONSTRAINT "families_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "families" ADD CONSTRAINT "families_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "families" ADD CONSTRAINT "families_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fundraising_campaigns" ADD CONSTRAINT "fundraising_campaigns_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fundraising_campaigns" ADD CONSTRAINT "fundraising_campaigns_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fundraising_campaigns" ADD CONSTRAINT "fundraising_campaigns_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funds" ADD CONSTRAINT "funds_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funds" ADD CONSTRAINT "funds_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funds" ADD CONSTRAINT "funds_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pledges" ADD CONSTRAINT "pledges_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pledges" ADD CONSTRAINT "pledges_fundraising_campaign_id_fundraising_campaigns_id_fk" FOREIGN KEY ("fundraising_campaign_id") REFERENCES "public"."fundraising_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pledges" ADD CONSTRAINT "pledges_pledger_id_user_id_fk" FOREIGN KEY ("pledger_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pledges" ADD CONSTRAINT "pledges_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_updated_id_user_id_fk" FOREIGN KEY ("updated_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_voter_id_user_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_pinner_id_user_id_fk" FOREIGN KEY ("pinner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_poster_id_user_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_parent_folder_id_tag_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."tag_folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_folders" ADD CONSTRAINT "tag_folders_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_folder_id_tag_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."tag_folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_attachments" ADD CONSTRAINT "venue_attachments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venues" ADD CONSTRAINT "venues_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "venues" ADD CONSTRAINT "venues_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_group_id_volunteer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."volunteer_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_group_assignments" ADD CONSTRAINT "volunteer_group_assignments_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_leader_id_user_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "volunteer_groups" ADD CONSTRAINT "volunteer_groups_updater_id_user_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "action_categories_created_at_index" ON "action_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "action_categories_creator_id_index" ON "action_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "action_categories_name_index" ON "action_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "action_categories_name_organization_id_index" ON "action_categories" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_assigned_at_index" ON "actions" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_actor_id_index" ON "actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_category_id_index" ON "actions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_completion_at_index" ON "actions" USING btree ("completion_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_created_at_index" ON "actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_creator_id_index" ON "actions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_event_id_index" ON "actions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_is_completed_index" ON "actions" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_organization_id_index" ON "actions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisement_attachments_advertisement_id_index" ON "advertisement_attachments" USING btree ("advertisement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisement_attachments_created_at_index" ON "advertisement_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisement_attachments_creator_id_index" ON "advertisement_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "advertisement_attachments_advertisement_id_position_index" ON "advertisement_attachments" USING btree ("advertisement_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_created_at_index" ON "advertisements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_creator_id_index" ON "advertisements" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_end_at_index" ON "advertisements" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_name_index" ON "advertisements" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_organization_id_index" ON "advertisements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisements_start_at_index" ON "advertisements" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "advertisements_name_organization_id_index" ON "advertisements" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_created_at_index" ON "agenda_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_creator_id_index" ON "agenda_items" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_deleted_at_index" ON "agenda_items" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_name_index" ON "agenda_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_position_index" ON "agenda_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_section_id_index" ON "agenda_items" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_items_type_index" ON "agenda_items" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agenda_items_event_id_position_index" ON "agenda_items" USING btree ("event_id","position") WHERE "agenda_items"."section_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agenda_items_position_section_id_index" ON "agenda_items" USING btree ("position","section_id") WHERE "agenda_items"."section_id" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_sections_created_at_index" ON "agenda_sections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_sections_creator_id_index" ON "agenda_sections" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_sections_event_id_index" ON "agenda_sections" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_sections_name_index" ON "agenda_sections" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agenda_sections_parent_section_id_index" ON "agenda_sections" USING btree ("parent_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agenda_sections_event_id_name_index" ON "agenda_sections" USING btree ("event_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agenda_sections_event_id_position_index" ON "agenda_sections" USING btree ("event_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_votes_comment_id_index" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_votes_created_at_index" ON "comment_votes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_votes_creator_id_index" ON "comment_votes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_votes_type_index" ON "comment_votes" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_votes_voter_id_index" ON "comment_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_commenter_id_index" ON "comments" USING btree ("commenter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_created_at_index" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_creator_id_index" ON "comments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_comment_id_index" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_pinned_at_index" ON "comments" USING btree ("pinned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_post_id_index" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attachments_event_id_index" ON "event_attachments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attachments_created_at_index" ON "event_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attachments_creator_id_index" ON "event_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_attachments_event_id_position_index" ON "event_attachments" USING btree ("event_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_attendee_id_index" ON "event_attendances" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_check_in_at_index" ON "event_attendances" USING btree ("check_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_check_out_at_index" ON "event_attendances" USING btree ("check_out_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_created_at_index" ON "event_attendances" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_creator_id_index" ON "event_attendances" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_event_id_index" ON "event_attendances" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_attendances_invite_status_index" ON "event_attendances" USING btree ("invite_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_at_index" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_creator_id_index" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_name_index" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_organization_id_index" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "families_created_at_index" ON "families" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "families_creator_id_index" ON "families" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "families_name_index" ON "families" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "families_organization_id_index" ON "families" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "families_name_organization_id_index" ON "families" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_memberships_created_at_index" ON "family_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_memberships_creator_id_index" ON "family_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_memberships_family_id_index" ON "family_memberships" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_memberships_member_id_index" ON "family_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_created_at_index" ON "fundraising_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_creator_id_index" ON "fundraising_campaigns" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_end_at_index" ON "fundraising_campaigns" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_fund_id_index" ON "fundraising_campaigns" USING btree ("fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_name_index" ON "fundraising_campaigns" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fundraising_campaigns_start_at_index" ON "fundraising_campaigns" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_created_at_index" ON "funds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_creator_id_index" ON "funds" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_name_index" ON "funds" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_organization_id_index" ON "funds" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_created_at_index" ON "organization_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_creator_id_index" ON "organization_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_is_administrator_index" ON "organization_memberships" USING btree ("is_administrator");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_is_approved_index" ON "organization_memberships" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_is_blocked_index" ON "organization_memberships" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_member_id_index" ON "organization_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_memberships_organization_id_index" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_created_at_index" ON "organizations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_creator_id_index" ON "organizations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_name_index" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_created_at_index" ON "pledges" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_creator_id_index" ON "pledges" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_end_at_index" ON "pledges" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_fundraising_campaign_id_index" ON "pledges" USING btree ("fundraising_campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_pledger_id_index" ON "pledges" USING btree ("pledger_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pledges_start_at_index" ON "pledges" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_attachments_created_at_index" ON "post_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_attachments_creator_id_index" ON "post_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_attachments_post_id_index" ON "post_attachments" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "post_attachments_position_post_id_index" ON "post_attachments" USING btree ("position","post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_votes_created_at_index" ON "post_votes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_votes_creator_id_index" ON "post_votes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_votes_post_id_index" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_votes_type_index" ON "post_votes" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_votes_voter_id_index" ON "post_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_created_at_index" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_creator_id_index" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_organization_id_index" ON "posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_pinned_at_index" ON "posts" USING btree ("pinned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_poster_id_index" ON "posts" USING btree ("poster_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recurrences_created_at_index" ON "recurrences" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recurrences_creator_id_index" ON "recurrences" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recurrences_event_id_index" ON "recurrences" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_assignments_assignee_id_index" ON "tag_assignments" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_assignments_created_at_index" ON "tag_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_assignments_creator_id_index" ON "tag_assignments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_assignments_tag_id_index" ON "tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_folders_created_at_index" ON "tag_folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_folders_creator_id_index" ON "tag_folders" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_folders_name_index" ON "tag_folders" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_folders_organization_id_index" ON "tag_folders" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tag_folders_name_organization_id_index" ON "tag_folders" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_created_at_index" ON "tags" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_creator_id_index" ON "tags" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_folder_id_index" ON "tags" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_name_index" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_organization_id_index" ON "tags" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_organization_id_index" ON "tags" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_created_at_index" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_name_index" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_attachments_created_at_index" ON "venue_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_attachments_creator_id_index" ON "venue_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_attachments_venue_id_index" ON "venue_attachments" USING btree ("venue_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "venue_attachments_position_venue_id_index" ON "venue_attachments" USING btree ("position","venue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_bookings_created_at_index" ON "venue_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_bookings_creator_id_index" ON "venue_bookings" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_bookings_event_id_index" ON "venue_bookings" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venue_bookings_venue_id_index" ON "venue_bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venues_created_at_index" ON "venues" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venues_creator_id_index" ON "venues" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venues_name_index" ON "venues" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "venues_organization_id_index" ON "venues" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "venues_name_organization_id_index" ON "venues" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_group_assignments_created_at_index" ON "volunteer_group_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_group_assignments_creator_id_index" ON "volunteer_group_assignments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_group_assignments_group_id_index" ON "volunteer_group_assignments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_groups_created_at_index" ON "volunteer_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_groups_creator_id_index" ON "volunteer_groups" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_groups_event_id_index" ON "volunteer_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_groups_leader_id_index" ON "volunteer_groups" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "volunteer_groups_name_index" ON "volunteer_groups" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "volunteer_groups_event_id_name_index" ON "volunteer_groups" USING btree ("event_id","name");
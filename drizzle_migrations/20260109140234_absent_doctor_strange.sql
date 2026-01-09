CREATE TYPE "public"."frequency" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TABLE "actionitem_categories" (
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
CREATE TABLE "actionitem_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"assignee_id" uuid,
	"volunteer_id" uuid,
	"volunteer_group_id" uuid,
	"category_id" uuid,
	"assigned_at" timestamp (3) with time zone,
	"pre_completion_notes" text,
	"post_completion_notes" text,
	"completed" boolean DEFAULT false,
	"deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actionitem_exceptions_action_id_event_id_unique" UNIQUE("action_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "actionitems" (
	"assigned_at" timestamp (3) with time zone NOT NULL,
	"volunteer_id" uuid,
	"volunteer_group_id" uuid,
	"category_id" uuid,
	"completion_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid,
	"recurring_event_instance_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_completed" boolean NOT NULL,
	"is_template" boolean DEFAULT false,
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
CREATE TABLE "agenda_categories" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_default_categories" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_folders" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_agenda_item_folder" boolean NOT NULL,
	"is_default_folder" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"parent_folder_id" uuid,
	"organization_id" uuid NOT NULL,
	"sequence" integer,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_item_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"creator_id" uuid,
	"agenda_item_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"name" text,
	"object_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_item_url" (
	"agenda_item_id" uuid NOT NULL,
	"agenda_item_url" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"category_id" uuid NOT NULL,
	"description" text,
	"duration" text,
	"event_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text,
	"name" text NOT NULL,
	"notes" text,
	"sequence" integer NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_memberships" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"chat_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text NOT NULL,
	"last_read_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	CONSTRAINT "chat_memberships_chat_id_member_id_pk" PRIMARY KEY("chat_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "chat_message_read_receipts" (
	"message_id" uuid NOT NULL,
	"reader_id" uuid NOT NULL,
	"read_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_message_read_receipts_message_id_reader_id_pk" PRIMARY KEY("message_id","reader_id")
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
	"updater_id" uuid
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
CREATE TABLE "email_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"notification_log_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ses_message_id" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"sent_at" timestamp (3) with time zone,
	"failed_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "event_attendees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"recurring_event_instance_id" uuid,
	"checkin_time" timestamp (3) with time zone,
	"checkout_time" timestamp (3) with time zone,
	"feedback_submitted" boolean DEFAULT false NOT NULL,
	"is_invited" boolean DEFAULT false NOT NULL,
	"is_registered" boolean DEFAULT false NOT NULL,
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"is_checked_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_exceptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recurring_event_instance_id" uuid NOT NULL,
	"exception_data" jsonb NOT NULL,
	"organization_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"updater_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_generation_windows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"hot_window_months_ahead" integer DEFAULT 12 NOT NULL,
	"history_retention_months" integer DEFAULT 3 NOT NULL,
	"current_window_end_date" timestamp (3) with time zone NOT NULL,
	"retention_start_date" timestamp (3) with time zone NOT NULL,
	"last_processed_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_processed_instance_count" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"processing_priority" integer DEFAULT 5 NOT NULL,
	"max_instances_per_run" integer DEFAULT 1000 NOT NULL,
	"configuration_notes" text,
	"created_by_id" uuid NOT NULL,
	"last_updated_by_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid,
	"recurring_event_instance_id" uuid,
	"invited_by" uuid NOT NULL,
	"invitee_email" varchar(255) NOT NULL,
	"invitee_name" varchar(255),
	"user_id" uuid,
	"invitation_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"responded_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"recurring_event_instance_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "event_volunteer_exceptions_volunteer_id_recurring_event_instance_id_unique" UNIQUE("volunteer_id","recurring_event_instance_id")
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_group_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_group_id" uuid NOT NULL,
	"recurring_event_instance_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "event_volunteer_group_exceptions_volunteer_group_id_recurring_event_instance_id_unique" UNIQUE("volunteer_group_id","recurring_event_instance_id")
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"recurring_event_instance_id" uuid,
	"leader_id" uuid NOT NULL,
	"creator_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"volunteers_required" integer,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"group_id" uuid,
	"event_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_volunteers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"recurring_event_instance_id" uuid,
	"creator_id" uuid,
	"has_accepted" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"hours_volunteered" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
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
	"all_day" boolean DEFAULT false NOT NULL,
	"is_invite_only" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_registerable" boolean DEFAULT false NOT NULL,
	"location" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid,
	"is_recurring_template" boolean DEFAULT false NOT NULL
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
	"amount_raised" integer DEFAULT 0 NOT NULL,
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
	"is_default" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"reference_number" text,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "membership_requests" (
	"membership_request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_org" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "notification_audience" (
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_audience_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid NOT NULL,
	"variables" jsonb,
	"rendered_content" jsonb,
	"sender" uuid,
	"navigation" text,
	"event_type" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"channel_type" text NOT NULL,
	"linked_route_name" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
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
	"user_registration_required" boolean DEFAULT false,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp (3) with time zone,
	"used_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"plugin_id" text NOT NULL,
	"is_activated" boolean DEFAULT false NOT NULL,
	"is_installed" boolean DEFAULT false NOT NULL,
	"backup" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "plugins_plugin_id_unique" UNIQUE("plugin_id")
);
--> statement-breakpoint
CREATE TABLE "post_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"creator_id" uuid,
	"post_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"object_name" text NOT NULL,
	"file_hash" text NOT NULL,
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
	"body" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"pinned_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recurrence_rule_string" text NOT NULL,
	"frequency" "frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"recurrence_start_date" timestamp (3) with time zone NOT NULL,
	"recurrence_end_date" timestamp (3) with time zone,
	"count" integer,
	"latest_instance_date" timestamp (3) with time zone NOT NULL,
	"by_day" text[],
	"by_month" integer[],
	"by_month_day" integer[],
	"base_recurring_event_id" uuid NOT NULL,
	"original_series_id" uuid,
	"organization_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"updater_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "recurring_event_instances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"base_recurring_event_id" uuid NOT NULL,
	"recurrence_rule_id" uuid NOT NULL,
	"original_series_id" uuid NOT NULL,
	"original_instance_start_time" timestamp (3) with time zone NOT NULL,
	"actual_start_time" timestamp (3) with time zone NOT NULL,
	"actual_end_time" timestamp (3) with time zone NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"organization_id" uuid NOT NULL,
	"recurringEventd_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp (3) with time zone,
	"version" text DEFAULT '1' NOT NULL,
	"sequence_number" integer NOT NULL,
	"total_count" integer
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"revoked_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
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
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"home_phone_number" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_email_address_verified" boolean NOT NULL,
	"last_failed_login_at" timestamp (3) with time zone,
	"locked_until" timestamp (3) with time zone,
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
	"capacity" integer,
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
ALTER TABLE "actionitem_categories" ADD CONSTRAINT "actionitem_categories_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_categories" ADD CONSTRAINT "actionitem_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_categories" ADD CONSTRAINT "actionitem_categories_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_action_id_actionitems_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actionitems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_event_id_recurring_event_instances_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_category_id_actionitem_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."actionitem_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_category_id_actionitem_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."actionitem_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_advertisement_id_advertisements_id_fk" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisement_attachments" ADD CONSTRAINT "advertisement_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_parent_folder_id_agenda_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."agenda_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_category_id_agenda_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agenda_categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_folder_id_agenda_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."agenda_folders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
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
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_notification_log_id_notification_logs_id_fk" FOREIGN KEY ("notification_log_id") REFERENCES "public"."notification_logs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_generation_windows" ADD CONSTRAINT "event_generation_windows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_generation_windows" ADD CONSTRAINT "event_generation_windows_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_generation_windows" ADD CONSTRAINT "event_generation_windows_last_updated_by_id_users_id_fk" FOREIGN KEY ("last_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
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
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_audience" ADD CONSTRAINT "notification_audience_notification_id_notification_logs_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification_logs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_audience" ADD CONSTRAINT "notification_audience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_sender_users_id_fk" FOREIGN KEY ("sender") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_base_recurring_event_id_events_id_fk" FOREIGN KEY ("base_recurring_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD CONSTRAINT "recurring_event_instances_base_recurring_event_id_events_id_fk" FOREIGN KEY ("base_recurring_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD CONSTRAINT "recurring_event_instances_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD CONSTRAINT "recurring_event_instances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "actionitem_categories_created_at_index" ON "actionitem_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "actionitem_categories_creator_id_index" ON "actionitem_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "actionitem_categories_name_index" ON "actionitem_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "actionitem_categories_name_organization_id_index" ON "actionitem_categories" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "actionitems_assigned_at_index" ON "actionitems" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "actionitems_volunteer_id_index" ON "actionitems" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "actionitems_volunteer_group_id_index" ON "actionitems" USING btree ("volunteer_group_id");--> statement-breakpoint
CREATE INDEX "actionitems_category_id_index" ON "actionitems" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "actionitems_completion_at_index" ON "actionitems" USING btree ("completion_at");--> statement-breakpoint
CREATE INDEX "actionitems_created_at_index" ON "actionitems" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "actionitems_creator_id_index" ON "actionitems" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "actionitems_organization_id_index" ON "actionitems" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_advertisement_id_index" ON "advertisement_attachments" USING btree ("advertisement_id");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_created_at_index" ON "advertisement_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "advertisement_attachments_creator_id_index" ON "advertisement_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "advertisements_creator_id_index" ON "advertisements" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "advertisements_end_at_index" ON "advertisements" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "advertisements_name_index" ON "advertisements" USING btree ("name");--> statement-breakpoint
CREATE INDEX "advertisements_organization_id_index" ON "advertisements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "advertisements_start_at_index" ON "advertisements" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "advertisements_name_organization_id_index" ON "advertisements" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "agenda_categories_created_at_index" ON "agenda_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_categories_creator_id_index" ON "agenda_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_categories_event_id_index" ON "agenda_categories" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "agenda_categories_name_index" ON "agenda_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_folders_created_at_index" ON "agenda_folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_folders_creator_id_index" ON "agenda_folders" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_folders_event_id_index" ON "agenda_folders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "agenda_folders_is_agenda_item_folder_index" ON "agenda_folders" USING btree ("is_agenda_item_folder");--> statement-breakpoint
CREATE INDEX "agenda_folders_name_index" ON "agenda_folders" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_folders_parent_folder_id_index" ON "agenda_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_created_at_index" ON "agenda_item_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_creator_id_index" ON "agenda_item_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_agenda_item_id_index" ON "agenda_item_attachments" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_file_hash_index" ON "agenda_item_attachments" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_object_name_index" ON "agenda_item_attachments" USING btree ("object_name");--> statement-breakpoint
CREATE INDEX "agenda_item_url_created_at_index" ON "agenda_item_url" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_url_creator_id_index" ON "agenda_item_url" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_url_id_index" ON "agenda_item_url" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agenda_item_url_agenda_item_url_index" ON "agenda_item_url" USING btree ("agenda_item_url");--> statement-breakpoint
CREATE INDEX "agenda_item_url_agenda_item_id_index" ON "agenda_item_url" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "agenda_items_created_at_index" ON "agenda_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_items_creator_id_index" ON "agenda_items" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_items_folder_id_index" ON "agenda_items" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "agenda_items_name_index" ON "agenda_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_items_type_index" ON "agenda_items" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "blocked_users_org_user_unique" ON "blocked_users" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "blocked_users_organization_id_idx" ON "blocked_users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "blocked_users_user_id_idx" ON "blocked_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_chat_id_index" ON "chat_memberships" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_created_at_index" ON "chat_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_memberships_creator_id_index" ON "chat_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_member_id_index" ON "chat_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "chat_memberships_role_index" ON "chat_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_memberships_last_read_at_index" ON "chat_memberships" USING btree ("last_read_at");--> statement-breakpoint
CREATE INDEX "chat_message_read_receipts_message_id_index" ON "chat_message_read_receipts" USING btree ("message_id");--> statement-breakpoint
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
CREATE INDEX "email_notifications_notification_log_id_index" ON "email_notifications" USING btree ("notification_log_id");--> statement-breakpoint
CREATE INDEX "email_notifications_user_id_index" ON "email_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_notifications_status_index" ON "email_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_notifications_created_at_index" ON "email_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_attachments_event_id_index" ON "event_attachments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attachments_created_at_index" ON "event_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_attachments_creator_id_index" ON "event_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_id_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_attendees_event_id_idx" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_recurring_event_instance_id_idx" ON "event_attendees" USING btree ("recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_is_invited_idx" ON "event_attendees" USING btree ("is_invited");--> statement-breakpoint
CREATE INDEX "event_attendees_is_registered_idx" ON "event_attendees" USING btree ("is_registered");--> statement-breakpoint
CREATE INDEX "event_attendees_is_checked_in_idx" ON "event_attendees" USING btree ("is_checked_in");--> statement-breakpoint
CREATE INDEX "event_attendees_is_checked_out_idx" ON "event_attendees" USING btree ("is_checked_out");--> statement-breakpoint
CREATE INDEX "event_attendees_checkin_time_idx" ON "event_attendees" USING btree ("checkin_time");--> statement-breakpoint
CREATE INDEX "event_attendees_checkout_time_idx" ON "event_attendees" USING btree ("checkout_time");--> statement-breakpoint
CREATE INDEX "event_attendees_feedback_submitted_idx" ON "event_attendees" USING btree ("feedback_submitted");--> statement-breakpoint
CREATE INDEX "event_attendees_user_event_idx" ON "event_attendees" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_recurring_instance_idx" ON "event_attendees" USING btree ("user_id","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_invited_event_idx" ON "event_attendees" USING btree ("user_id","is_invited","event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_invited_recurring_instance_idx" ON "event_attendees" USING btree ("user_id","is_invited","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_registered_event_idx" ON "event_attendees" USING btree ("user_id","is_registered","event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_registered_recurring_instance_idx" ON "event_attendees" USING btree ("user_id","is_registered","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_created_at_idx" ON "event_attendees" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ee_recurring_event_instance_id_idx" ON "event_exceptions" USING btree ("recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "ee_organization_id_idx" ON "event_exceptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ee_creator_id_idx" ON "event_exceptions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "egw_organization_id_unique_idx" ON "event_generation_windows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "egw_enabled_windows_idx" ON "event_generation_windows" USING btree ("is_enabled","processing_priority");--> statement-breakpoint
CREATE INDEX "egw_last_processed_at_idx" ON "event_generation_windows" USING btree ("last_processed_at");--> statement-breakpoint
CREATE INDEX "egw_current_window_end_date_idx" ON "event_generation_windows" USING btree ("current_window_end_date");--> statement-breakpoint
CREATE INDEX "egw_retention_start_date_idx" ON "event_generation_windows" USING btree ("retention_start_date");--> statement-breakpoint
CREATE INDEX "egw_worker_processing_idx" ON "event_generation_windows" USING btree ("is_enabled","processing_priority","last_processed_at");--> statement-breakpoint
CREATE INDEX "event_invitations_event_id_idx" ON "event_invitations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_invitations_email_idx" ON "event_invitations" USING btree ("invitee_email");--> statement-breakpoint
CREATE INDEX "event_invitations_token_idx" ON "event_invitations" USING btree ("invitation_token");--> statement-breakpoint
CREATE INDEX "event_invitations_status_idx" ON "event_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_invitations_created_at_idx" ON "event_invitations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteer_groups_event_id_name_recurring_event_instance_id_index" ON "event_volunteer_groups" USING btree ("event_id","name","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_created_at_index" ON "event_volunteer_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_event_id_index" ON "event_volunteer_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_leader_id_index" ON "event_volunteer_groups" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_name_index" ON "event_volunteer_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_is_template_index" ON "event_volunteer_groups" USING btree ("is_template");--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteer_memberships_volunteer_id_group_id_event_id_index" ON "event_volunteer_memberships" USING btree ("volunteer_id","group_id","event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_created_at_index" ON "event_volunteer_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_event_id_index" ON "event_volunteer_memberships" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_volunteer_id_index" ON "event_volunteer_memberships" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_status_index" ON "event_volunteer_memberships" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteers_user_id_event_id_recurring_event_instance_id_index" ON "event_volunteers" USING btree ("user_id","event_id","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_created_at_index" ON "event_volunteers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteers_event_id_index" ON "event_volunteers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_user_id_index" ON "event_volunteers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_has_accepted_index" ON "event_volunteers" USING btree ("has_accepted");--> statement-breakpoint
CREATE INDEX "event_volunteers_is_template_index" ON "event_volunteers" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_creator_id_idx" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "events_end_at_idx" ON "events" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "events_name_idx" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "events_organization_id_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "events_all_day_idx" ON "events" USING btree ("all_day");--> statement-breakpoint
CREATE INDEX "events_is_invite_only_idx" ON "events" USING btree ("is_invite_only");--> statement-breakpoint
CREATE INDEX "events_is_public_idx" ON "events" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "events_is_registerable_idx" ON "events" USING btree ("is_registerable");--> statement-breakpoint
CREATE INDEX "events_is_recurring_template_idx" ON "events" USING btree ("is_recurring_template");--> statement-breakpoint
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
CREATE INDEX "idx_membership_requests_user" ON "membership_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_org" ON "membership_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notification_audience_notification_id_index" ON "notification_audience" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_audience_user_id_index" ON "notification_audience" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_audience_is_read_index" ON "notification_audience" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_logs_template_id_index" ON "notification_logs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "notification_logs_status_index" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_channel_index" ON "notification_logs" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notification_logs_created_at_index" ON "notification_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_templates_event_type_index" ON "notification_templates" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notification_templates_channel_type_index" ON "notification_templates" USING btree ("channel_type");--> statement-breakpoint
CREATE INDEX "notification_templates_created_at_index" ON "notification_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_memberships_created_at_index" ON "organization_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_memberships_creator_id_index" ON "organization_memberships" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_member_id_index" ON "organization_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_organization_id_index" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_role_index" ON "organization_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "organizations_creator_id_index" ON "organizations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "organizations_name_index" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_updater_id_index" ON "organizations" USING btree ("updater_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "plugins_is_activated_index" ON "plugins" USING btree ("is_activated");--> statement-breakpoint
CREATE INDEX "plugins_is_installed_index" ON "plugins" USING btree ("is_installed");--> statement-breakpoint
CREATE INDEX "post_attachments_created_at_index" ON "post_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "post_attachments_creator_id_index" ON "post_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "post_attachments_post_id_index" ON "post_attachments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_attachments_file_hash_index" ON "post_attachments" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "post_attachments_object_name_index" ON "post_attachments" USING btree ("object_name");--> statement-breakpoint
CREATE INDEX "post_votes_creator_id_index" ON "post_votes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "post_votes_post_id_index" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_votes_type_index" ON "post_votes" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "post_votes_creator_id_post_id_index" ON "post_votes" USING btree ("creator_id","post_id");--> statement-breakpoint
CREATE INDEX "posts_created_at_index" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_creator_id_index" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "posts_pinned_at_index" ON "posts" USING btree ("pinned_at");--> statement-breakpoint
CREATE INDEX "posts_organization_id_index" ON "posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rr_latest_instance_date_idx" ON "recurrence_rules" USING btree ("latest_instance_date");--> statement-breakpoint
CREATE INDEX "rr_organization_id_idx" ON "recurrence_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rr_base_recurring_event_id_idx" ON "recurrence_rules" USING btree ("base_recurring_event_id");--> statement-breakpoint
CREATE INDEX "rr_frequency_idx" ON "recurrence_rules" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "rr_creator_id_idx" ON "recurrence_rules" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "rr_recurrence_start_date_idx" ON "recurrence_rules" USING btree ("recurrence_start_date");--> statement-breakpoint
CREATE INDEX "rr_recurrence_end_date_idx" ON "recurrence_rules" USING btree ("recurrence_end_date");--> statement-breakpoint
CREATE INDEX "reei_base_recurring_event_idx" ON "recurring_event_instances" USING btree ("base_recurring_event_id");--> statement-breakpoint
CREATE INDEX "reei_org_date_range_idx" ON "recurring_event_instances" USING btree ("organization_id","actual_start_time","actual_end_time");--> statement-breakpoint
CREATE INDEX "reei_actual_start_time_idx" ON "recurring_event_instances" USING btree ("actual_start_time");--> statement-breakpoint
CREATE INDEX "reei_actual_end_time_idx" ON "recurring_event_instances" USING btree ("actual_end_time");--> statement-breakpoint
CREATE INDEX "reei_original_instance_start_time_idx" ON "recurring_event_instances" USING btree ("original_instance_start_time");--> statement-breakpoint
CREATE INDEX "reei_recurrence_rule_idx" ON "recurring_event_instances" USING btree ("recurrence_rule_id");--> statement-breakpoint
CREATE INDEX "reei_original_series_idx" ON "recurring_event_instances" USING btree ("original_series_id");--> statement-breakpoint
CREATE INDEX "reei_is_cancelled_idx" ON "recurring_event_instances" USING btree ("is_cancelled");--> statement-breakpoint
CREATE INDEX "reei_recurringEventd_at_idx" ON "recurring_event_instances" USING btree ("recurringEventd_at");--> statement-breakpoint
CREATE INDEX "reei_org_active_instances_idx" ON "recurring_event_instances" USING btree ("organization_id","is_cancelled","actual_start_time");--> statement-breakpoint
CREATE INDEX "reei_base_event_instance_time_idx" ON "recurring_event_instances" USING btree ("base_recurring_event_id","original_instance_start_time");--> statement-breakpoint
CREATE INDEX "reei_cleanup_candidates_idx" ON "recurring_event_instances" USING btree ("actual_end_time","recurringEventd_at");--> statement-breakpoint
CREATE INDEX "reei_sequence_number_idx" ON "recurring_event_instances" USING btree ("base_recurring_event_id","sequence_number");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
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
CREATE UNIQUE INDEX "venues_name_organization_id_index" ON "venues" USING btree ("name","organization_id");
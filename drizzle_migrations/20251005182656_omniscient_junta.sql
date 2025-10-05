CREATE TABLE "email_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"notification_log_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
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
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_notification_log_id_notification_logs_id_fk" FOREIGN KEY ("notification_log_id") REFERENCES "public"."notification_logs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_audience" ADD CONSTRAINT "notification_audience_notification_id_notification_logs_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification_logs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_audience" ADD CONSTRAINT "notification_audience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_sender_users_id_fk" FOREIGN KEY ("sender") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "email_notifications_notification_log_id_index" ON "email_notifications" USING btree ("notification_log_id");--> statement-breakpoint
CREATE INDEX "email_notifications_user_id_index" ON "email_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_notifications_status_index" ON "email_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_notifications_created_at_index" ON "email_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_audience_notification_id_index" ON "notification_audience" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_audience_user_id_index" ON "notification_audience" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_audience_is_read_index" ON "notification_audience" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_logs_template_id_index" ON "notification_logs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "notification_logs_status_index" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_channel_index" ON "notification_logs" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notification_logs_created_at_index" ON "notification_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_templates_event_type_index" ON "notification_templates" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notification_templates_channel_type_index" ON "notification_templates" USING btree ("channel_type");--> statement-breakpoint
CREATE INDEX "notification_templates_created_at_index" ON "notification_templates" USING btree ("created_at");
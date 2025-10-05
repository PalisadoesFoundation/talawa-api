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
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_notification_log_id_notification_logs_id_fk" FOREIGN KEY ("notification_log_id") REFERENCES "public"."notification_logs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "email_notifications_notification_log_id_index" ON "email_notifications" USING btree ("notification_log_id");--> statement-breakpoint
CREATE INDEX "email_notifications_user_id_index" ON "email_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_notifications_status_index" ON "email_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_notifications_created_at_index" ON "email_notifications" USING btree ("created_at");
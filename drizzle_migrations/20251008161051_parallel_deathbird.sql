CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_attendee_id" uuid NOT NULL,
	"time" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"feedback_submitted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "check_outs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_attendee_id" uuid NOT NULL,
	"time" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"recurring_event_instance_id" uuid,
	"check_in_id" uuid,
	"check_out_id" uuid,
	"is_invited" boolean DEFAULT false NOT NULL,
	"is_registered" boolean DEFAULT false NOT NULL,
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"is_checked_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_event_attendee_id_event_attendees_id_fk" FOREIGN KEY ("event_attendee_id") REFERENCES "public"."event_attendees"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "check_outs" ADD CONSTRAINT "check_outs_event_attendee_id_event_attendees_id_fk" FOREIGN KEY ("event_attendee_id") REFERENCES "public"."event_attendees"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "check_ins_event_attendee_id_idx" ON "check_ins" USING btree ("event_attendee_id");--> statement-breakpoint
CREATE INDEX "check_ins_time_idx" ON "check_ins" USING btree ("time");--> statement-breakpoint
CREATE INDEX "check_ins_feedback_submitted_idx" ON "check_ins" USING btree ("feedback_submitted");--> statement-breakpoint
CREATE INDEX "check_ins_created_at_idx" ON "check_ins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "check_outs_event_attendee_id_idx" ON "check_outs" USING btree ("event_attendee_id");--> statement-breakpoint
CREATE INDEX "check_outs_time_idx" ON "check_outs" USING btree ("time");--> statement-breakpoint
CREATE INDEX "check_outs_created_at_idx" ON "check_outs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_attendees_user_id_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_attendees_event_id_idx" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_recurring_event_instance_id_idx" ON "event_attendees" USING btree ("recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_is_invited_idx" ON "event_attendees" USING btree ("is_invited");--> statement-breakpoint
CREATE INDEX "event_attendees_is_registered_idx" ON "event_attendees" USING btree ("is_registered");--> statement-breakpoint
CREATE INDEX "event_attendees_is_checked_in_idx" ON "event_attendees" USING btree ("is_checked_in");--> statement-breakpoint
CREATE INDEX "event_attendees_is_checked_out_idx" ON "event_attendees" USING btree ("is_checked_out");--> statement-breakpoint
CREATE INDEX "event_attendees_check_in_id_idx" ON "event_attendees" USING btree ("check_in_id");--> statement-breakpoint
CREATE INDEX "event_attendees_check_out_id_idx" ON "event_attendees" USING btree ("check_out_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_event_idx" ON "event_attendees" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_recurring_instance_idx" ON "event_attendees" USING btree ("user_id","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_attendees_created_at_idx" ON "event_attendees" USING btree ("created_at");
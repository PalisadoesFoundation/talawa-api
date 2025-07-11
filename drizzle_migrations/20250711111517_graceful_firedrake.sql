DROP INDEX "events_created_at_index";--> statement-breakpoint
DROP INDEX "events_creator_id_index";--> statement-breakpoint
DROP INDEX "events_end_at_index";--> statement-breakpoint
DROP INDEX "events_name_index";--> statement-breakpoint
DROP INDEX "events_organization_id_index";--> statement-breakpoint
DROP INDEX "events_start_at_index";--> statement-breakpoint
DROP INDEX "events_all_day_index";--> statement-breakpoint
DROP INDEX "events_is_public_index";--> statement-breakpoint
DROP INDEX "events_is_registerable_index";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_recurring_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recurring_event_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "instance_start_time" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_recurring_event_id_events_id_fk" FOREIGN KEY ("recurring_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_creator_id_idx" ON "events" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "events_end_at_idx" ON "events" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "events_name_idx" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "events_organization_id_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "events_all_day_idx" ON "events" USING btree ("all_day");--> statement-breakpoint
CREATE INDEX "events_is_public_idx" ON "events" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "events_is_registerable_idx" ON "events" USING btree ("is_registerable");--> statement-breakpoint
CREATE INDEX "events_is_recurring_template_idx" ON "events" USING btree ("is_recurring_template");--> statement-breakpoint
CREATE INDEX "events_recurring_event_id_idx" ON "events" USING btree ("recurring_event_id");--> statement-breakpoint
CREATE INDEX "events_instance_start_time_idx" ON "events" USING btree ("instance_start_time");
ALTER TABLE "events" ALTER COLUMN "end_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "start_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ALTER COLUMN "original_instance_start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ALTER COLUMN "actual_start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ALTER COLUMN "actual_end_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD COLUMN "original_instance_start_date" date;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD COLUMN "actual_start_date" date;--> statement-breakpoint
ALTER TABLE "recurring_event_instances" ADD COLUMN "actual_end_date" date;--> statement-breakpoint
CREATE INDEX "events_end_date_idx" ON "events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "reei_actual_start_date_idx" ON "recurring_event_instances" USING btree ("actual_start_date");--> statement-breakpoint
CREATE INDEX "reei_actual_end_date_idx" ON "recurring_event_instances" USING btree ("actual_end_date");--> statement-breakpoint
CREATE INDEX "reei_original_instance_start_date_idx" ON "recurring_event_instances" USING btree ("original_instance_start_date");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "all_day_consistency_check" CHECK (
				CASE
					WHEN "events"."all_day" = true THEN
						"events"."start_date" IS NOT NULL AND "events"."end_date" IS NOT NULL
						AND "events"."start_at" IS NULL AND "events"."end_at" IS NULL
					WHEN "events"."all_day" = false THEN
						"events"."start_at" IS NOT NULL AND "events"."end_at" IS NOT NULL
						AND "events"."start_date" IS NULL AND "events"."end_date" IS NULL
					ELSE false
				END = true
			);
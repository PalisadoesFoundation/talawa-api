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

-- Backfill legacy rows before enforcing all_day_consistency_check
-- Normalize all_day=true rows to date-only representation.
UPDATE "events"
SET
	"start_date" = COALESCE(
		"start_date",
		("start_at" AT TIME ZONE 'UTC')::date,
		("created_at" AT TIME ZONE 'UTC')::date
	),
	"end_date" = COALESCE(
		"end_date",
		("end_at" AT TIME ZONE 'UTC')::date,
		(
			COALESCE(
			"start_date",
			("start_at" AT TIME ZONE 'UTC')::date,
			("created_at" AT TIME ZONE 'UTC')::date
			) + INTERVAL '1 day'
		)::date
	),
	"start_at" = NULL,
	"end_at" = NULL
WHERE
	"all_day" = true
	AND NOT (
		"start_date" IS NOT NULL AND "end_date" IS NOT NULL
		AND "start_at" IS NULL AND "end_at" IS NULL
	);
--> statement-breakpoint

-- Normalize all_day=false rows to timed representation.
UPDATE "events"
SET
	"start_at" = COALESCE(
		"start_at",
		("start_date"::timestamp AT TIME ZONE 'UTC'),
		"created_at"
	),
	"end_at" = COALESCE(
		"end_at",
		("end_date"::timestamp AT TIME ZONE 'UTC'),
		COALESCE(
			"start_at",
			("start_date"::timestamp AT TIME ZONE 'UTC'),
			"created_at"
		) + INTERVAL '1 hour'
	),
	"start_date" = NULL,
	"end_date" = NULL
WHERE
	"all_day" = false
	AND NOT (
		"start_at" IS NOT NULL AND "end_at" IS NOT NULL
		AND "start_date" IS NULL AND "end_date" IS NULL
	);
--> statement-breakpoint

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
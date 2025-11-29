-- NOTE: Made idempotent / defensive because dev DB already has the new column names.
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'event_exceptions'
			AND column_name = 'event_instance_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'event_exceptions'
			AND column_name = 'recurring_event_instance_id'
	) THEN
		EXECUTE 'ALTER TABLE "event_exceptions" RENAME COLUMN "event_instance_id" TO "recurring_event_instance_id"';
	END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_exceptions_event_instance_id_events_id_fk') THEN
		ALTER TABLE "event_exceptions" DROP CONSTRAINT "event_exceptions_event_instance_id_events_id_fk";
	END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_exceptions_recurring_event_id_events_id_fk') THEN
		ALTER TABLE "event_exceptions" DROP CONSTRAINT "event_exceptions_recurring_event_id_events_id_fk";
	END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ee_event_instance_id_idx') THEN EXECUTE 'DROP INDEX "ee_event_instance_id_idx"'; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ee_recurring_event_id_idx') THEN EXECUTE 'DROP INDEX "ee_recurring_event_id_idx"'; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ee_instance_start_time_idx') THEN EXECUTE 'DROP INDEX "ee_instance_start_time_idx"'; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ee_exception_type_idx') THEN EXECUTE 'DROP INDEX "ee_exception_type_idx"'; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ee_recurring_event_instance_idx') THEN EXECUTE 'DROP INDEX "ee_recurring_event_instance_idx"'; END IF; END $$;--> statement-breakpoint

-- Safe alter: only change default if column exists
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
			WHERE table_schema='public' AND table_name='notification_logs' AND column_name='status'
	) THEN
		ALTER TABLE "notification_logs" ALTER COLUMN "status" SET DEFAULT 'created';
	END IF;
END $$;--> statement-breakpoint

-- Add columns only if absent
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recurrence_rules' AND column_name='original_series_id') THEN
		ALTER TABLE "recurrence_rules" ADD COLUMN "original_series_id" uuid;
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recurring_event_instances' AND column_name='original_series_id') THEN
		ALTER TABLE "recurring_event_instances" ADD COLUMN "original_series_id" uuid NOT NULL;
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='venues' AND column_name='capacity') THEN
		ALTER TABLE "venues" ADD COLUMN "capacity" integer;
	END IF;
END $$;--> statement-breakpoint

-- New FK & index creation guarded
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='event_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk') THEN
		ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='ee_recurring_event_instance_id_idx') THEN
		CREATE INDEX "ee_recurring_event_instance_id_idx" ON "event_exceptions" USING btree ("recurring_event_instance_id");
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='reei_original_series_idx') THEN
		CREATE INDEX "reei_original_series_idx" ON "recurring_event_instances" USING btree ("original_series_id");
	END IF;
END $$;--> statement-breakpoint

-- Drop old columns if they still exist
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_exceptions' AND column_name='recurring_event_id') THEN ALTER TABLE "event_exceptions" DROP COLUMN "recurring_event_id"; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_exceptions' AND column_name='instance_start_time') THEN ALTER TABLE "event_exceptions" DROP COLUMN "instance_start_time"; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_exceptions' AND column_name='exception_type') THEN ALTER TABLE "event_exceptions" DROP COLUMN "exception_type"; END IF; END $$;--> statement-breakpoint

DROP TYPE IF EXISTS "public"."exception_type";
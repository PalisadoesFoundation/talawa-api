DROP INDEX IF EXISTS "egw_organization_id_unique_idx";--> statement-breakpoint
-- Pre-migration cleanup: Remove duplicate event_generation_windows rows per organization_id
-- Keep only the oldest record (lowest id) for each organization_id
DELETE FROM "event_generation_windows"
WHERE "id" NOT IN (
  SELECT MIN("id")
  FROM "event_generation_windows"
  GROUP BY "organization_id"
);--> statement-breakpoint
CREATE UNIQUE INDEX "egw_organization_id_unique" ON "event_generation_windows" USING btree ("organization_id");--> statement-breakpoint

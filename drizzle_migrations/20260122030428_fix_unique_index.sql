DROP INDEX IF EXISTS "egw_organization_id_unique_idx";--> statement-breakpoint
-- Pre-migration cleanup: Remove duplicate event_generation_windows rows per organization_id
-- Keep only the oldest record (earliest created_at) for each organization_id
DELETE FROM "event_generation_windows"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("organization_id") "id"
  FROM "event_generation_windows"
  ORDER BY "organization_id", "created_at" ASC
);--> statement-breakpoint
CREATE UNIQUE INDEX "egw_organization_id_unique" ON "event_generation_windows" USING btree ("organization_id");--> statement-breakpoint

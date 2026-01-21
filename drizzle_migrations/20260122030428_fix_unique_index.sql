DROP INDEX IF EXISTS "egw_organization_id_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "egw_organization_id_unique" ON "event_generation_windows" USING btree ("organization_id");--> statement-breakpoint

DROP INDEX "egw_organization_id_unique_idx";--> statement-breakpoint
ALTER TABLE "event_generation_windows" ADD CONSTRAINT "egw_organization_id_unique" UNIQUE("organization_id");
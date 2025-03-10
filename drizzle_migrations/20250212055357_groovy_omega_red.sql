DROP INDEX "venues_created_at_index";--> statement-breakpoint
DROP INDEX "venues_creator_id_index";--> statement-breakpoint
DROP INDEX "venues_name_index";--> statement-breakpoint
DROP INDEX "venues_organization_id_index";--> statement-breakpoint
DROP INDEX "venues_name_organization_id_index";--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "capacity" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "capacity_check" CHECK ("venues"."capacity" >= 1);
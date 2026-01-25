ALTER TABLE "agenda_folders" DROP CONSTRAINT "agenda_folders_parent_folder_id_agenda_folders_id_fk";
--> statement-breakpoint
DROP INDEX "agenda_folders_is_agenda_item_folder_index";--> statement-breakpoint
DROP INDEX "agenda_folders_parent_folder_id_index";--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "is_default_folder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "sequence" integer;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_folders_organization_id_index" ON "agenda_folders" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "agenda_folders" DROP COLUMN "is_agenda_item_folder";--> statement-breakpoint
ALTER TABLE "agenda_folders" DROP COLUMN "parent_folder_id";
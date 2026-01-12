CREATE TABLE "agenda_item_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"creator_id" uuid,
	"agenda_item_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"name" text,
	"object_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "agenda_item_url" (
	"agenda_item_id" uuid NOT NULL,
	"agenda_item_url" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "agenda_folders" DROP CONSTRAINT "agenda_folders_parent_folder_id_agenda_folders_id_fk";
--> statement-breakpoint
DROP INDEX "agenda_folders_is_agenda_item_folder_index";--> statement-breakpoint
DROP INDEX "agenda_folders_parent_folder_id_index";--> statement-breakpoint
DROP INDEX "agenda_items_type_index";--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "is_default_folder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD COLUMN "sequence" integer;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "sequence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_created_at_index" ON "agenda_item_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_creator_id_index" ON "agenda_item_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_agenda_item_id_index" ON "agenda_item_attachments" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_file_hash_index" ON "agenda_item_attachments" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_object_name_index" ON "agenda_item_attachments" USING btree ("object_name");--> statement-breakpoint
CREATE INDEX "agenda_item_url_created_at_index" ON "agenda_item_url" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_url_creator_id_index" ON "agenda_item_url" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_url_agenda_item_id_index" ON "agenda_item_url" USING btree ("agenda_item_id");--> statement-breakpoint
ALTER TABLE "agenda_folders" ADD CONSTRAINT "agenda_folders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_category_id_agenda_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agenda_categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_folders_organization_id_index" ON "agenda_folders" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "agenda_folders" DROP COLUMN "is_agenda_item_folder";--> statement-breakpoint
ALTER TABLE "agenda_folders" DROP COLUMN "parent_folder_id";--> statement-breakpoint
ALTER TABLE "agenda_items" DROP COLUMN "type";
CREATE TABLE "agenda_item_attachments" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"creator_id" uuid,
	"agenda_item_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"name" text NOT NULL,
	"object_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT null,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_created_at_index" ON "agenda_item_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_creator_id_index" ON "agenda_item_attachments" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_agenda_item_id_index" ON "agenda_item_attachments" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_file_hash_index" ON "agenda_item_attachments" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "agenda_item_attachments_object_name_index" ON "agenda_item_attachments" USING btree ("object_name");
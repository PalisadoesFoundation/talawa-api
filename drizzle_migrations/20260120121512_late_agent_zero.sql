ALTER TABLE "funds" ALTER COLUMN "name" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "sequence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_category_id_agenda_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agenda_categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_items_category_id_index" ON "agenda_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "agenda_items_event_id_index" ON "agenda_items" USING btree ("event_id");
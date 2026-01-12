ALTER TABLE "agenda_item_url" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
CREATE INDEX "agenda_items_category_id_index" ON "agenda_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "agenda_items_event_id_index" ON "agenda_items" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "agenda_item_url" DROP COLUMN "agenda_item_url";
CREATE TABLE "agenda_item_url" (
	"agenda_item_id" uuid NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "sequence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_item_url" ADD CONSTRAINT "agenda_item_url_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_item_url_created_at_index" ON "agenda_item_url" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_item_url_creator_id_index" ON "agenda_item_url" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_item_url_agenda_item_id_index" ON "agenda_item_url" USING btree ("agenda_item_id");--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_category_id_agenda_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agenda_categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_items_category_id_index" ON "agenda_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "agenda_items_event_id_index" ON "agenda_items" USING btree ("event_id");
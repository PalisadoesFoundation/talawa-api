ALTER TABLE "events" ADD COLUMN "all_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_registerable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location" text;--> statement-breakpoint
CREATE INDEX "events_all_day_index" ON "events" USING btree ("all_day");--> statement-breakpoint
CREATE INDEX "events_is_public_index" ON "events" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "events_is_registerable_index" ON "events" USING btree ("is_registerable");
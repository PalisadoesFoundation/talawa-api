ALTER TABLE "events" ADD COLUMN "all_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "events_all_day_index" ON "events" USING btree ("all_day");
ALTER TABLE "events" ADD COLUMN "is_invite_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "events_is_invite_only_idx" ON "events" USING btree ("is_invite_only");
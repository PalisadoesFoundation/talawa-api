CREATE TABLE "event_volunteers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"creator_id" uuid,
	"has_accepted" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"hours_volunteered" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteers_user_id_event_id_index" ON "event_volunteers" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_created_at_index" ON "event_volunteers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteers_event_id_index" ON "event_volunteers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_user_id_index" ON "event_volunteers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_has_accepted_index" ON "event_volunteers" USING btree ("has_accepted");
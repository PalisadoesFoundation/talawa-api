CREATE TABLE "agenda_categories" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"event_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_default_category" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "creator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agenda_categories" ADD CONSTRAINT "agenda_categories_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "agenda_categories_created_at_index" ON "agenda_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agenda_categories_creator_id_index" ON "agenda_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agenda_categories_event_id_index" ON "agenda_categories" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "agenda_categories_name_index" ON "agenda_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agenda_categories_organization_id_index" ON "agenda_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agenda_categories_event_id_name_index" ON "agenda_categories" USING btree ("event_id","name");
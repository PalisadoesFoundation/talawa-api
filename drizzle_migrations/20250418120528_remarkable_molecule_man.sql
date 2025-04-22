CREATE TABLE "action_categories" (
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"description" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_disabled" boolean NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"assigned_at" timestamp (3) with time zone NOT NULL,
	"assignee_id" uuid,
	"category_id" uuid,
	"completion_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"creator_id" uuid,
	"event_id" uuid,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_completed" boolean NOT NULL,
	"organization_id" uuid NOT NULL,
	"post_completion_notes" text,
	"pre_completion_notes" text,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "action_categories" ADD CONSTRAINT "action_categories_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_category_id_action_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."action_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "action_categories_created_at_index" ON "action_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "action_categories_creator_id_index" ON "action_categories" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "action_categories_name_index" ON "action_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "action_categories_name_organization_id_index" ON "action_categories" USING btree ("name","organization_id");--> statement-breakpoint
CREATE INDEX "actions_assigned_at_index" ON "actions" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "actions_assignee_id_index" ON "actions" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "actions_category_id_index" ON "actions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "actions_completion_at_index" ON "actions" USING btree ("completion_at");--> statement-breakpoint
CREATE INDEX "actions_created_at_index" ON "actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "actions_creator_id_index" ON "actions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "actions_organization_id_index" ON "actions" USING btree ("organization_id");
CREATE TABLE "event_volunteer_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"recurring_event_instance_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "event_volunteer_exceptions_volunteer_id_recurring_event_instance_id_unique" UNIQUE("volunteer_id","recurring_event_instance_id")
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_group_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_group_id" uuid NOT NULL,
	"recurring_event_instance_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "event_volunteer_group_exceptions_volunteer_group_id_recurring_event_instance_id_unique" UNIQUE("volunteer_group_id","recurring_event_instance_id")
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"recurring_event_instance_id" uuid,
	"leader_id" uuid NOT NULL,
	"creator_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"volunteers_required" integer,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
CREATE TABLE "event_volunteer_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"group_id" uuid,
	"event_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "event_volunteers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"recurring_event_instance_id" uuid,
	"creator_id" uuid,
	"has_accepted" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"hours_volunteered" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"updater_id" uuid
);
--> statement-breakpoint
DROP TABLE "volunteer_group_assignments" CASCADE;--> statement-breakpoint
DROP TABLE "volunteer_groups" CASCADE;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD CONSTRAINT "event_volunteer_exceptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD CONSTRAINT "event_volunteer_group_exceptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" ADD CONSTRAINT "event_volunteer_groups_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteer_memberships" ADD CONSTRAINT "event_volunteer_memberships_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_volunteers" ADD CONSTRAINT "event_volunteers_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteer_groups_event_id_name_recurring_event_instance_id_index" ON "event_volunteer_groups" USING btree ("event_id","name","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_created_at_index" ON "event_volunteer_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_event_id_index" ON "event_volunteer_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_leader_id_index" ON "event_volunteer_groups" USING btree ("leader_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_name_index" ON "event_volunteer_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_volunteer_groups_is_template_index" ON "event_volunteer_groups" USING btree ("is_template");--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteer_memberships_volunteer_id_group_id_event_id_index" ON "event_volunteer_memberships" USING btree ("volunteer_id","group_id","event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_created_at_index" ON "event_volunteer_memberships" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_event_id_index" ON "event_volunteer_memberships" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_volunteer_id_index" ON "event_volunteer_memberships" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "event_volunteer_memberships_status_index" ON "event_volunteer_memberships" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_volunteers_user_id_event_id_recurring_event_instance_id_index" ON "event_volunteers" USING btree ("user_id","event_id","recurring_event_instance_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_created_at_index" ON "event_volunteers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_volunteers_event_id_index" ON "event_volunteers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_user_id_index" ON "event_volunteers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_volunteers_has_accepted_index" ON "event_volunteers" USING btree ("has_accepted");--> statement-breakpoint
CREATE INDEX "event_volunteers_is_template_index" ON "event_volunteers" USING btree ("is_template");--> statement-breakpoint

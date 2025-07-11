CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recurrence_rule_string" text NOT NULL,
	"frequency" "frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"recurrence_start_date" timestamp (3) with time zone NOT NULL,
	"recurrence_end_date" timestamp (3) with time zone,
	"count" integer,
	"latest_instance_date" timestamp (3) with time zone NOT NULL,
	"by_day" text[],
	"by_month" integer[],
	"by_month_day" integer[],
	"base_recurring_event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"updater_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_base_recurring_event_id_events_id_fk" FOREIGN KEY ("base_recurring_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "rr_latest_instance_date_idx" ON "recurrence_rules" USING btree ("latest_instance_date");--> statement-breakpoint
CREATE INDEX "rr_organization_id_idx" ON "recurrence_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rr_base_recurring_event_id_idx" ON "recurrence_rules" USING btree ("base_recurring_event_id");--> statement-breakpoint
CREATE INDEX "rr_frequency_idx" ON "recurrence_rules" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "rr_creator_id_idx" ON "recurrence_rules" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "rr_recurrence_start_date_idx" ON "recurrence_rules" USING btree ("recurrence_start_date");--> statement-breakpoint
CREATE INDEX "rr_recurrence_end_date_idx" ON "recurrence_rules" USING btree ("recurrence_end_date");
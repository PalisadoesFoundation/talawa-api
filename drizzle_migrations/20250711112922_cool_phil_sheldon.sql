CREATE TABLE "event_exceptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_instance_id" uuid NOT NULL,
	"recurring_event_id" uuid NOT NULL,
	"instance_start_time" timestamp (3) with time zone NOT NULL,
	"exception_data" jsonb NOT NULL,
	"exception_type" "exception_type" NOT NULL,
	"organization_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"updater_id" uuid,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_event_instance_id_events_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_recurring_event_id_events_id_fk" FOREIGN KEY ("recurring_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_updater_id_users_id_fk" FOREIGN KEY ("updater_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ee_event_instance_id_idx" ON "event_exceptions" USING btree ("event_instance_id");--> statement-breakpoint
CREATE INDEX "ee_recurring_event_id_idx" ON "event_exceptions" USING btree ("recurring_event_id");--> statement-breakpoint
CREATE INDEX "ee_instance_start_time_idx" ON "event_exceptions" USING btree ("instance_start_time");--> statement-breakpoint
CREATE INDEX "ee_organization_id_idx" ON "event_exceptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ee_exception_type_idx" ON "event_exceptions" USING btree ("exception_type");--> statement-breakpoint
CREATE INDEX "ee_creator_id_idx" ON "event_exceptions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "ee_recurring_event_instance_idx" ON "event_exceptions" USING btree ("recurring_event_id","instance_start_time");
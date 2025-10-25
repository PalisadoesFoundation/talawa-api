CREATE TABLE "event_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid,
	"recurring_event_instance_id" uuid,
	"invited_by" uuid NOT NULL,
	"invitee_email" varchar(255) NOT NULL,
	"invitee_name" varchar(255),
	"user_id" uuid,
	"invitation_token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"responded_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_recurring_event_instance_id_recurring_event_instances_id_fk" FOREIGN KEY ("recurring_event_instance_id") REFERENCES "public"."recurring_event_instances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_invitations" ADD CONSTRAINT "event_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "event_invitations_event_id_idx" ON "event_invitations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_invitations_email_idx" ON "event_invitations" USING btree ("invitee_email");--> statement-breakpoint
CREATE INDEX "event_invitations_token_idx" ON "event_invitations" USING btree ("invitation_token");--> statement-breakpoint
CREATE INDEX "event_invitations_status_idx" ON "event_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_invitations_created_at_idx" ON "event_invitations" USING btree ("created_at");
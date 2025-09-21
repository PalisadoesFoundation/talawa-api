ALTER TABLE "event_volunteer_groups" DROP CONSTRAINT "event_volunteer_groups_recurring_event_instance_id_recurring_event_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "event_volunteers" DROP CONSTRAINT "event_volunteers_recurring_event_instance_id_recurring_event_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "event_volunteer_exceptions" ADD COLUMN "participating" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_volunteer_group_exceptions" ADD COLUMN "participating" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "event_volunteer_groups" DROP COLUMN "recurring_event_instance_id";--> statement-breakpoint
ALTER TABLE "event_volunteers" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "event_volunteers" DROP COLUMN "recurring_event_instance_id";
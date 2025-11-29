ALTER TABLE "actionitems" RENAME COLUMN "actor_id" TO "volunteer_id";--> statement-breakpoint
ALTER TABLE "actionitems" DROP CONSTRAINT "actionitems_actor_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "actionitems_actor_id_index";--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD COLUMN "volunteer_id" uuid;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD COLUMN "volunteer_group_id" uuid;--> statement-breakpoint
ALTER TABLE "actionitems" ADD COLUMN "volunteer_group_id" uuid;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitem_exceptions" ADD CONSTRAINT "actionitem_exceptions_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_volunteer_id_event_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."event_volunteers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actionitems" ADD CONSTRAINT "actionitems_volunteer_group_id_event_volunteer_groups_id_fk" FOREIGN KEY ("volunteer_group_id") REFERENCES "public"."event_volunteer_groups"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "actionitems_volunteer_id_index" ON "actionitems" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "actionitems_volunteer_group_id_index" ON "actionitems" USING btree ("volunteer_group_id");
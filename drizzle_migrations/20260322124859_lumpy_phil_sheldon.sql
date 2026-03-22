ALTER TABLE "families" DROP CONSTRAINT "families_organization_id_organizations_id_fk";
--> statement-breakpoint
DROP INDEX "families_name_index";--> statement-breakpoint
DROP INDEX "families_organization_id_index";--> statement-breakpoint
DROP INDEX "families_name_organization_id_index";--> statement-breakpoint
ALTER TABLE "family_memberships" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "family_memberships_organization_id_index" ON "family_memberships" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "families" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "families" DROP COLUMN "organization_id";
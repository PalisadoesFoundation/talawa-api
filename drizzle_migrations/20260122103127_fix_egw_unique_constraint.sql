DROP INDEX IF EXISTS "egw_organization_id_unique_idx";--> statement-breakpoint

-- Delete duplicate rows if any exist, keeping the row with the minimum id for each organization_id
DELETE FROM "event_generation_windows" a USING (
    SELECT MIN(id) as id, organization_id
    FROM "event_generation_windows" 
    GROUP BY organization_id HAVING COUNT(*) > 1
) b
WHERE a.organization_id = b.organization_id 
AND a.id <> b.id;--> statement-breakpoint

ALTER TABLE "event_generation_windows" ADD CONSTRAINT "egw_organization_id_unique" UNIQUE("organization_id");
-- Verify duplicates before enforcing uniqueness
-- (event_type, channel_type) pairs must be unique to apply the constraint.
SELECT
  event_type,
  channel_type,
  COUNT(*) AS duplicate_count
FROM "notification_templates"
GROUP BY event_type, channel_type
HAVING COUNT(*) > 1;

-- Deduplicate deterministically: keep the earliest created row per pair.
-- If created_at ties or is NULL, fall back to id ordering to ensure one row remains.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_type, channel_type
      ORDER BY created_at ASC NULLS FIRST, id ASC
    ) AS rn
  FROM "notification_templates"
)
DELETE FROM "notification_templates" AS nt
USING ranked
WHERE nt.id = ranked.id
  AND ranked.rn > 1;

-- Drizzle migrator runs migrations inside a transaction, so avoid CONCURRENTLY.
CREATE UNIQUE INDEX "notification_templates_event_type_channel_type_index"
  ON "notification_templates" USING btree ("event_type","channel_type");
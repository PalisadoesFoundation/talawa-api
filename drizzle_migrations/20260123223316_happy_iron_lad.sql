-- Abort migration if duplicates exist before enforcing uniqueness.
DO $$
DECLARE
  duplicate_pairs_count integer;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_pairs_count
  FROM (
    SELECT event_type, channel_type
    FROM "notification_templates"
    GROUP BY event_type, channel_type
    HAVING COUNT(*) > 1
  ) AS duplicate_pairs;

  IF duplicate_pairs_count > 0 THEN
    RAISE EXCEPTION
      'Found % duplicate (event_type, channel_type) pairs in notification_templates.',
      duplicate_pairs_count;
  END IF;
END $$;

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
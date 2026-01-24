-- Verify duplicates before enforcing uniqueness
-- (event_type, channel_type) pairs must be unique to apply the constraint.
SELECT
  event_type,
  channel_type,
  COUNT(*) AS duplicate_count
FROM "notification_templates"
GROUP BY event_type, channel_type
HAVING COUNT(*) > 1;

-- Deduplicate by keeping the oldest row per (event_type, channel_type).
-- If your deployment needs a different strategy, replace this with a targeted
-- migration or update seedInitialData behavior before applying the index.
DELETE FROM "notification_templates" AS nt
USING "notification_templates" AS keep
WHERE nt.event_type = keep.event_type
  AND nt.channel_type = keep.channel_type
  AND nt.id <> keep.id
  AND nt.created_at > keep.created_at;

-- Prefer concurrent index creation to avoid blocking writes.
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
CREATE UNIQUE INDEX CONCURRENTLY "notification_templates_event_type_channel_type_index"
  ON "notification_templates" USING btree ("event_type","channel_type");
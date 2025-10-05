-- Update notification_logs status default value from 'delivered' to 'created'
ALTER TABLE "notification_logs" ALTER COLUMN "status" SET DEFAULT 'created';
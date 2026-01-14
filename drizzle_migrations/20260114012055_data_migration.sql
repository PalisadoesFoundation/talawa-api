-- Data Migration: Mark existing users as verified
-- This prevents existing test users from being locked out
-- Run this AFTER running the schema migration (20260114012055_swift_maginty.sql)

UPDATE users 
SET is_email_address_verified = true 
WHERE created_at < '2026-01-14 00:00:00+00' 
  AND is_email_address_verified = false;

-- Optional: Add comment explaining why these users are pre-verified
-- This is safe because they are existing users who registered before
-- email verification was implemented

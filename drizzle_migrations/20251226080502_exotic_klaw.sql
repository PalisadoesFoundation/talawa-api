DROP INDEX IF EXISTS "password_reset_tokens_token_hash_idx";-->statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" DROP NOT NULL;-->statement-breakpoint
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_token_hash_unique";-->statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash");
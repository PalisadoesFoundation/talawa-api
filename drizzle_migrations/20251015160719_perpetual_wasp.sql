ALTER TABLE "chats" ADD COLUMN "type" text DEFAULT 'group' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "direct_participants_hash" text;